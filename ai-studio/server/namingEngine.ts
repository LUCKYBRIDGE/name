import type {
  FiveElement,
  HanjaRecord,
  LuckGrade,
  NameCandidateRequest,
  NameCharacterEvaluation,
  NameEvaluation,
  NameRecommendResponse,
  NumerologyGrid,
  SajuAnalysisResult,
  StrokeMethodId,
} from '../src/types/naming.ts';
import { getKnowledgeBase } from './dataLoader.ts';

interface SuliEntry {
  title: string;
  grade: LuckGrade;
  summary: string;
}

// Traditional 81-numerology luck table (원·형·이·정 4격 공통 참조표)
const SULI_81_TABLE: Record<number, SuliEntry> = {
  1: { title: '태초수(太初數)', grade: '대길', summary: '만물의 시작이자 대지·자립·성공을 상징하는 원만한 길수' },
  2: { title: '분리수(分離數)', grade: '흉', summary: '의지가 흔들리기 쉽고 고독·이별의 기운이 있는 수' },
  3: { title: '형통수(亨通數)', grade: '대길', summary: '지혜와 덕망이 조화를 이루어 발전과 명예를 얻는 길수' },
  4: { title: '파멸수(破滅數)', grade: '흉', summary: '노력에 비해 장애와 굴곡이 잦아 신중함이 요구되는 수' },
  5: { title: '복록수(福祿數)', grade: '대길', summary: '음양의 조화와 재복·건강·신뢰가 두루 따르는 큰 길수' },
  6: { title: '안정수(安定數)', grade: '대길', summary: '온화한 덕성과 귀인의 도움으로 집안과 일이 편안한 길수' },
  7: { title: '강건수(剛健數)', grade: '길', summary: '추진력과 독립심이 강해 목표를 끝내 성취하는 수' },
  8: { title: '근면수(勤勉數)', grade: '길', summary: '성실함과 인내로 점진적인 발전과 안정을 이루는 수' },
  9: { title: '궁박수(窮迫數)', grade: '흉', summary: '재능은 있으나 내면 갈등과 변동수가 큰 수' },
  10: { title: '공허수(空虛數)', grade: '흉', summary: '겉은 화려하나 실속이 흩어지기 쉬운 수' },
  11: { title: '신성수(新成數)', grade: '대길', summary: '봄날의 새싹처럼 꾸준히 뻗어 나가며 대업을 이루는 길수' },
  12: { title: '박약수(薄弱數)', grade: '흉', summary: '기초가 약해 외풍에 흔들리기 쉬운 수' },
  13: { title: '지모수(智謀數)', grade: '대길', summary: '총명함과 창의력, 대인 친화력으로 인정받는 길수' },
  14: { title: '파산수(破散數)', grade: '흉', summary: '재물과 인연이 흩어지기 쉬워 절제가 필요한 수' },
  15: { title: '통솔수(統率數)', grade: '대길', summary: '인덕과 포용력으로 많은 사람의 신뢰를 모으는 대길수' },
  16: { title: '덕망수(德望數)', grade: '대길', summary: '덕과 명망이 높아 어려움을 극복하고 귀함을 얻는 길수' },
  17: { title: '건창수(健暢數)', grade: '길', summary: '강단 있는 결단력으로 난관을 돌파하여 성취하는 수' },
  18: { title: '발전수(發展數)', grade: '길', summary: '지조와 실행력이 돋보이며 실질적 성과를 거두는 길수' },
  19: { title: '고난수(苦難數)', grade: '흉', summary: '재주는 뛰어나나 돌발 변수와 고독이 따르기 쉬운 수' },
  20: { title: '허망수(虛望數)', grade: '흉', summary: '계획이 중도에 어긋나기 쉬워 차분한 관리가 필요한 수' },
  21: { title: '두령수(頭領數)', grade: '대길', summary: '지도력과 독립 정신이 뚜렷하여 한 분야의 으뜸이 되는 길수' },
  22: { title: '추초수(秋草數)', grade: '흉', summary: '의욕은 있으나 끝맺음이 약해지기 쉬운 수' },
  23: { title: '융창수(隆昌數)', grade: '대길', summary: '태양처럼 기세가 왕성하여 크게 이름을 드높이는 길수' },
  24: { title: '입신수(立身數)', grade: '대길', summary: '재복과 지혜가 겸비되어 자수성가하고 가정이 화목한 대길수' },
  25: { title: '영민수(英敏數)', grade: '길', summary: '총명하고 세련된 감각으로 안정적 발전을 이루는 길수' },
  26: { title: '파란수(波瀾數)', grade: '반길반흉', summary: '재능과 파란이 공존하여 변화가 큰 영웅형 수' },
  27: { title: '중단수(中斷數)', grade: '반길반흉', summary: '주관이 강해 시비가 따를 수 있으나 의지로 극복하는 수' },
  28: { title: '풍파수(風波數)', grade: '흉', summary: '이동과 변동이 잦고 고독감이 생기기 쉬운 수' },
  29: { title: '성공수(成功數)', grade: '길', summary: '지략과 추진력으로 명성과 재물을 모으는 길수' },
  30: { title: '부침수(浮沈數)', grade: '반길반흉', summary: '기복이 있어 겸손과 꾸준함이 동반되어야 길한 수' },
  31: { title: '융성수(隆盛數)', grade: '대길', summary: '지혜·덕망·인복이 조화롭게 어우러져 번영하는 대표 길수' },
  32: { title: '요행수(僥倖數)', grade: '대길', summary: '뜻밖의 행운과 귀인의 조력이 따르는 부드러운 길수' },
  33: { title: '승천수(昇天數)', grade: '대길', summary: '기개가 호탕하고 권위와 명예를 크게 얻는 대길수' },
  34: { title: '파가수(破家數)', grade: '흉', summary: '근심과 시련이 겹치기 쉬워 조화가 필요한 수' },
  35: { title: '평화수(平和數)', grade: '대길', summary: '온화하고 지적인 품성으로 평안한 발전을 이루는 길수' },
  36: { title: '풍랑수(風浪數)', grade: '반길반흉', summary: '의협심은 있으나 굴곡이 생기기 쉬운 수' },
  37: { title: '인덕수(仁德數)', grade: '대길', summary: '성실함과 덕망으로 주변의 신망을 두텁게 얻는 길수' },
  38: { title: '문예수(文藝數)', grade: '반길반흉', summary: '학문·예술적 재능은 뛰어나나 추진력 보완이 필요한 길수' },
  39: { title: '장수수(長壽數)', grade: '대길', summary: '부와 명예를 함께 누리며 기틀이 탄탄한 길수' },
  40: { title: '퇴안수(退安數)', grade: '반길반흉', summary: '모험보다 안정을 지킬 때 평온해지는 수' },
  41: { title: '대덕수(大德數)', grade: '대길', summary: '큰 덕망과 실력을 겸비해 존경과 번영을 누리는 길수' },
  42: { title: '다능수(多能數)', grade: '반길반흉', summary: '다재다능하나 한 우물을 파는 집중력이 필요한 수' },
  43: { title: '산재수(散財數)', grade: '반길반흉', summary: '외양은 좋으나 내실 관리가 필요한 수' },
  44: { title: '고뇌수(苦惱數)', grade: '흉', summary: '생각이 많아 실행이 더디고 심적 부담이 큰 수' },
  45: { title: '순풍수(順風數)', grade: '대길', summary: '순풍에 돛 단 듯 장애를 넘어 크게 성취하는 길수' },
  46: { title: '부족수(不足數)', grade: '흉', summary: '노력에 비해 결실이 더뎌 인내가 필요한 수' },
  47: { title: '출세수(出世數)', grade: '대길', summary: '꽃이 활짝 피듯 귀인의 도움으로 크게 발전하는 길수' },
  48: { title: '고문수(顧問數)', grade: '대길', summary: '지략과 덕망으로 많은 이의 스승·조언자가 되는 길수' },
  49: { title: '변화수(變化數)', grade: '반길반흉', summary: '성패의 갈림길이 잦아 신중한 선택이 중요한 수' },
  50: { title: '성패수(成敗數)', grade: '반길반흉', summary: '길함과 흉함이 반반 교차하는 변화의 수' },
  51: { title: '일성수(一盛數)', grade: '반길반흉', summary: '성장과 휴식이 번갈아 오는 안정형 수' },
  52: { title: '선견수(先見數)', grade: '길', summary: '앞을 내다보는 통찰력으로 기회를 잡아 번영하는 길수' },
  53: { title: '내허수(內虛數)', grade: '반길반흉', summary: '겉과 속의 균형을 맞추어야 길해지는 수' },
  54: { title: '불화수(不和數)', grade: '흉', summary: '주변과의 불협화음을 경계해야 하는 수' },
  55: { title: '외길수(外吉數)', grade: '반길반흉', summary: '겉은 풍족하나 내적 고충을 다스려야 하는 수' },
  56: { title: '불성수(不成數)', grade: '흉', summary: '마무리가 약해지기 쉬워 꾸준함이 요구되는 수' },
  57: { title: '강직수(剛直數)', grade: '길', summary: '초년의 고비를 딛고 중년 이후 크게 일어서는 길수' },
  58: { title: '만성수(晩成數)', grade: '길', summary: '후반기로 갈수록 복록이 두터워지는 대기만성형 길수' },
  59: { title: '불안수(不安數)', grade: '흉', summary: '결단력 부족으로 주저하기 쉬운 수' },
  60: { title: '암흑수(暗黑數)', grade: '흉', summary: '방향 설정이 모호해지기 쉬운 수' },
  61: { title: '명리수(名利數)', grade: '길', summary: '명예와 실리가 함께 따르나 겸손이 중요한 길수' },
  62: { title: '쇠퇴수(衰退數)', grade: '흉', summary: '기운이 점차 흩어지기 쉬워 보완이 필요한 수' },
  63: { title: '안락수(安樂數)', grade: '대길', summary: '막힘 없이 순탄하고 가정과 사업이 번창하는 길수' },
  64: { title: '침체수(沈滯數)', grade: '흉', summary: '진전이 더디고 변동이 잦은 수' },
  65: { title: '장구수(長久數)', grade: '대길', summary: '부귀와 평안이 오래 이어지며 자손까지 복이 미치는 길수' },
  66: { title: '진퇴수(進退數)', grade: '흉', summary: '앞뒤가 막혀 답답함을 느끼기 쉬운 수' },
  67: { title: '통달수(通達數)', grade: '대길', summary: '윗사람의 신뢰와 천운이 함께해 뜻을 이루는 길수' },
  68: { title: '발명수(發明數)', grade: '대길', summary: '치밀한 지혜와 성실함으로 큰 업적을 세우는 길수' },
  69: { title: '동요수(動搖數)', grade: '흉', summary: '안정감이 부족하여 수양이 필요한 수' },
  70: { title: '공망수(空亡數)', grade: '흉', summary: '열매가 맺히기 어려운 허전한 기운의 수' },
  71: { title: '허실수(虛實數)', grade: '반길반흉', summary: '실행력을 갖추면 길하게 전환되는 수' },
  72: { title: '고락수(苦樂數)', grade: '반길반흉', summary: '기쁨과 근심이 교차하는 수' },
  73: { title: '무욕수(無慾數)', grade: '길', summary: '욕심 없이 성실하게 나아가 복을 받는 무난한 수' },
  74: { title: '무능수(無能數)', grade: '흉', summary: '적극성이 떨어지기 쉬운 수' },
  75: { title: '수분수(守分數)', grade: '반길반흉', summary: '분수를 지키면 평안하나 무리하면 불리한 수' },
  76: { title: '이산수(離散數)', grade: '흉', summary: '인연과 재물이 흩어지기 쉬운 수' },
  77: { title: '고진수(苦盡數)', grade: '반길반흉', summary: '초반 고생 끝에 안정을 찾는 수' },
  78: { title: '만고수(晩苦數)', grade: '반길반흉', summary: '중년의 성취를 말년까지 잘 지켜야 하는 수' },
  79: { title: '박약수(薄弱數)', grade: '흉', summary: '추진력과 신뢰를 더욱 쌓아야 하는 수' },
  80: { title: '공수수(空手數)', grade: '흉', summary: '크게 시작해도 손에 남기기 어려운 수' },
  81: { title: '환원수(還元數)', grade: '대길', summary: '1수의 기운으로 되돌아가 새로운 번영을 여는 대길수' },
};

