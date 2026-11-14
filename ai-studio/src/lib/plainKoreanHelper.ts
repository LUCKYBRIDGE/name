import type {
  FiveElement,
  NameEvaluation,
  SajuAnalysisResult,
} from '../types/naming.ts';

export const ELEMENT_PLAIN_DESC: Record<FiveElement, string> = {
  목: '나무(성장·창의·생기)',
  화: '불(열정·표현·따뜻함)',
  토: '흙(안정·신뢰·포용)',
  금: '쇠(결단·원칙·단단함)',
  수: '물(지혜·유연함·소통)',
};

export const TEN_GOD_PLAIN: Record<string, string> = {
  '일간(본인)': '나 자신',
  비견: '나와 같은 힘·자립심',
  겁재: '경쟁·추진력',
  식신: '표현력·풍요로움',
  상관: '재능·창의적 발산',
  편재: '넓은 활동·재물 감각',
  정재: '성실한 결실·안정감',
  편관: '카리스마·책임감',
  정관: '원칙·신뢰·명예',
  편인: '직관·탐구심',
  정인: '학업·배려·귀인의 도움',
};

export const GLOSSARY_ITEMS: Array<{ term: string; short: string; detail: string }> = [
  {
    term: '일간(日干)과 용신(用神)',
    short: '내 중심 기운과 균형을 잡아주는 오행',
    detail:
      '태어난 날의 하늘 기운(일간)을 기준으로 사주 전체가 너무 치우치지 않도록 보태거나 덜어주는 핵심 오행을 용신이라고 합니다.',
  },
  {
    term: '원·형·이·정 4격 (81수리)',
    short: '초년·청년·중년·말년으로 나누어 보는 획수 풀이',
    detail:
      '한자 획수를 4가지 조합으로 더한 뒤 1~81의 수리로 길흉을 살피는 전통 방식입니다. 원격(초년), 형격(청년·사회), 이격(중년·가정), 정격(말년·총운)을 봅니다.',
  },
  {
    term: '원획법 vs 기술총획',
    short: '전통 작명 획수 기준과 일반 옥편/컴퓨터 획수의 차이',
    detail:
      '전통 원획법은 삼수변(氵)을 물 수(水·4획)처럼 부수의 본래 글자 획수로 계산합니다. 학파마다 기준이 달라 어떤 기준을 썼는지 확인하는 것이 중요합니다.',
  },
  {
    term: '발음오행 vs 자원오행',
    short: '소리(초성)의 오행과 한자 뜻·부수의 오행',
    detail:
      '발음오행은 입으로 부를 때 소리가 자연스럽게 이어지는지(서=ㅅ=금)를 보며, 자원오행은 한자 자체가 가진 기운으로 사주에 부족한 오행을 채워주는 데 씁니다.',
  },
  {
    term: '음양(陰陽) 배합',
    short: '홀수(양)와 짝수(음) 획수의 조화',
    detail:
      '성씨와 이름 글자의 획수가 모두 짝수(음)나 모두 홀수(양)로만 쏠리지 않고 서로 섞여 균형을 이루는 것을 좋게 봅니다.',
  },
  {
    term: '한자 다중의미(여러 뜻) 해석',
    short: '긍정적 작명 의도와 다른 사전 뜻의 투명한 구분',
    detail:
      '하나의 한자라도 여러 사전 뜻이 있을 수 있습니다(예: 優 넉넉할 우 / 결단성 없을 우). 대표 작명 뜻을 살피되, 같은 독음의 다른 사전 뜻도 함께 확인하고 결정합니다.',
  },
];

export function buildPlainSajuSummary(saju: SajuAnalysisResult): {
  headline: string;
  lines: string[];
} {
  const dm = saju.dayMaster;
  const dmDesc = ELEMENT_PLAIN_DESC[dm.element];
  const strengthText =
    saju.dayMasterStrength === '신강'
      ? '나를 돕는 기운이 넉넉해 에너지를 밖으로 펼치고 조절해 주는 방향이 좋습니다.'
      : saju.dayMasterStrength === '신약'
      ? '주변 기운을 감당하기 위해 나를 북돋우고 힘을 보태주는 기운이 들어오면 편안해집니다.'
      : '다섯 가지 기운이 한쪽으로 크게 치우치지 않고 비교적 고른 편입니다.';

  const missingText =
    saju.missingElements.length > 0
      ? `사주 원국 겉으로 드러난 오행 중에서는 ${saju.missingElements
          .map((e) => ELEMENT_PLAIN_DESC[e])
          .join(', ')} 기운이 비어 있습니다.`
      : '목·화·토·금·수 다섯 오행이 사주 겉면에 모두 한 번 이상 나타납니다.';

  const yongsinText = `균형 관점에서 이름의 한자 뜻(자원오행)으로 보충해 주기 좋은 기운은 ${saju.eokbuYongsinCandidates
    .map((e) => ELEMENT_PLAIN_DESC[e])
    .join(' 또는 ')} 입니다.`;

  return {
    headline: `나의 중심 기운은 ${dm.stem}(${dm.hangul} · ${dmDesc})입니다.`,
    lines: [strengthText, missingText, yongsinText],
  };
}

