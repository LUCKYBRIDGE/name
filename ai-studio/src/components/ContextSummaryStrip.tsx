import { useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppMode, NameEvaluation, SajuAnalysisResult, StudioTab } from '../types/naming.ts';
import { GLOSSARY_ITEMS } from '../lib/plainKoreanHelper.ts';

interface ContextSummaryStripProps {
  appMode: AppMode;
  surnameHangul: string;
  surnameHanja: string;
  activeTab: StudioTab;
  onNavigate: (tab: StudioTab) => void;
  onOpenSurnamePicker: () => void;
  sajuResult: SajuAnalysisResult | null;
  currentEval: NameEvaluation | null;
  selectedCandidate: NameEvaluation | null;
}

export function ContextSummaryStrip({
  appMode,
  surnameHangul,
  surnameHanja,
  activeTab,
  onNavigate,
  onOpenSurnamePicker,
  sajuResult,
  currentEval,
  selectedCandidate,
}: ContextSummaryStripProps) {
  const [showGlossary, setShowGlossary] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const stepDone1 = Boolean(sajuResult);
  const stepDone2 = Boolean(selectedCandidate);

  const goodDelta =
    currentEval?.numerology.available && selectedCandidate?.numerology.available
      ? selectedCandidate.numerology.goodCount - currentEval.numerology.goodCount
      : null;

  return (
    <div className="mb-5 sm:mb-6 space-y-2">
      {/* Compact Mobile Summary Bar (< lg) */}
      <div className="lg:hidden border border-[#E7E2D8] bg-white rounded-md px-3.5 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left min-h-[40px] flex items-center gap-2 cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-[#78716C] truncate">
              {appMode === 'naming' ? '새 이름 작명' : '내 이름 사주분석'} · 성씨{' '}
              <strong className="text-[#1C1917]">
                {surnameHangul}({surnameHanja})
              </strong>
              {sajuResult ? ` · 용신 ${sajuResult.eokbuYongsinCandidates.join('·')}` : ''}
            </div>
            <div className="text-xs font-medium text-[#1C1917] truncate">
              {selectedCandidate
                ? `선택: ${selectedCandidate.fullHangul}(${selectedCandidate.fullHanja}) · 4격 ${selectedCandidate.numerology.goodCount}/4`
                : sajuResult
                ? `${sajuResult.solarDateLabel} · 일간 ${sajuResult.dayMaster.stem}(${sajuResult.dayMaster.element})`
                : '생년월일시를 입력해 주세요'}
            </div>
          </div>
          {mobileExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#78716C] shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#78716C] shrink-0" />
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSurnamePicker}
            className="px-2.5 min-h-[38px] text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] rounded-sm cursor-pointer whitespace-nowrap"
          >
            성씨 변경
          </button>
          <button
            type="button"
            onClick={() => setShowGlossary((v) => !v)}
            className="px-2.5 min-h-[38px] text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#9A3412] rounded-sm cursor-pointer whitespace-nowrap"
          >
            용어
          </button>
        </div>
      </div>

      {/* Full 3-step Bar (always visible on lg:, expandable on mobile) */}
      <div
        className={`${
          mobileExpanded ? 'block' : 'hidden'
        } lg:block border border-[#E7E2D8] bg-white rounded-md px-4 sm:px-5 py-3.5`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center divide-y lg:divide-y-0 lg:divide-x divide-[#E7E2D8]">
          {/* Step 1: Saju Context */}
          <div className="lg:col-span-3 flex items-center justify-between gap-2 lg:pr-4 pt-1 lg:pt-0">
            <button
              type="button"
              onClick={() => onNavigate('saju')}
              className="min-w-0 flex-1 text-left cursor-pointer group min-h-[40px] flex flex-col justify-center"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
                <span className={activeTab === 'saju' ? 'text-[#9A3412] font-semibold' : ''}>
                  1단계 · 사주 및 {surnameHangul}({surnameHanja}) 성씨
                </span>
                {stepDone1 && <span className="text-[#14532D]">· 완료</span>}
              </div>
              <div className="text-xs font-medium text-[#1C1917] mt-0.5 truncate group-hover:text-[#9A3412] transition-colors">
                {sajuResult
                  ? `${sajuResult.solarDateLabel} · 일간 ${sajuResult.dayMaster.stem}(${sajuResult.dayMaster.element}) · 추천 [${sajuResult.eokbuYongsinCandidates.join('·')}]`
                  : '생년월일시를 입력해 주세요'}
              </div>
            </button>
            <button
              type="button"
              onClick={onOpenSurnamePicker}
              className="hidden lg:inline-flex px-2.5 py-1.5 text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm shrink-0 cursor-pointer"
            >
              성씨 변경
            </button>
          </div>

          {/* Step 2: Existing Name vs Naming Studio */}
          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="lg:col-span-4 text-left flex items-center justify-between gap-2 lg:px-4 pt-3 lg:pt-0 cursor-pointer group min-h-[40px]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
                <span className={activeTab === 'studio' ? 'text-[#9A3412] font-semibold' : ''}>
                  {appMode === 'naming'
                    ? '2단계 · 새 이름 작명하기'
                    : '2단계 · 기존 이름 → 새 후보 찾기'}
                </span>
              </div>
              <div className="text-xs font-medium text-[#1C1917] mt-0.5 truncate group-hover:text-[#9A3412] transition-colors">
                {appMode === 'analyze' ? (
                  <>
                    {currentEval ? (
                      <>
                        기존{' '}
                        <span className="font-serif-kr">
                          {currentEval.fullHangul}({currentEval.fullHanja})
                        </span>
                        {currentEval.numerology.available && (
                          <span className="text-[#78716C] font-mono tabular-nums ml-1">
                            [{currentEval.numerology.goodCount}/4]
                          </span>
                        )}
                      </>
                    ) : (
                      '기존 이름 입력'
                    )}
                    {' → '}
                  </>
                ) : null}
                {selectedCandidate ? (
                  <span className="text-[#9A3412]">
                    {selectedCandidate.fullHangul}({selectedCandidate.fullHanja})
                  </span>
                ) : (
                  <span className="text-[#78716C]">후보 선택 필요</span>
                )}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] shrink-0 group-hover:text-[#9A3412]" />
          </button>

          {/* Step 3: Comparison Delta */}
          <button
            type="button"
            onClick={() => onNavigate('compare')}
            className="lg:col-span-3 text-left flex items-center justify-between gap-2 lg:px-4 pt-3 lg:pt-0 cursor-pointer group min-h-[40px]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
                <span className={activeTab === 'compare' ? 'text-[#9A3412] font-semibold' : ''}>
                  {appMode === 'naming'
                    ? '3단계 · 작명 리포트·AI 해설'
                    : '3단계 · 개명 비교·AI 해설'}
                </span>
                {stepDone2 && <span className="text-[#14532D]">· 준비됨</span>}
              </div>
              <div className="text-xs font-medium text-[#1C1917] mt-0.5 truncate group-hover:text-[#9A3412] transition-colors">
                {selectedCandidate ? (
                  <>
                    4격 길수 {selectedCandidate.numerology.goodCount}/4
                    {appMode === 'analyze' && goodDelta !== null && goodDelta > 0 && (
                      <span className="text-[#14532D] font-semibold ml-1">
                        (+{goodDelta}격 개선)
                      </span>
                    )}
                    {' · '}
                    {selectedCandidate.pronunciationElements.harmonyLabel}
                  </>
                ) : (
                  '후보 선택 시 상세 리포트 활성화'
                )}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] shrink-0 group-hover:text-[#9A3412]" />
          </button>

          {/* Easy Glossary Toggle */}
          <div className="hidden lg:flex lg:col-span-2 lg:pl-4 justify-end">
            <button
              type="button"
              onClick={() => setShowGlossary((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#9A3412]" />
              용어 쉬운 안내
              {showGlossary ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#78716C]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Plain-Korean Glossary Guide */}
      {showGlossary && (
        <div className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E7E2D8] pb-2">
            <h3 className="text-sm font-semibold text-[#1C1917]">
              처음 보시는 분을 위한 사주 · 성명학 쉬운 안내
            </h3>
            <span className="text-[11px] text-[#78716C]">
              전통 해석은 참고 기준이며, 발음과 뜻의 선호도가 가장 중요합니다
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {GLOSSARY_ITEMS.map((item) => (
              <div
                key={item.term}
                className="p-3 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1"
              >
                <div className="font-semibold text-[#1C1917]">{item.term}</div>
                <div className="text-[11px] font-medium text-[#9A3412]">{item.short}</div>
                <p className="text-[#57534E] leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