const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
const JUNGSEONG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];
const JONGSEONG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const CHOSEONG_ELEMENT: Record<string, FiveElement> = {
  ㄱ: '목', ㄲ: '목', ㅋ: '목',
  ㄴ: '화', ㄷ: '화', ㄸ: '화', ㄹ: '화', ㅌ: '화',
  ㅇ: '토', ㅎ: '토',
  ㅅ: '금', ㅆ: '금', ㅈ: '금', ㅉ: '금', ㅊ: '금',
  ㅁ: '수', ㅂ: '수', ㅃ: '수', ㅍ: '수',
};

const CHOSEONG_ROMAN: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm',
  ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj',
  ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
};

const JUNGSEONG_ROMAN: Record<string, string> = {
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo',
  ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u',
  ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i',
};

const JONGSEONG_ROMAN: Record<string, string> = {
  '': '', ㄱ: 'k', ㄲ: 'k', ㄳ: 'k', ㄴ: 'n', ㄵ: 'n', ㄶ: 'n', ㄷ: 't',
  ㄹ: 'l', ㄺ: 'k', ㄻ: 'm', ㄼ: 'l', ㄽ: 'l', ㄾ: 'l', ㄿ: 'p', ㅀ: 'l',
  ㅁ: 'm', ㅂ: 'p', ㅄ: 'p', ㅅ: 't', ㅆ: 't', ㅇ: 'ng', ㅈ: 't', ㅊ: 't',
  ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 't',
};