export function buildPlainNameSummary(
  candidate: NameEvaluation,
  currentEval: NameEvaluation | null,
  saju: SajuAnalysisResult | null
): string[] {
  const lines: string[] = [];
  const sChar = candidate.characters[0];
  const sHangul = sChar?.hangul || '성씨';
  const sEl = sChar?.soundElement || '';

  // 1. Pronunciation & Practical feel
  if (candidate.pronunciationElements.harmonyLabel === '상생 조화') {
    lines.push(
      `소리 흐름: 성씨 ‘${sHangul}${sEl ? `(${sEl})` : ''}’에서 이름 첫 음절 ‘${candidate.characters[1]?.hangul || ''}’을 거쳐 끝자까지 발음오행이 막힘없이 자연스럽게 이어집니다.`
    );
  } else {
    lines.push(
      `소리 흐름: 초성 발음오행 기준으로는 ‘${candidate.pronunciationElements.harmonyLabel}’ 구간이 포함되어 있으나, 실제 부를 때의 어감과 리듬을 함께 소리 내어 확인해 보세요.`
    );
  }

  // 2. Numerology & Yin-Yang + comparison with old name
  if (candidate.numerology.available) {
    const good = candidate.numerology.goodCount;
    const prevGood = currentEval?.numerology.available ? currentEval.numerology.goodCount : null;
    const comparePart =
      prevGood !== null
        ? good > prevGood
          ? ` (기존 이름 ${prevGood}/4개에서 ${good}/4개로 수리 구성이 개선됨)`
          : ` (기존 이름과 동일하게 ${good}/4개 길수)`
        : '';

    const yyPart = candidate.yinYangPattern.isBalanced
      ? '획수의 홀짝(음양)이 골고루 섞여 안정적입니다.'
      : '획수의 홀짝(음양)이 한쪽으로만 모여 있어 획수 조절을 고려해 볼 수 있습니다.';

    lines.push(
      `수리와 음양: 초년·청년·중년·말년 4격 중 ${good}개 격이 길수(대길/길)입니다${comparePart} ${yyPart}`
    );
  } else {
    lines.push(
      `수리 안내: 한자 획수 기준이 아직 확정되지 않은 글자가 있어 수리 계산을 보류했습니다.`
    );
  }

  // 3. Meaning & Saju Resource Alignment
  const m1 = candidate.characters[1]?.meaning.split(',')[0] || '의미 확인 필요';
  const m2 = candidate.characters[2]?.meaning.split(',')[0] || '';
  const meaningJoined = m2 ? `‘${m1}’와 ‘${m2}’` : `‘${m1}’`;

  if (saju) {
    if (candidate.resourceAlignment.matchesYongsin) {
      lines.push(
        `뜻과 사주 보완: ${meaningJoined}의 긍정적 의미를 담고 있으며, 사주 균형에 추천된 ${candidate.resourceAlignment.matchedElements
          .map((e) => ELEMENT_PLAIN_DESC[e])
          .join('·')} 기운을 한자의 자원오행으로 채워줍니다.`
      );
    } else {
      lines.push(
        `뜻과 사주 보완: ${meaningJoined}의 뜻을 가지며, 사주 1차 추천 오행(${saju.eokbuYongsinCandidates.join('·')})과는 직접 겹치지 않으니 어감과 뜻의 선호도를 우선으로 함께 살펴보세요.`
      );
    }
  } else {
    lines.push(
      `한자 의미: 이름자에 ${meaningJoined}의 뜻이 담겨 있습니다. (성씨 ‘${sHangul}’의 사전적 뜻은 이름자 평가 감점에 반영하지 않습니다.)`
    );
  }

  // 4. Multi-sense semantic notice if present
  const semNotices = [candidate.characters[1]?.semanticNotice, candidate.characters[2]?.semanticNotice]
    .filter((v): v is string => Boolean(v));
  if (semNotices.length > 0) {
    lines.push(semNotices[0]);
  }

  return lines;
}
