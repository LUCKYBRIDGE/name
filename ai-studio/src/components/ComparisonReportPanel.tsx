import { useState } from 'react';
import { AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import type { AppMode, NameEvaluation, SajuAnalysisResult } from '../types/naming.ts';
import { ElementTag, LuckGradeText } from './ElementBadge.tsx';
import { StrokeOrderCard } from './StrokeOrderCard.tsx';

interface ComparisonReportPanelProps {
  appMode: AppMode;
  sajuResult: SajuAnalysisResult | null;
  currentEval: NameEvaluation | null;
  selectedCandidate: NameEvaluation | null;
  savedCandidates: NameEvaluation[];
  onSelectCandidate: (ev: NameEvaluation) => void;
  reasonForAnalysis: string;
  onChangeReasonForAnalysis: (reason: string) => void;
  customNotes: string;
}

export function ComparisonReportPanel({
  appMode,
  sajuResult,
  currentEval,
  selectedCandidate,
  savedCandidates,
  onSelectCandidate,
  reasonForAnalysis,
  onChangeReasonForAnalysis,
  customNotes,
}: ComparisonReportPanelProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);

  const activeCandidate = selectedCandidate || savedCandidates[0] || null;

  const handleRequestAi = async () => {
    if (!activeCandidate) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('/api/naming/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appMode,
          saju: sajuResult,
          currentName: currentEval,
          candidateName: activeCandidate,
          customNotes,
          reasonForRenaming: reasonForAnalysis,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'AI 해설 요청에 실패했습니다.');
      setAiText(data.interpretation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 해설 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!activeCandidate) {
    return (
      <div className="border border-[#E7E2D8] bg-white rounded-md p-8 sm:p-12 text-center space-y-2">
        <p className="text-sm font-medium text-[#1C1917]">
          분석할 이름 후보가 아직 선택되지 않았습니다.
        </p>
        <p className="text-xs text-[#78716C]">
          &apos;작명 스튜디오&apos;에서 이름 후보를 선택하거나 보관함에 담은 뒤 리포트를 확인해 주세요.
        </p>
      </div>
    );
  }

  const semanticNotices = [
    activeCandidate.characters[1]?.semanticNotice,
    activeCandidate.characters[2]?.semanticNotice,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Selector strip if user has saved multiple candidates */}
      {savedCandidates.length > 0 && (
        <div className="border border-[#E7E2D8] bg-white rounded-md p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs font-medium text-[#57534E]">
            보관함 후보 빠른 전환 ({savedCandidates.length}건)
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {savedCandidates.map((cand) => {
              const active =
                cand.fullHangul === activeCandidate.fullHangul &&
                cand.fullHanja === activeCandidate.fullHanja;
              return (
                <button
                  key={`${cand.fullHangul}-${cand.fullHanja}`}
                  type="button"
                  onClick={() => {
                    onSelectCandidate(cand);
                    setAiText(null);
                  }}
                  className={`px-3 min-h-[38px] sm:min-h-[32px] text-xs font-medium border rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412]'
                      : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917]'
                  }`}
                >
                  {cand.fullHangul} ({cand.fullHanja})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Before -> After Key Improvement Highlights */}
      <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E7E2D8] pb-3 mb-4">
          <h2 className="font-serif-kr text-base sm:text-lg font-semibold text-[#1C1917]">
            {appMode === 'naming'
              ? `선택 이름 핵심 요약 (${activeCandidate.fullHangul})`
              : `개명 핵심 변화 요약 (${currentEval?.fullHangul || '기존'} → ${activeCandidate.fullHangul})`}
          </h2>
          <span className="text-xs text-[#78716C]">
            주요 4대 축(수리·음양·발음·사주보완) 분리 비교
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="text-[#78716C]">4격 81수리 길수</div>
            <div className="font-mono tabular-nums text-sm sm:text-base font-semibold text-[#1C1917]">
              {currentEval?.numerology.available ? `${currentEval.numerology.goodCount}/4 → ` : ''}
              <span className="text-[#14532D]">{activeCandidate.numerology.goodCount}/4</span>
            </div>
            <div className="text-[11px] text-[#57534E]">
              {currentEval?.numerology.available
                ? activeCandidate.numerology.goodCount > currentEval.numerology.goodCount
                  ? `+${activeCandidate.numerology.goodCount - currentEval.numerology.goodCount}격 길수 증가`
                  : '동일 또는 유지'
                : '원·형·이·정 4격 기준'}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="text-[#78716C]">음양 조화</div>
            <div className="text-sm sm:text-base font-semibold text-[#1C1917]">
              {currentEval ? (currentEval.yinYangPattern.isBalanced ? '균형 → ' : '편중 → ') : ''}
              <span className={activeCandidate.yinYangPattern.isBalanced ? 'text-[#14532D]' : 'text-[#9A3412]'}>
                {activeCandidate.yinYangPattern.isBalanced ? '균형' : '편중'}
              </span>
            </div>
            <div className="text-[11px] text-[#57534E]">{activeCandidate.yinYangPattern.labels}</div>
          </div>

          <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="text-[#78716C]">발음오행 흐름</div>
            <div className="text-sm sm:text-base font-semibold text-[#1C1917]">
              {currentEval ? `${currentEval.pronunciationElements.harmonyLabel} → ` : ''}
              <span className="text-[#14532D]">
                {activeCandidate.pronunciationElements.harmonyLabel}
              </span>
            </div>
            <div className="text-[11px] text-[#57534E]">
              {activeCandidate.pronunciationElements.elements.filter(Boolean).join(' → ')}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="text-[#78716C]">사주 용신 자원오행</div>
            <div className="text-sm sm:text-base font-semibold text-[#1C1917]">
              {activeCandidate.resourceAlignment.matchesYongsin
                ? `${activeCandidate.resourceAlignment.matchedElements.join('·')} 보완`
                : '참고 범위'}
            </div>
            <div className="text-[11px] text-[#57534E]">
              한자 자원: {activeCandidate.resourceAlignment.elements.filter(Boolean).join('·') || '미분류'}
            </div>
          </div>
        </div>

        {semanticNotices.length > 0 && (
          <div className="mt-4 p-3 border border-[#FDE68A] bg-[#FEFCE8] rounded-sm space-y-1">
            {semanticNotices.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#78350F]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Side-by-side Header Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Before */}
        <div className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between border-b border-[#E7E2D8] pb-3 gap-2">
            <div>
              <span className="text-xs text-[#78716C]">
                {appMode === 'naming' ? '비교 기준 이름 (선택 입력)' : '개명 전 · 기존 이름'}
              </span>
              <h2 className="font-serif-kr text-xl sm:text-2xl font-bold text-[#1C1917] mt-0.5">
                {currentEval ? `${currentEval.fullHangul} (${currentEval.fullHanja})` : '미입력'}
              </h2>
            </div>
            {currentEval && (
              <span className="text-xs font-mono text-[#57534E] shrink-0">{currentEval.romanized}</span>
            )}
          </div>

          {currentEval ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                {currentEval.characters
                  .filter((c) => c.hangul || c.hanja)
                  .map((c, i) => (
                    <StrokeOrderCard
                      key={`cur-${i}`}
                      hanja={c.hanja}
                      hangul={c.hangul}
                      meaning={c.meaning}
                      wonhoekStrokes={c.wonhoekStrokes}
                      unihanStrokes={c.unihanStrokes}
                      wonhoekEstimated={c.wonhoekEstimated}
                      compact
                    />
                  ))}
              </div>
              <div className="p-3 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1">
                <div>
                  <span className="font-medium text-[#1C1917]">음양 배합: </span>
                  <span className="text-[#57534E]">{currentEval.yinYangPattern.labels}</span>
                </div>
                <div>
                  <span className="font-medium text-[#1C1917]">발음오행: </span>
                  <span className="text-[#57534E]">
                    {currentEval.pronunciationElements.harmonyLabel}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#1C1917]">4격 길수: </span>
                  <span className="font-mono tabular-nums text-[#57534E]">
                    {currentEval.numerology.available
                      ? `${currentEval.numerology.goodCount} / 4격`
                      : '계산 보류'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#78716C]">기존 이름을 입력하면 비교가 표시됩니다.</p>
          )}
        </div>

        {/* After */}
        <div className="border border-[#9A3412]/40 bg-white rounded-md p-4 sm:p-6 space-y-4">
          <div className="flex items-baseline justify-between border-b border-[#E7E2D8] pb-3 gap-2">
            <div>
              <span className="text-xs text-[#9A3412] font-medium">
                {appMode === 'naming' ? '작명 · 선택 후보' : '개명 후 · 선택 후보'}
              </span>
              <h2 className="font-serif-kr text-xl sm:text-2xl font-bold text-[#1C1917] mt-0.5">
                {activeCandidate.fullHangul} ({activeCandidate.fullHanja})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#57534E] shrink-0">{activeCandidate.romanized}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              {activeCandidate.characters
                .filter((c) => c.hangul || c.hanja)
                .map((c, i) => (
                  <StrokeOrderCard
                    key={`cand-${i}`}
                    hanja={c.hanja}
                    hangul={c.hangul}
                    meaning={c.meaning}
                    wonhoekStrokes={c.wonhoekStrokes}
                    unihanStrokes={c.unihanStrokes}
                    wonhoekEstimated={c.wonhoekEstimated}
                    compact
                  />
                ))}
            </div>
            <div className="p-3 bg-[#FFF7ED]/50 border border-[#E7E2D8] rounded-sm space-y-1">
              <div>
                <span className="font-medium text-[#1C1917]">음양 배합: </span>
                <span className="text-[#57534E]">{activeCandidate.yinYangPattern.labels}</span>
              </div>
              <div>
                <span className="font-medium text-[#1C1917]">발음오행: </span>
                <span className="text-[#57534E]">
                  {activeCandidate.pronunciationElements.harmonyLabel}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1C1917]">4격 길수: </span>
                <span className="font-mono tabular-nums text-[#14532D] font-semibold">
                  {activeCandidate.numerology.available
                    ? `${activeCandidate.numerology.goodCount} / 4격`
                    : '계산 보류'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Comparison Matrix (Responsive Cards on Mobile + Table on Desktop) */}
      <section className="border border-[#E7E2D8] bg-white rounded-md overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E7E2D8] bg-[#FBF9F5] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-kr text-base sm:text-lg font-semibold text-[#1C1917]">
              항목별 정밀 대조표
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              서로 다른 학파의 결과를 단일 점수로 합산하지 않고 항목별로 분리 비교합니다.
            </p>
          </div>
          <a
            href="https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline min-h-[36px]"
          >
            대법원 인명용 한자 공식 조회
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Mobile Card Matrix (< md) */}
        <div className="md:hidden divide-y divide-[#E7E2D8] text-xs">
          <div className="p-4 space-y-2">
            <div className="font-semibold text-[#1C1917]">한자 의미 및 인명용 상태</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#FBF9F5] rounded-sm">
                <div className="text-[11px] text-[#78716C] mb-0.5">비교 기준</div>
                <div className="text-[#57534E]">
                  {currentEval
                    ? `${currentEval.characters[1]?.hanja || ''}(${currentEval.characters[1]?.meaning.split(',')[0] || ''}) · ${currentEval.characters[2]?.hanja || ''}(${currentEval.characters[2]?.meaning.split(',')[0] || ''})`
                    : '미입력'}
                </div>
              </div>
              <div className="p-2.5 bg-[#FFF7ED]/50 rounded-sm">
                <div className="text-[11px] text-[#9A3412] mb-0.5">선택 후보</div>
                <div className="text-[#1C1917] font-medium">
                  {activeCandidate.characters[1]?.hanja}({activeCandidate.characters[1]?.meaning.split(',')[0]}) ·{' '}
                  {activeCandidate.characters[2]?.hanja}({activeCandidate.characters[2]?.meaning.split(',')[0]})
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="font-semibold text-[#1C1917]">발음오행 · 자원오행</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#FBF9F5] rounded-sm space-y-1">
                <div className="text-[11px] text-[#78716C]">비교 기준</div>
                <div className="text-[#57534E]">
                  발음: {currentEval?.pronunciationElements.harmonyLabel || '미입력'}
                </div>
                <div className="text-[#57534E]">
                  자원: {currentEval?.resourceAlignment.elements.filter(Boolean).join('·') || '미입력'}
                </div>
              </div>
              <div className="p-2.5 bg-[#FFF7ED]/50 rounded-sm space-y-1">
                <div className="text-[11px] text-[#9A3412]">선택 후보</div>
                <div className="text-[#1C1917] font-medium">
                  발음: {activeCandidate.pronunciationElements.harmonyLabel}
                </div>
                <div className="text-[#14532D] font-medium">
                  자원: {activeCandidate.resourceAlignment.elements.filter(Boolean).join('·') || '미분류'}
                </div>
              </div>
            </div>
          </div>

          {activeCandidate.numerology.grids.map((grid, idx) => {
            const curGrid = currentEval?.numerology.grids[idx];
            return (
              <div key={`mob-${grid.key}`} className="p-4 space-y-2">
                <div className="font-semibold text-[#1C1917]">
                  {grid.name} <span className="font-normal text-[#78716C]">({grid.period})</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
                  <div className="p-2.5 bg-[#FBF9F5] rounded-sm">
                    <div className="text-[11px] font-sans text-[#78716C]">비교 기준</div>
                    {curGrid ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span>{curGrid.reduced81}수</span>
                        <LuckGradeText grade={curGrid.grade} />
                      </div>
                    ) : (
                      <span className="text-[#78716C]">미입력</span>
                    )}
                  </div>
                  <div className="p-2.5 bg-[#FFF7ED]/50 rounded-sm">
                    <div className="text-[11px] font-sans text-[#9A3412]">선택 후보</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span>{grid.reduced81}수 ({grid.title.split('(')[0]})</span>
                      <LuckGradeText grade={grid.grade} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table Matrix (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FBF9F5] border-b border-[#E7E2D8] text-[#57534E]">
              <tr>
                <th className="py-2.5 px-4 font-medium w-44">비교 항목</th>
                <th className="py-2.5 px-4 font-medium">
                  개명 전 ({currentEval?.fullHangul || '미입력'})
                </th>
                <th className="py-2.5 px-4 font-medium">
                  선택 후보 ({activeCandidate.fullHangul})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2D8]">
              <tr>
                <td className="py-3 px-4 font-medium text-[#1C1917]">한자 의미 및 인명용 상태</td>
                <td className="py-3 px-4 text-[#57534E]">
                  {currentEval ? (
                    <>
                      <div>
                        {currentEval.characters[1]?.hanja}({currentEval.characters[1]?.meaning.split(',')[0]}) ·{' '}
                        {currentEval.characters[2]?.hanja}({currentEval.characters[2]?.meaning.split(',')[0]})
                      </div>
                      <div className="text-[11px] text-[#78716C] mt-0.5">
                        {currentEval.usability.legalStatusLabel}
                      </div>
                    </>
                  ) : (
                    '미확인'
                  )}
                </td>
                <td className="py-3 px-4 text-[#1C1917]">
                  <div>
                    {activeCandidate.characters[1]?.hanja}({activeCandidate.characters[1]?.meaning.split(',')[0]}) ·{' '}
                    {activeCandidate.characters[2]?.hanja}({activeCandidate.characters[2]?.meaning.split(',')[0]})
                  </div>
                  <div className="text-[11px] text-[#14532D] mt-0.5">
                    {activeCandidate.usability.legalStatusLabel}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-[#1C1917]">발음오행 흐름</td>
                <td className="py-3 px-4">
                  {currentEval ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {currentEval.pronunciationElements.elements.map((el, i) => (
                        <ElementTag key={i} element={el} />
                      ))}
                      <span className="text-[#57534E] ml-1">
                        ({currentEval.pronunciationElements.harmonyLabel})
                      </span>
                    </div>
                  ) : (
                    '미확인'
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeCandidate.pronunciationElements.elements.map((el, i) => (
                      <ElementTag key={i} element={el} />
                    ))}
                    <span className="text-[#1C1917] font-medium ml-1">
                      ({activeCandidate.pronunciationElements.harmonyLabel})
                    </span>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-[#1C1917]">자원오행 (사주 용신 보완)</td>
                <td className="py-3 px-4">
                  {currentEval ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {currentEval.resourceAlignment.elements.map((el, i) => (
                        <ElementTag key={i} element={el} />
                      ))}
                      <span className="text-[#57534E] ml-1">
                        {currentEval.resourceAlignment.matchesYongsin ? '용신 부합' : '용신 미일치'}
                      </span>
                    </div>
                  ) : (
                    '미확인'
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeCandidate.resourceAlignment.elements.map((el, i) => (
                      <ElementTag key={i} element={el} />
                    ))}
                    <span className="text-[#14532D] font-medium ml-1">
                      {activeCandidate.resourceAlignment.matchesYongsin
                        ? `용신(${activeCandidate.resourceAlignment.matchedElements.join('·')}) 보완`
                        : '참고 범위'}
                    </span>
                  </div>
                </td>
              </tr>

              {activeCandidate.numerology.grids.map((grid, idx) => {
                const curGrid = currentEval?.numerology.grids[idx];
                return (
                  <tr key={grid.key}>
                    <td className="py-3 px-4 font-medium text-[#1C1917]">
                      {grid.name} ({grid.period})
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#57534E]">
                      {curGrid ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {curGrid.reduced81}수 ({curGrid.title})
                          </span>
                          <LuckGradeText grade={curGrid.grade} />
                        </div>
                      ) : (
                        '미확인'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#1C1917]">
                      <div className="flex items-center gap-2">
                        <span>
                          {grid.reduced81}수 ({grid.title})
                        </span>
                        <LuckGradeText grade={grid.grade} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              <tr>
                <td className="py-3 px-4 font-medium text-[#1C1917]">총 획수 및 실사용성</td>
                <td className="py-3 px-4 text-[#57534E]">
                  {currentEval
                    ? `총 ${currentEval.usability.totalStrokeLoad ?? '?'}획 · ${
                        currentEval.usability.notes[0] || '특이 플래그 없음'
                      }`
                    : '미확인'}
                </td>
                <td className="py-3 px-4 text-[#1C1917]">
                  총 {activeCandidate.usability.totalStrokeLoad ?? '?'}획 ·{' '}
                  {activeCandidate.usability.notes[0] || '특이 플래그 없음'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Renaming Interpretation Section */}
      <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E7E2D8] pb-4">
          <div>
            <p className="text-xs text-[#78716C]">
              LUCKYBRIDGE/name 출력 원칙 준수 (확인된 사실 / 전통 해석 / 미확인 분리)
            </p>
            <h3 className="font-serif-kr text-lg font-semibold text-[#1C1917] mt-0.5">
              {appMode === 'naming' ? 'AI 작명 심층 해설 리포트' : 'AI 개명 심층 해설 리포트'}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={reasonForAnalysis}
              onChange={(e) => onChangeReasonForAnalysis(e.target.value)}
              placeholder="희망 방향 (예: 부드러운 어감, 화/목 오행 보완)"
              className="w-full sm:w-72 px-3 min-h-[44px] sm:min-h-[36px] text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
            />
            <button
              type="button"
              onClick={handleRequestAi}
              disabled={aiLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading ? 'AI 해설 작성 중...' : '심층 해설 생성'}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="p-3 border border-[#FECACA] bg-[#FEF2F2] text-xs text-[#9A3412] rounded-sm">
            {aiError}
          </div>
        )}

        {aiLoading ? (
          <div className="space-y-2.5 py-4 animate-pulse">
            <div className="h-4 bg-[#F4EFE6] rounded w-1/3" />
            <div className="h-3 bg-[#F4EFE6] rounded w-full" />
            <div className="h-3 bg-[#F4EFE6] rounded w-5/6" />
            <div className="h-3 bg-[#F4EFE6] rounded w-4/5" />
          </div>
        ) : aiText ? (
          <div className="prose prose-sm max-w-none text-sm text-[#1C1917] leading-relaxed whitespace-pre-wrap">
            {aiText}
          </div>
        ) : (
          <p className="text-xs text-[#78716C] py-2 leading-relaxed">
            상단의 &apos;심층 해설 생성&apos;을 누르면 계산된 사주·성명학 수치와 &apos;
            {activeCandidate.characters[0]?.hangul}({activeCandidate.characters[0]?.hanja})&apos; 성씨 기준을 토대로
            이름의 장단점, 현대적 어감, 한자 다중의미·뜻의 조화, 학파별 유의점을 정리해 드립니다.
          </p>
        )}
      </section>
    </div>
  );
}
