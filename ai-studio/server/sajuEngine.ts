import { Solar, Lunar } from 'lunar-typescript';
import type {
  BirthInput,
  FiveElement,
  SajuAnalysisResult,
  SajuPillar,
} from '../src/types/naming.ts';
import { getKnowledgeBase } from './dataLoader.ts';

const ELEMENT_GENERATES: Record<FiveElement, FiveElement> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

const ELEMENT_GENERATED_BY: Record<FiveElement, FiveElement> = {
  목: '수',
  화: '목',
  토: '화',
  금: '토',
  수: '금',
};

const ELEMENT_CONTROLS: Record<FiveElement, FiveElement> = {
  목: '토',
  화: '금',
  토: '수',
  금: '목',
  수: '화',
};

const ELEMENT_CONTROLLED_BY: Record<FiveElement, FiveElement> = {
  목: '금',
  화: '수',
  토: '목',
  금: '화',
  수: '토',
};

// Known historical Korean DST intervals (month-day approximations aligned with IANA Asia/Seoul & 대한민국_DST_rules.csv)
const KOREA_DST_RANGES: Array<[string, string]> = [
  ['1948-06-01', '1948-09-12'],
  ['1949-04-03', '1949-09-10'],
  ['1950-04-01', '1950-09-09'],
  ['1951-05-06', '1951-09-08'],
  ['1955-05-05', '1955-09-08'],
  ['1956-05-20', '1956-09-29'],
  ['1957-05-05', '1957-09-21'],
  ['1958-05-04', '1958-09-20'],
  ['1959-05-03', '1959-09-19'],
  ['1960-05-01', '1960-09-17'],
  ['1987-05-10', '1987-10-11'],
  ['1988-05-08', '1988-10-09'],
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isHistoricalDstDate(year: number, month: number, day: number): boolean {
  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  return KOREA_DST_RANGES.some(([start, end]) => ymd >= start && ymd <= end);
}

function getHistoricalStandardMeridianOffsetMinutes(year: number, month: number, day: number): {
  utcOffsetLabel: string;
  diffFromKst9Minutes: number;
  note: string;
} {
  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  if (ymd >= '1954-03-21' && ymd <= '1961-08-09') {
    return {
      utcOffsetLabel: 'UTC+08:30',
      diffFromKst9Minutes: 30, // 8:30 -> 9:00 equivalent (+30m to align with 135E standard, or -2m from 127.5E)
      note: '1954~1961년 대한민국 동경 127.5° 표준시(UTC+8:30) 적용 시기',
    };
  }
  if (ymd >= '1908-04-01' && ymd <= '1911-12-31') {
    return {
      utcOffsetLabel: 'UTC+08:30',
      diffFromKst9Minutes: 30,
      note: '1908~1911년 대한제국 표준시(UTC+8:30) 적용 시기',
    };
  }
  return {
    utcOffsetLabel: 'UTC+09:00',
    diffFromKst9Minutes: 0,
    note: '동경 135° 표준시(UTC+09:00) 기준',
  };
}

export function analyzeSaju(input: BirthInput): SajuAnalysisResult {
  const kb = getKnowledgeBase();

  // 1. Convert Lunar -> Solar if requested
  let solarBase: Solar;
  if (input.calendarType === 'lunar') {
    const lunarMonth = input.isLeapMonth ? -Math.abs(input.month) : Math.abs(input.month);
    const lunar = Lunar.fromYmd(input.year, lunarMonth, input.day);
    solarBase = lunar.getSolar();
  } else {
    solarBase = Solar.fromYmd(input.year, input.month, input.day);
  }

  const baseYear = solarBase.getYear();
  const baseMonth = solarBase.getMonth();
  const baseDay = solarBase.getDay();
  const rawHour = input.timeUnknown ? 12 : input.hour;
  const rawMinute = input.timeUnknown ? 0 : input.minute;

  // 2. Historical Korea standard time & DST & optional True Solar Time adjustment
  const stdInfo = getHistoricalStandardMeridianOffsetMinutes(baseYear, baseMonth, baseDay);
  const dstApplied = !input.timeUnknown && isHistoricalDstDate(baseYear, baseMonth, baseDay);

  let totalShiftMinutes = 0;
  if (!input.timeUnknown) {
    if (dstApplied) {
      totalShiftMinutes -= 60;
    }
    if (input.useTrueSolarTime) {
      // If local clock was UTC+8:30 (127.5E), Seoul (127.0E) is only -2m from 127.5E,
      // whereas for UTC+9:00 (135E), Seoul (127.0E) is -32m.
      if (stdInfo.utcOffsetLabel === 'UTC+08:30') {
        totalShiftMinutes += input.longitudeOffsetMinutes + 30;
      } else {
        totalShiftMinutes += input.longitudeOffsetMinutes;
      }
    } else if (stdInfo.utcOffsetLabel === 'UTC+08:30') {
      // Standardize clock time to UTC+9 solar-term comparison frame if not using true solar time
      totalShiftMinutes += 30;
    }
  }

  const localDate = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay, rawHour, rawMinute, 0));
  const adjustedDate = new Date(localDate.getTime() + totalShiftMinutes * 60_000);

  const adjY = adjustedDate.getUTCFullYear();
  const adjM = adjustedDate.getUTCMonth() + 1;
  const adjD = adjustedDate.getUTCDate();
  const adjH = adjustedDate.getUTCHours();
  const adjMin = adjustedDate.getUTCMinutes();

  const solarAdjusted = Solar.fromYmdHms(adjY, adjM, adjD, adjH, adjMin, 0);
  const lunarAdjusted = solarAdjusted.getLunar();
  const eightChar = lunarAdjusted.getEightChar();

  // Day boundary rule: 2 = midnight day change (자시 일괄 익일/00시 기준), 1 = late-zi (23:00부터 다음날 일주)
  eightChar.setSect(input.ziHourMethod === 'midnight' ? 2 : 1);

  const dayStem = eightChar.getDayGan();
  const dayStemInfo = kb.stemsInfo.get(dayStem) ?? {
    hangul: dayStem,
    hanja: dayStem,
    yinYang: '양' as const,
    element: '목' as FiveElement,
  };

  const rawPillars = [
    { label: '년주', gan: eightChar.getYearGan(), zhi: eightChar.getYearZhi() },
    { label: '월주', gan: eightChar.getMonthGan(), zhi: eightChar.getMonthZhi() },
    { label: '일주', gan: eightChar.getDayGan(), zhi: eightChar.getDayZhi() },
  ];
  if (!input.timeUnknown) {
    rawPillars.push({ label: '시주', gan: eightChar.getTimeGan(), zhi: eightChar.getTimeZhi() });
  }

  const elementCounts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const hiddenWeightedCounts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  const pillars: SajuPillar[] = rawPillars.map((p, idx) => {
    const stemInfo = kb.stemsInfo.get(p.gan)!;
    const branchInfo = kb.branchesInfo.get(p.zhi)!;
    const hiddenRaw = kb.hiddenStemsMap.get(p.zhi) || [];
    const mainHidden = hiddenRaw[0];

    elementCounts[stemInfo.element] += 1;
    elementCounts[branchInfo.element] += 1;

    hiddenWeightedCounts[stemInfo.element] += 1.0;
    hiddenWeightedCounts[branchInfo.element] += idx === 1 ? 1.5 : 1.0;

    const stemTenGod =
      idx === 2 ? '일간(본인)' : kb.tenGodMap.get(`${dayStem}|${p.gan}`) || '';
    const branchTenGod = mainHidden
      ? kb.tenGodMap.get(`${dayStem}|${mainHidden.stem}`) || ''
      : '';
    const twelveStage = kb.twelveStagesMap.get(`${dayStem}|${p.zhi}`) || '';

    const hiddenStems = hiddenRaw.map((h) => ({
      stem: h.stem,
      hangul: h.hangul,
      element: h.element,
      role: h.role,
      tenGod: kb.tenGodMap.get(`${dayStem}|${h.stem}`) || '',
    }));

    return {
      label: p.label,
      stem: p.gan,
      stemHangul: stemInfo.hangul,
      stemElement: stemInfo.element,
      stemYinYang: stemInfo.yinYang,
      stemTenGod,
      branch: p.zhi,
      branchHangul: branchInfo.hangul,
      branchElement: branchInfo.element,
      branchYinYang: branchInfo.yinYang,
      branchTenGod,
      hiddenStems,
      twelveStage,
    };
  });

  // 3. Detect stem combos & branch interactions (합충형파해)
  const stems = pillars.map((p) => p.stem);
  const branches = pillars.map((p) => p.branch);
  const interactions: string[] = [];

  for (const sc of kb.stemCombos) {
    if (stems.includes(sc.s1) && stems.includes(sc.s2)) {
      interactions.push(`천간합 ${sc.name} (${sc.element} 합화 가능성·조건별 판단)`);
    }
  }
  for (const bc of kb.branchClashes) {
    if (branches.includes(bc.b1) && branches.includes(bc.b2)) {
      interactions.push(`지지충 ${bc.b1}${bc.b2}충`);
    }
  }
  for (const b6 of kb.branchSixCombos) {
    if (branches.includes(b6.b1) && branches.includes(b6.b2)) {
      interactions.push(`지지육합 ${b6.b1}${b6.b2}합`);
    }
  }
  for (const b3 of kb.branchThreeCombos) {
    if (branches.includes(b3.b1) && branches.includes(b3.b2) && branches.includes(b3.b3)) {
      interactions.push(`지지삼합 ${b3.b1}${b3.b2}${b3.b3} (${b3.element}국)`);
    }
  }
  for (const bd of kb.branchDirectionalCombos) {
    if (branches.includes(bd.b1) && branches.includes(bd.b2) && branches.includes(bd.b3)) {
      interactions.push(`지지방합 ${bd.b1}${bd.b2}${bd.b3} (${bd.element}방)`);
    }
  }
  for (const bp of kb.branchPunishments) {
    if (bp.b3) {
      if (branches.includes(bp.b1) && branches.includes(bp.b2) && branches.includes(bp.b3)) {
        interactions.push(`지지삼형 ${bp.b1}${bp.b2}${bp.b3} (${bp.label})`);
      }
    } else if (branches.includes(bp.b1) && branches.includes(bp.b2)) {
      interactions.push(`지지상형 ${bp.b1}${bp.b2} (${bp.label})`);
    }
  }
  for (const bh of kb.branchHarms) {
    if (branches.includes(bh.b1) && branches.includes(bh.b2)) {
      interactions.push(`지지해 ${bh.b1}${bh.b2}해`);
    }
  }

  // 4. Boundary checks (solar terms within 60m, or midnight/23:00 boundary)
  const boundaryWarnings: string[] = [];
  let alternateBoundaryNote: string | null = null;

  if (input.timeUnknown) {
    boundaryWarnings.push('출생 시각 미입력(시간 모름)으로 시주를 제외한 3기둥(년·월·일주) 기준으로 분석했습니다.');
  } else {
    const prevJie = lunarAdjusted.getPrevJieQi();
    const nextJie = lunarAdjusted.getNextJieQi();
    const checkJie = (name: string, jieSolar: Solar) => {
      const jieUtc = Date.UTC(
        jieSolar.getYear(),
        jieSolar.getMonth() - 1,
        jieSolar.getDay(),
        jieSolar.getHour(),
        jieSolar.getMinute(),
        jieSolar.getSecond()
      );
      const diffMinutes = Math.abs(adjustedDate.getTime() - jieUtc) / 60_000;
      if (diffMinutes <= 60) {
        boundaryWarnings.push(
          `절기 경계 인접: ${name}(${jieSolar.toYmdHms()})와 ${Math.round(diffMinutes)}분 차이입니다. KASI 공식 월력요항과 교차 확인을 권장합니다.`
        );
      }
    };
    if (prevJie) checkJie(prevJie.getName(), prevJie.getSolar());
    if (nextJie) checkJie(nextJie.getName(), nextJie.getSolar());

    if (adjH === 23 || adjH === 0) {
      const altEc = solarAdjusted.getLunar().getEightChar();
      altEc.setSect(input.ziHourMethod === 'midnight' ? 1 : 2);
      const altDay = `${altEc.getDayGan()}${altEc.getDayZhi()}`;
      const curDay = `${eightChar.getDayGan()}${eightChar.getDayZhi()}`;
      if (altDay !== curDay) {
        alternateBoundaryNote = `자시 경계(${pad2(adjH)}:${pad2(adjMin)}) 출생으로, ${
          input.ziHourMethod === 'midnight' ? '야자시/조자시(23시 일주 변경)' : '자정(00시 일주 변경)'
        } 학파 적용 시 일주가 ${altDay}로 달라집니다.`;
        boundaryWarnings.push(alternateBoundaryNote);
      }
    }
  }

  // 5. Day master strength & Yongsin candidate reasoning (억부 + 조후 분리)
  const dmEl = dayStemInfo.element;
  const resourceEl = ELEMENT_GENERATED_BY[dmEl];
  const outputEl = ELEMENT_GENERATES[dmEl];
  const wealthEl = ELEMENT_CONTROLS[dmEl];
  const officerEl = ELEMENT_CONTROLLED_BY[dmEl];

  const supportWeight = hiddenWeightedCounts[dmEl] + hiddenWeightedCounts[resourceEl];
  const drainWeight =
    hiddenWeightedCounts[outputEl] +
    hiddenWeightedCounts[wealthEl] +
    hiddenWeightedCounts[officerEl];

  let dayMasterStrength: '신강' | '중화' | '신약' = '중화';
  let eokbuYongsinCandidates: FiveElement[] = [];
  let strengthNote = '';

  if (supportWeight >= drainWeight + 1.2) {
    dayMasterStrength = '신강';
    eokbuYongsinCandidates = [officerEl, outputEl, wealthEl];
    strengthNote = `일간(${dayStemInfo.hanja}·${dmEl})을 돕는 비겁(${dmEl})·인성(${resourceEl}) 기운이 상대적으로 강해 설기·조절하는 ${outputEl}·${wealthEl}·${officerEl} 오행을 억부용신 후보로 제시합니다.`;
  } else if (drainWeight >= supportWeight + 1.2) {
    dayMasterStrength = '신약';
    eokbuYongsinCandidates = [resourceEl, dmEl];
    strengthNote = `일간(${dayStemInfo.hanja}·${dmEl})을 소모·극제하는 기운이 우세하여 일간을 생조하는 인성(${resourceEl})과 비겁(${dmEl}) 오행을 억부용신 후보로 제시합니다.`;
  } else {
    dayMasterStrength = '중화';
    const sorted = (Object.entries(elementCounts) as Array<[FiveElement, number]>).sort(
      (a, b) => a[1] - b[1]
    );
    eokbuYongsinCandidates = [sorted[0][0], sorted[1][0]];
    strengthNote = `일간과 주위 오행이 비교적 균형(중화)에 가까우며, 상대적으로 분포가 적은 ${sorted[0][0]}·${sorted[1][0]} 오행이나 계절 조후를 우선 보완 후보로 살핍니다.`;
  }

  const monthBranch = pillars[1].branch;
  let johuNote = '월지 계절의 한난조습(조후)은 억부용신과 별도 레이어로 함께 점검하는 것이 좋습니다.';
  if (['亥', '子', '丑'].includes(monthBranch)) {
    johuNote = '겨울(亥·子·丑월) 출생으로 한랭한 기운을 따뜻하게 데워주는 화(火) 기운을 조후 관점에서 긍정적으로 봅니다.';
  } else if (['巳', '午', '未'].includes(monthBranch)) {
    johuNote = '여름(巳·午·未월) 출생으로 열기를 식히고 윤택하게 하는 수(水) 기운을 조후 관점에서 중요하게 살핍니다.';
  } else if (['寅', '卯', '辰'].includes(monthBranch)) {
    johuNote = '봄(寅·卯·辰월) 출생으로 만물이 자라나는 시기이며, 일간과 화(火)·수(水)의 조화를 함께 살핍니다.';
  } else if (['申', '酉', '戌'].includes(monthBranch)) {
    johuNote = '가을(申·酉·戌월) 출생으로 금기가 숙살하는 계절이라 화(火)·수(水)·목(木)의 조화를 조후 관점에서 확인합니다.';
  }

  const elementsOrder: FiveElement[] = ['목', '화', '토', '금', '수'];
  const missingElements = elementsOrder.filter((el) => elementCounts[el] === 0);
  const excessElements = elementsOrder.filter((el) => elementCounts[el] >= 3);

  const solarDateLabel = `${baseYear}-${pad2(baseMonth)}-${pad2(baseDay)}`;
  const lunarObj = solarBase.getLunar();
  const lunarDateLabel = `${lunarObj.getYear()}년 ${lunarObj.getMonth() < 0 ? '윤' : ''}${Math.abs(
    lunarObj.getMonth()
  )}월 ${lunarObj.getDay()}일`;

  return {
    normalizedIsoLocal: `${solarDateLabel} ${input.timeUnknown ? '시간미상' : `${pad2(rawHour)}:${pad2(rawMinute)}`}`,
    historicalTimeNote: `${stdInfo.note}${dstApplied ? ' · 일광절약시간제(DST -1시간 보정 적용)' : ''}`,
    utcOffsetApplied: stdInfo.utcOffsetLabel,
    dstApplied,
    trueSolarTimeApplied: input.useTrueSolarTime && !input.timeUnknown,
    adjustedTimeLabel: input.timeUnknown
      ? '시간 미상 (년·월·일 3주 산출)'
      : `${adjY}-${pad2(adjM)}-${pad2(adjD)} ${pad2(adjH)}:${pad2(adjMin)}`,
    solarDateLabel,
    lunarDateLabel,
    pillars,
    dayMaster: {
      stem: dayStemInfo.hanja,
      hangul: dayStemInfo.hangul,
      element: dayStemInfo.element,
      yinYang: dayStemInfo.yinYang,
    },
    elementCounts,
    hiddenWeightedCounts,
    missingElements,
    excessElements,
    dayMasterStrength,
    strengthNote,
    eokbuYongsinCandidates,
    johuNote,
    interactions,
    boundaryWarnings,
    alternateBoundaryNote,
  };
}