export function decomposeHangul(syllable: string): {
  onset: string;
  nucleus: string;
  coda: string;
} | null {
  if (!syllable) return null;
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  const onsetIdx = Math.floor(code / (21 * 28));
  const nucleusIdx = Math.floor((code % (21 * 28)) / 28);
  const codaIdx = code % 28;
  return {
    onset: CHOSEONG_LIST[onsetIdx],
    nucleus: JUNGSEONG_LIST[nucleusIdx],
    coda: JONGSEONG_LIST[codaIdx],
  };
}

export function getSoundElement(syllable: string): FiveElement | null {
  const parts = decomposeHangul(syllable.trim());
  if (!parts) return null;
  return CHOSEONG_ELEMENT[parts.onset] ?? null;
}

export function romanizeSyllable(syllable: string): string {
  const parts = decomposeHangul(syllable.trim());
  if (!parts) return syllable;
  return `${CHOSEONG_ROMAN[parts.onset] ?? ''}${JUNGSEONG_ROMAN[parts.nucleus] ?? ''}${
    JONGSEONG_ROMAN[parts.coda] ?? ''
  }`;
}

export function romanizeKoreanName(
  given1: string,
  given2: string,
  surnameRoman = 'Seo'
): string {
  const p1 = romanizeSyllable(given1);
  const p2 = romanizeSyllable(given2);
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const sPart = surnameRoman.trim() || 'Seo';
  if (!p2) return `${sPart} ${cap(p1)}`;
  return `${sPart} ${cap(p1)}-${p2}`;
}

const GENERATES: Record<FiveElement, FiveElement> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

export function getElementRelation(from: FiveElement, to: FiveElement): '상생' | '비화' | '상극' {
  if (from === to) return '비화';
  if (GENERATES[from] === to || GENERATES[to] === from) return '상생';
  return '상극';
}

function reduceTo81(n: number): number {
  if (n <= 0) return 1;
  const mod = n % 81;
  return mod === 0 ? 81 : mod;
}

function makeGrid(
  key: 'won' | 'hyeong' | 'i' | 'jeong',
  name: string,
  period: string,
  formula: string,
  value: number
): NumerologyGrid {
  const reduced = reduceTo81(value);
  const entry = SULI_81_TABLE[reduced] || {
    title: `${reduced}수`,
    grade: '반길반흉' as LuckGrade,
    summary: '해설 없음',
  };
  return {
    key,
    name,
    period,
    formula,
    value,
    reduced81: reduced,
    title: entry.title,
    grade: entry.grade,
    summary: entry.summary,
  };
}

export function evaluateName(params: {
  surnameHangul?: string;
  surnameHanja?: string;
  surnameStrokeOverride: number | null;
  strokeMethod: StrokeMethodId;
  hangul1: string;
  hanja1: string;
  hangul2: string;
  hanja2: string;
  saju?: SajuAnalysisResult | null;
}): NameEvaluation {
  const kb = getKnowledgeBase();
  const requestedHanja = (params.surnameHanja || '').trim();
  const requestedHangul = (params.surnameHangul || '').trim();

  const surnameProfile =
    (requestedHanja ? kb.surnameByHanja.get(requestedHanja) : undefined) ??
    (requestedHangul
      ? kb.surnames.find((s) => s.hangul === requestedHangul)
      : undefined) ??
    kb.surnameByHanja.get('徐');

  const sHangul = requestedHangul || surnameProfile?.hangul || '서';
  const sHanja = requestedHanja || surnameProfile?.hanja || '徐';
  const sHanjaRec = sHanja ? kb.hanjaByChar.get(sHanja) ?? null : null;

  const sUnihan =
    surnameProfile?.technicalTotalStrokes ?? sHanjaRec?.unihanTotalStrokes ?? 10;
  const sWonhoek =
    sHanjaRec?.wonhoekStrokes ?? surnameProfile?.wonhoekStrokes ?? sUnihan;
  const sDefaultStrokes =
    params.strokeMethod === 'wonhoek_kangxi' ? sWonhoek : sUnihan;

  const surnameStrokeUsed =
    params.surnameStrokeOverride !== null && params.surnameStrokeOverride > 0
      ? params.surnameStrokeOverride
      : sDefaultStrokes;

  const surnameSoundElement =
    getSoundElement(sHangul) ?? surnameProfile?.soundElement ?? '금';
  const surnameResourceElement =
    surnameProfile?.resourceElement ?? sHanjaRec?.resourceElement ?? null;
  const surnameGloss =
    surnameProfile?.dictionaryGloss ||
    sHanjaRec?.primaryMeaning ||
    `성씨 ${sHangul}`;
  const surnameRoman =
    surnameProfile?.romanizationRuleForm ||
    (() => {
      const r = romanizeSyllable(sHangul);
      return r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Seo';
    })();
  const boundaryNote =
    surnameProfile?.pronunciationNote ||
    '성씨와 이름 첫 음절 경계에서의 실제 발음·연음 여부를 함께 확인하세요.';

  const h1Record = params.hanja1 ? kb.hanjaByChar.get(params.hanja1) ?? null : null;
  const h2Record = params.hanja2 ? kb.hanjaByChar.get(params.hanja2) ?? null : null;

  const getStrokes = (rec: HanjaRecord | null): number | null => {
    if (!rec) return null;
    return params.strokeMethod === 'wonhoek_kangxi'
      ? rec.wonhoekStrokes
      : rec.unihanTotalStrokes;
  };

  const s1 = getStrokes(h1Record);
  const s2 = getStrokes(h2Record);

  const buildGivenSemantics = (rec: HanjaRecord | null, hangul: string) => {
    if (!rec || !hangul) {
      return {
        readingSenses: undefined,
        editorialMeaningGloss: null,
        semanticNotice: null,
        semanticRiskLevel: 'none' as const,
      };
    }
    const readingSenses = rec.sensesByReading?.[hangul];
    if (!readingSenses || readingSenses.length === 0) {
      return {
        readingSenses: undefined,
        editorialMeaningGloss: null,
        semanticNotice: null,
        semanticRiskLevel: 'none' as const,
      };
    }

    const preferredOrUsable = readingSenses.filter((s) => s.recommendedForName !== false && s.senseClass !== 'caution_other_dictionary_sense');
    const firstCurated = readingSenses.find((s) => s.editorialGloss && s.recommendedForName);
    const positiveSummary = preferredOrUsable.slice(0, 2).map((s) => s.rawSense).join(' · ');

    const mediumCaution = readingSenses.find((s) => s.concernLevel === 'medium' || s.concernLevel === 'high');
    const lowCaution = readingSenses.find(
      (s) => s.concernLevel === 'low' || s.senseClass === 'caution_other_dictionary_sense' || s.senseClass === 'contextual_dictionary_sense'
    );

    if (mediumCaution) {
      return {
        readingSenses,
        editorialMeaningGloss: firstCurated?.editorialGloss ?? null,
        semanticNotice: `다중의미 안내: '${hangul}' 독음 사전 뜻에 '${mediumCaution.rawSense}'도 함께 있습니다. 작명 의도(${positiveSummary || rec.primaryMeaning})와 구분해 참고하세요 (자동 탈락 없음).`,
        semanticRiskLevel: 'medium' as const,
      };
    }
    if (lowCaution) {
      return {
        readingSenses,
        editorialMeaningGloss: firstCurated?.editorialGloss ?? null,
        semanticNotice: `다중의미 참고: 사전 내 문맥·별개 뜻('${lowCaution.rawSense}')도 함께 등재되어 있으나 대표 작명 의미와 직접 충돌하지 않습니다.`,
        semanticRiskLevel: 'low' as const,
      };
    }
    return {
      readingSenses,
      editorialMeaningGloss: firstCurated?.editorialGloss ?? null,
      semanticNotice: null,
      semanticRiskLevel: 'none' as const,
    };
  };

  const g1Sem = buildGivenSemantics(h1Record, params.hangul1.trim());
  const g2Sem = buildGivenSemantics(h2Record, params.hangul2.trim());

  const characters: NameCharacterEvaluation[] = [
    {
      role: 'surname',
      hangul: sHangul,
      hanja: sHanja,
      meaning: `${surnameGloss} (성씨 참고 훈음 · 이름 의미 점수 미합산)`,
      strokesUsed: surnameStrokeUsed,
      unihanStrokes: sUnihan,
      wonhoekStrokes: sWonhoek,
      wonhoekEstimated: sHanjaRec?.wonhoekEstimated ?? false,
      yinYang: surnameStrokeUsed % 2 === 1 ? '양' : '음',
      soundElement: surnameSoundElement,
      resourceElement: surnameResourceElement,
      legalReadings: sHanjaRec?.legalReadings ?? [sHangul],
      tabooWarning: null,
      radicalNo: sHanjaRec?.kangxiRadicalNo ?? null,
    },
    {
      role: 'given1',
      hangul: params.hangul1,
      hanja: params.hanja1 || '',
      meaning:
        (h1Record &&
          (h1Record.meaningByReading[params.hangul1]?.join(', ') || h1Record.primaryMeaning)) ||
        (params.hangul1 ? '데이터 내 훈음 미매칭' : '한자 미선택'),
      strokesUsed: s1,
      unihanStrokes: h1Record?.unihanTotalStrokes ?? null,
      wonhoekStrokes: h1Record?.wonhoekStrokes ?? null,
      wonhoekEstimated: h1Record?.wonhoekEstimated ?? false,
      yinYang: s1 !== null ? (s1 % 2 === 1 ? '양' : '음') : null,
      soundElement: getSoundElement(params.hangul1),
      resourceElement: h1Record?.resourceElement ?? null,
      legalReadings: h1Record?.legalReadings ?? [],
      readingSenses: g1Sem.readingSenses,
      editorialMeaningGloss: g1Sem.editorialMeaningGloss,
      semanticNotice: g1Sem.semanticNotice,
      semanticRiskLevel: g1Sem.semanticRiskLevel,
      tabooWarning: h1Record?.tabooWarning ?? null,
      radicalNo: h1Record?.kangxiRadicalNo ?? null,
    },
    {
      role: 'given2',
      hangul: params.hangul2,
      hanja: params.hanja2 || '',
      meaning:
        (h2Record &&
          (h2Record.meaningByReading[params.hangul2]?.join(', ') || h2Record.primaryMeaning)) ||
        (params.hanja2 ? '데이터 내 훈음 미매칭' : '한자 미선택'),
      strokesUsed: s2,
      unihanStrokes: h2Record?.unihanTotalStrokes ?? null,
      wonhoekStrokes: h2Record?.wonhoekStrokes ?? null,
      wonhoekEstimated: h2Record?.wonhoekEstimated ?? false,
      yinYang: s2 !== null ? (s2 % 2 === 1 ? '양' : '음') : null,
      soundElement: getSoundElement(params.hangul2),
      resourceElement: h2Record?.resourceElement ?? null,
      legalReadings: h2Record?.legalReadings ?? [],
      readingSenses: g2Sem.readingSenses,
      editorialMeaningGloss: g2Sem.editorialMeaningGloss,
      semanticNotice: g2Sem.semanticNotice,
      semanticRiskLevel: g2Sem.semanticRiskLevel,
      tabooWarning: h2Record?.tabooWarning ?? null,
      radicalNo: h2Record?.kangxiRadicalNo ?? null,
    },
  ];

  // Numerology 4-grid calculation
  const isTwoCharGiven = Boolean(params.hangul2.trim() || params.hanja2.trim());
  const canCalcNumerology =
    s1 !== null && (!isTwoCharGiven || s2 !== null);

  let grids: NumerologyGrid[] = [];
  let unavailableReason: string | null = null;
  if (canCalcNumerology && s1 !== null) {
    if (isTwoCharGiven && s2 !== null) {
      grids = [
        makeGrid('won', '원격(元格)', '초년운 (0~20대)', `${s1} + ${s2}`, s1 + s2),
        makeGrid('hyeong', '형격(亨格)', '청년운 (20~40대)', `${surnameStrokeUsed} + ${s1}`, surnameStrokeUsed + s1),
        makeGrid('i', '이격(利格)', '중년운 (40~60대)', `${surnameStrokeUsed} + ${s2}`, surnameStrokeUsed + s2),
        makeGrid(
          'jeong',
          '정격(貞格)',
          '말년·총운 (60대~)',
          `${surnameStrokeUsed} + ${s1} + ${s2}`,
          surnameStrokeUsed + s1 + s2
        ),
      ];
    } else {
      // 외자 이름(2자 성명) 수리 참고
      grids = [
        makeGrid('won', '원격(元格)', '초년운', `${s1} + 1(가상수)`, s1 + 1),
        makeGrid('hyeong', '형격(亨格)', '청년운', `${surnameStrokeUsed} + ${s1}`, surnameStrokeUsed + s1),
        makeGrid('i', '이격(利格)', '중년운', `${surnameStrokeUsed} + 1(가상수)`, surnameStrokeUsed + 1),
        makeGrid('jeong', '정격(貞格)', '말년·총운', `${surnameStrokeUsed} + ${s1}`, surnameStrokeUsed + s1),
      ];
    }
  } else {
    unavailableReason =
      '한글만 입력되었거나 획수 데이터가 확인되지 않은 글자가 있어 수리 계산을 보류했습니다. (원칙: 한자 확인 전 수리 계산 금지)';
  }

  const goodCount = grids.filter((g) => g.grade === '대길' || g.grade === '길').length;

  // Yin-Yang balance
  const yyList = characters
    .filter((c) => c.hangul || c.hanja)
    .map((c) => c.yinYang)
    .filter(Boolean) as Array<'양' | '음'>;
  const yyLabels = yyList.join(' - ') || '미확인';
  const hasYang = yyList.includes('양');
  const hasYin = yyList.includes('음');
  const isBalanced = yyList.length >= 2 && hasYang && hasYin;
  const yinYangNote =
    yyList.length < 2
      ? '한자 획수 확정 후 음양 배합을 판정합니다.'
      : isBalanced
      ? `음(陰)과 양(陽)이 고르게 섞인 평중 배합입니다. (${yyLabels})`
      : `모두 ${yyList[0]}(${yyList[0] === '양' ? '陽' : '陰'})으로만 치우친 순음/순양 배합입니다.`;

  // Pronunciation Five Elements
  const soundEls = characters
    .filter((c) => c.hangul)
    .map((c) => c.soundElement);
  const relations: Array<{ from: FiveElement; to: FiveElement; relation: '상생' | '비화' | '상극' }> = [];
  for (let i = 0; i < soundEls.length - 1; i += 1) {
    const a = soundEls[i];
    const b = soundEls[i + 1];
    if (a && b) {
      relations.push({ from: a, to: b, relation: getElementRelation(a, b) });
    }
  }
  const clashCount = relations.filter((r) => r.relation === '상극').length;
  const harmonyLabel =
    relations.length === 0
      ? '미확인'
      : clashCount === 0
      ? '상생 조화'
      : clashCount === 1
      ? '부분 상극'
      : '상극 주의';
  const pronNote =
    relations.length === 0
      ? '한글 이름 입력 시 초성 발음오행을 분석합니다.'
      : clashCount === 0
      ? `성씨 '${sHangul}(${surnameSoundElement})'에서 이름 끝자까지 막힘없이 이어지는 발음오행 흐름입니다.`
      : `초성 발음오행 중 ${clashCount}개 구간에 상극이 있습니다. (단, 초성 중심 통용법 기준이며 중성·종성 학파는 다를 수 있습니다.)`;

  // Resource Five Elements vs Saju Yongsin
  const givenResourceEls = [characters[1]?.resourceElement ?? null, characters[2]?.resourceElement ?? null];
  const yongsinSet = new Set(params.saju?.eokbuYongsinCandidates ?? []);
  const matchedElements = Array.from(
    new Set(
      givenResourceEls.filter((el): el is FiveElement => el !== null && yongsinSet.has(el))
    )
  );
  const resourceNote = params.saju
    ? matchedElements.length > 0
      ? `사주 용신·보완 후보(${params.saju.eokbuYongsinCandidates.join('·')}) 중 '${matchedElements.join(', ')}' 오행이 한자 자원오행에 반영되었습니다.`
      : `선택한 한자의 자원오행(${givenResourceEls.filter(Boolean).join('·') || '미분류'})이 1차 억부용신 후보(${params.saju.eokbuYongsinCandidates.join('·')})와 직접 겹치지 않습니다.`
    : '사주 생년월일시를 입력하면 용신과의 자원오행 보완 여부를 대조합니다.';

  // Usability & Surname Heuristics (from LUCKYBRIDGE/name)
  const syllableRepetitionFlag = Boolean(sHangul && params.hangul1.trim() === sHangul);
  const tabooWarnings = characters
    .map((c) => (c.tabooWarning ? `${c.hanja}: ${c.tabooWarning}` : null))
    .filter((v): v is string => v !== null);

  const notes: string[] = [];
  if (syllableRepetitionFlag) {
    notes.push(
      `실사용성 참고: 성씨 '${sHangul}'와 이름 첫 음절 '${sHangul}'이 반복됩니다. (오류나 흉격이 아니며 발음·어감 확인용 안내)`
    );
  }
  const bothLegal =
    (!params.hanja1 || Boolean(h1Record && h1Record.legalReadings.includes(params.hangul1))) &&
    (!params.hanja2 || Boolean(h2Record && h2Record.legalReadings.includes(params.hangul2)));
  const legalStatusLabel =
    !params.hanja1 && !params.hanja2
      ? '한자 미지정'
      : bothLegal
      ? '2024-07-16 대법원 인명용 미러 포함 (최종 공식 조회 권장)'
      : '입력 독음과 대법원 미러 독음 불일치 또는 미등록';

  const totalStrokeLoad =
    s1 !== null ? surnameStrokeUsed + s1 + (s2 ?? 0) : null;

  return {
    fullHangul: `${sHangul}${params.hangul1}${params.hangul2}`,
    fullHanja: `${sHanja}${params.hanja1 || '?'}${params.hanja2 || (isTwoCharGiven ? '?' : '')}`,
    givenHangul: `${params.hangul1}${params.hangul2}`,
    givenHanja: `${params.hanja1 || ''}${params.hanja2 || ''}`,
    romanized: romanizeKoreanName(params.hangul1, params.hangul2, surnameRoman),
    strokeMethod: params.strokeMethod,
    surnameStrokeOverride: params.surnameStrokeOverride,
    characters,
    numerology: {
      available: canCalcNumerology,
      unavailableReason,
      grids,
      goodCount,
    },
    yinYangPattern: {
      labels: yyLabels,
      isBalanced,
      note: yinYangNote,
    },
    pronunciationElements: {
      elements: soundEls,
      relations,
      harmonyLabel,
      note: pronNote,
    },
    resourceAlignment: {
      elements: givenResourceEls,
      matchesYongsin: matchedElements.length > 0,
      matchedElements,
      note: resourceNote,
    },
    usability: {
      syllableRepetitionFlag,
      boundaryAssimilationNote: boundaryNote,
      legalStatusLabel,
      tabooWarnings,
      totalStrokeLoad,
      notes,
    },
  };
}

// Curated high-readability modern Korean given-name syllables (deduplicated)
const CURATED_MODERN_SYLLABLES = [
  '서', '윤', '우', '준', '현', '민', '연', '아', '은', '진',
  '수', '하', '원', '율', '재', '인', '온', '영', '도', '태',
  '시', '지', '채', '다', '예', '성', '건', '호', '빈', '유',
  '정', '주', '안', '이', '경', '희', '훈', '혁', '찬', '승',
  '한', '선', '혜', '규', '범', '석', '세', '소', '송', '신',
  '완', '용', '운', '은', '의', '일', '전', '제', '조', '종',
  '중', '창', '천', '철', '청', '환', '휘', '효', '후', '보',
  '나', '라', '리', '명', '미', '상', '설', '어', '여', '오',
].filter((s, idx, arr) => arr.indexOf(s) === idx);

export function recommendNamesWithMeta(
  req: NameCandidateRequest,
  saju?: SajuAnalysisResult | null
): NameRecommendResponse {
  const kb = getKnowledgeBase();
  const targetSet = new Set<FiveElement>(req.targetElements);

  const requestedSHanja = (req.surnameHanja || '').trim();
  const requestedSHangul = (req.surnameHangul || '').trim();
  const surnameProfile =
    (requestedSHanja ? kb.surnameByHanja.get(requestedSHanja) : undefined) ??
    (requestedSHangul ? kb.surnames.find((s) => s.hangul === requestedSHangul) : undefined) ??
    kb.surnameByHanja.get('徐');
  const activeSurnameHangul = requestedSHangul || surnameProfile?.hangul || '서';
  const activeSurnameHanja = requestedSHanja || surnameProfile?.hanja || '徐';
  const activeSurnameSoundEl: FiveElement =
    getSoundElement(activeSurnameHangul) ?? surnameProfile?.soundElement ?? '금';

  const rawH1 = (req.hangul1 || '').trim();
  const rawH2 = (req.hangul2 || '').trim();
  const rawC1 = (req.fixedHanja1 || '').trim();
  const rawC2 = (req.fixedHanja2 || '').trim();

  const prefHangulList = (req.preferredHangul || [])
    .map((s) => s.trim())
    .filter((s) => /^[가-힣]$/.test(s));
  const prefHanjaList = (req.preferredHanja || [])
    .map((s) => s.trim())
    .filter(Boolean);

  const prefHangulSet = new Set<string>(prefHangulList);
  const prefHanjaSet = new Set<string>(prefHanjaList);

  // Readings implied by preferred Hanja (so '宇' also surfaces '우')
  const prefReadingList: string[] = [...prefHangulList];
  for (const ch of prefHanjaList) {
    const rec = kb.hanjaByChar.get(ch);
    if (rec) {
      for (const r of rec.legalReadings) {
        if (!prefReadingList.includes(r)) prefReadingList.push(r);
      }
    }
  }
  const prefAllReadingSet = new Set<string>(prefReadingList);

  // Resolve slot 1 & slot 2 readings (auto-resolve if only fixed Hanja is given)
  const fixedRec1 = rawC1 ? kb.hanjaByChar.get(rawC1) ?? null : null;
  const fixedRec2 = rawC2 ? kb.hanjaByChar.get(rawC2) ?? null : null;

  const slot1FixedReadings = rawH1
    ? [rawH1]
    : fixedRec1 && fixedRec1.legalReadings.length > 0
      ? fixedRec1.legalReadings.slice(0, 2)
      : null;

  const slot2FixedReadings = rawH2
    ? [rawH2]
    : fixedRec2 && fixedRec2.legalReadings.length > 0
      ? fixedRec2.legalReadings.slice(0, 2)
      : null;

  const slot1Constrained = Boolean(rawH1 || rawC1);
  const slot2Constrained = Boolean(rawH2 || rawC2);
  const hasPreferredConstraint = prefHangulSet.size > 0 || prefHanjaSet.size > 0;
  const hasAnyUserConstraint = slot1Constrained || slot2Constrained || hasPreferredConstraint;

  const d1 = rawH1 && rawC1 ? `${rawH1}(${rawC1})` : rawC1 ? `${slot1FixedReadings?.[0] ?? '?'}(${rawC1})` : rawH1 || 'X';
  const d2 = rawH2 && rawC2 ? `${rawH2}(${rawC2})` : rawC2 ? `${slot2FixedReadings?.[0] ?? '?'}(${rawC2})` : rawH2 || 'X';
  const resolvedPatternLabel = `${activeSurnameHangul} ${d1} ${d2}`;

  // Build prioritized open-slot syllable list
  const openSyllables: string[] = [];
  for (const s of [...prefReadingList, ...CURATED_MODERN_SYLLABLES]) {
    if (!openSyllables.includes(s)) {
      openSyllables.push(s);
    }
  }

  const getPoolForSyllable = (syllable: string, fixedHanja?: string): HanjaRecord[] => {
    if (fixedHanja) {
      const rec = kb.hanjaByChar.get(fixedHanja);
      if (rec) return [rec];
      return [];
    }
    const list = kb.hanjaByReading.get(syllable) || [];
    return list.filter((rec) => {
      // Always retain explicitly requested preferred Hanja even if stroke slider is tight
      if (prefHanjaSet.has(rec.hanja)) {
        if (req.excludeTaboo && rec.tabooWarning) return false;
        return true;
      }
      if (!rec.primaryMeaning) return false;
      if (req.excludeTaboo && rec.tabooWarning) return false;
      const strokes =
        req.strokeMethod === 'wonhoek_kangxi' ? rec.wonhoekStrokes : rec.unihanTotalStrokes;
      if (strokes === null || strokes > req.maxStrokesPerChar) return false;
      return true;
    });
  };

  // Build syllablePairs with preferred syllables placed at the very top
  const syllablePairs: Array<[string, string]> = [];
  const seenPairKey = new Set<string>();
  const pushPair = (a: string, b: string) => {
    if (!a || !b) return;
    if (!slot1Constrained && !slot2Constrained && a === b) return;
    if (req.avoidSurnameRepetition && a === activeSurnameHangul && !slot1Constrained) return;
    const k = `${a}|${b}`;
    if (seenPairKey.has(k)) return;
    seenPairKey.add(k);
    syllablePairs.push([a, b]);
  };

  if (slot1FixedReadings && slot2FixedReadings) {
    for (const s1 of slot1FixedReadings) {
      for (const s2 of slot2FixedReadings) {
        pushPair(s1, s2);
      }
    }
  } else if (slot1FixedReadings && !slot2FixedReadings) {
    for (const s1 of slot1FixedReadings) {
      for (const s2 of openSyllables) {
        if (s2 !== s1) pushPair(s1, s2);
      }
    }
  } else if (!slot1FixedReadings && slot2FixedReadings) {
    for (const s2 of slot2FixedReadings) {
      for (const s1 of openSyllables) {
        if (s1 !== s2) pushPair(s1, s2);
      }
    }
  } else {
    // Neither slot is fixed: if preferred Hangul/Hanja exist, prioritize pairs containing them first
    const s1Pool = openSyllables.slice(0, 36);
    const s2Pool = openSyllables.slice(0, 36);

    if (prefReadingList.length > 0) {
      for (const p of prefReadingList) {
        for (const other of s2Pool) {
          pushPair(p, other);
          pushPair(other, p);
        }
      }
    }

    for (const s1 of s1Pool.slice(0, 22)) {
      const e1 = getSoundElement(s1);
      if (req.requireSoundHarmony && e1 && getElementRelation(activeSurnameSoundEl, e1) === '상극') {
        continue;
      }
      for (const s2 of s2Pool.slice(0, 24)) {
        const e2 = getSoundElement(s2);
        if (req.requireSoundHarmony && e1 && e2 && getElementRelation(e1, e2) === '상극') {
          continue;
        }
        pushPair(s1, s2);
      }
    }
  }

  const prioritizePool = (pool: HanjaRecord[], sliceLimit: number) =>
    [...pool]
      .sort((a, b) => {
        const aPref = prefHanjaSet.has(a.hanja) ? 1 : 0;
        const bPref = prefHanjaSet.has(b.hanja) ? 1 : 0;
        if (aPref !== bPref) return bPref - aPref;
        const aMatch = a.resourceElement && targetSet.has(a.resourceElement) ? 1 : 0;
        const bMatch = b.resourceElement && targetSet.has(b.resourceElement) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        const aPop = a.isPopularNaming ? 1 : 0;
        const bPop = b.isPopularNaming ? 1 : 0;
        if (aPop !== bPop) return bPop - aPop;
        const aS = a.wonhoekStrokes ?? 20;
        const bS = b.wonhoekStrokes ?? 20;
        return aS - bS;
      })
      .slice(0, sliceLimit);

  const runSearchPass = (relaxMode: 'strict' | 'relaxed'): NameEvaluation[] => {
    const results: Array<{ evalItem: NameEvaluation; rankWeight: number }> = [];
    const seenNames = new Set<string>();

    const slice1 = slot1Constrained ? 24 : slot2Constrained ? 10 : 7;
    const slice2 = slot2Constrained ? 24 : slot1Constrained ? 10 : 7;

    for (const [h1, h2] of syllablePairs) {
      const pool1 = getPoolForSyllable(h1, rawC1 || undefined);
      const pool2 = getPoolForSyllable(h2, rawC2 || undefined);
      if (pool1.length === 0 || pool2.length === 0) continue;

      const top1 = prioritizePool(pool1, slice1);
      const top2 = prioritizePool(pool2, slice2);

      for (const c1 of top1) {
        for (const c2 of top2) {
          if (c1.hanja === c2.hanja && !rawC1 && !rawC2) continue;
          const key = `${h1}${h2}:${c1.hanja}${c2.hanja}`;
          if (seenNames.has(key)) continue;

          const ev = evaluateName({
            surnameHangul: activeSurnameHangul,
            surnameHanja: activeSurnameHanja,
            surnameStrokeOverride: req.surnameStrokeCount,
            strokeMethod: req.strokeMethod,
            hangul1: h1,
            hanja1: c1.hanja,
            hangul2: h2,
            hanja2: c2.hanja,
            saju,
          });

          if (!ev.numerology.available) continue;

          if (relaxMode === 'strict') {
            if (req.requireAllFourGood && ev.numerology.goodCount < 4) continue;
            if (!req.requireAllFourGood && ev.numerology.goodCount < 3) continue;
            if (req.requireSoundHarmony && ev.pronunciationElements.harmonyLabel !== '상생 조화') continue;
            if (!ev.yinYangPattern.isBalanced) continue;
          } else {
            // Relaxed fallback for tight custom Hangul/Hanja constraints
            if (ev.numerology.goodCount < 1 && !(rawC1 && rawC2)) continue;
          }

          let w = 0;
          // Strongly prioritize preferred Hangul & Hanja requested by user
          if (prefHanjaSet.has(c1.hanja)) w += 45;
          if (prefHanjaSet.has(c2.hanja)) w += 45;
          if (prefHangulSet.has(h1)) w += 30;
          if (prefHangulSet.has(h2)) w += 30;
          if (!prefHangulSet.has(h1) && prefAllReadingSet.has(h1)) w += 10;
          if (!prefHangulSet.has(h2) && prefAllReadingSet.has(h2)) w += 10;

          w += ev.numerology.goodCount * 10;
          w += ev.numerology.grids.filter((g) => g.grade === '대길').length * 3;
          if (ev.pronunciationElements.harmonyLabel === '상생 조화') w += 10;
          else if (ev.pronunciationElements.harmonyLabel === '부분 상극') w += 3;
          if (ev.yinYangPattern.isBalanced) w += 6;
          if (c1.resourceElement && targetSet.has(c1.resourceElement)) w += 8;
          if (c2.resourceElement && targetSet.has(c2.resourceElement)) w += 8;
          if (
            c1.resourceElement &&
            c2.resourceElement &&
            c1.resourceElement !== c2.resourceElement &&
            targetSet.has(c1.resourceElement) &&
            targetSet.has(c2.resourceElement)
          ) {
            w += 4;
          }
          if (ev.usability.syllableRepetitionFlag) w -= 2;

          seenNames.add(key);
          results.push({ evalItem: ev, rankWeight: w });
        }
      }

      const cap = hasAnyUserConstraint ? req.limit * 8 : req.limit * 4;
      if (results.length >= cap) break;
    }

    return results
      .sort((a, b) => b.rankWeight - a.rankWeight)
      .slice(0, req.limit)
      .map((r) => r.evalItem);
  };

  let items = runSearchPass('strict');
  let relaxedNotice: string | null = null;

  if (items.length === 0 && hasAnyUserConstraint) {
    items = runSearchPass('relaxed');
    if (items.length > 0) {
      relaxedNotice =
        '지정하신 한글·한자 조건에서는 엄격 필터(4격 모두 길수·발음 상생·음양 균형)를 100% 동시에 만족하는 조합이 없어, 입력하신 글자를 유지한 채 가장 조건이 좋은 차선 후보를 함께 보여드립니다.';
    }
  }

  return {
    items,
    relaxedNotice,
    resolvedPatternLabel,
  };
}

export function recommendNames(
  req: NameCandidateRequest,
  saju?: SajuAnalysisResult | null
): NameEvaluation[] {
  return recommendNamesWithMeta(req, saju).items;
}

