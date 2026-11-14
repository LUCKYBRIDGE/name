import { AlertTriangle, ArrowRight, Calendar, Compass, Info, Users } from 'lucide-react';
import type {
  AppMode,
  BirthInput,
  FiveElement,
  NormalizedSurnameProfile,
  RepoMetadata,
  SajuAnalysisResult,
} from '../types/naming.ts';
import { ELEMENT_META, ElementTag } from './ElementBadge.tsx';
import { FiveElementCycleSvg } from './FiveElementCycleSvg.tsx';
import { buildPlainSajuSummary, TEN_GOD_PLAIN } from '../lib/plainKoreanHelper.ts';

interface SajuSurnamePanelProps {
  appMode: AppMode;
  selectedSurnameHangul: string;
  selectedSurnameHanja: string;
  selectedSurnameProfile: NormalizedSurnameProfile | null;
  onOpenSurnamePicker: () => void;
  onApply2026Today: () => void;
  birthInput: BirthInput;
  onChangeBirthInput: (next: BirthInput) => void;
  onAnalyzeSaju: () => void;
  sajuLoading: boolean;
  sajuError: string | null;
  sajuResult: SajuAnalysisResult | null;
  repoMeta: RepoMetadata | null;
  onProceedToNaming: (elements: FiveElement[]) => void;
}

const ELEMENTS_ORDER: FiveElement[] = ['목', '화', '토', '금', '수'];

export function SajuSurnamePanel({
  appMode,
  selectedSurnameHangul,
  selectedSurnameHanja,
  selectedSurnameProfile,
  onOpenSurnamePicker,
  onApply2026Today,
  birthInput,
  onChangeBirthInput,
  onAnalyzeSaju,
  sajuLoading,
  sajuError,
  sajuResult,
  repoMeta,
  onProceedToNaming,
}: SajuSurnamePanelProps) {
  const updateField = <K extends keyof BirthInput>(key: K, value: BirthInput[K]) => {
    onChangeBirthInput({ ...birthInput, [key]: value });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section 1: Birth Input & Saju Four Pillars */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Birth Datetime Input Card (4 cols) */}
        <div className="lg:col-span-4 border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6">
          <div className="border-b border-[#E7E2D8] pb-3 mb-4 sm:mb-5 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-[#78716C] tracking-wide">01. 출생 일시 및 역법 설정</p>
              <h2 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-1">
                {appMode === 'naming' ? '작명 대상 사주 입력' : '내 사주 명식 입력'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onApply2026Today}
              className="inline-flex items-center gap-1 px-2.5 min-h-[38px] text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm cursor-pointer whitespace-nowrap shrink-0"
              title="2026년 오늘 날짜로 세팅"
            >
              <Calendar className="w-3.5 h-3.5 text-[#9A3412]" />
              2026 오늘
            </button>
          </div>

          <div className="space-y-4">
            {/* Solar / Lunar + Leap Month */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#F4EFE6] rounded-md border border-[#E7E2D8]">
                <button
                  type="button"
                  onClick={() => updateField('calendarType', 'solar')}
                  className={`px-3.5 min-h-[38px] sm:min-h-[32px] text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                    birthInput.calendarType === 'solar'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  양력
                </button>
                <button
                  type="button"
                  onClick={() => updateField('calendarType', 'lunar')}
                  className={`px-3.5 min-h-[38px] sm:min-h-[32px] text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                    birthInput.calendarType === 'lunar'
                      ? 'bg-white text-[#1C1917] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  음력
                </button>
              </div>

              {birthInput.calendarType === 'lunar' && (
                <label className="inline-flex items-center gap-2 text-xs text-[#57534E] cursor-pointer min-h-[38px]">
                  <input
                    type="checkbox"
                    checked={birthInput.isLeapMonth}
                    onChange={(e) => updateField('isLeapMonth', e.target.checked)}
                    className="w-4 h-4 accent-[#9A3412]"
                  />
                  윤달 포함
                </label>
              )}
            </div>

            {/* Year / Month / Day */}
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-xs text-[#57534E] mb-1">출생 연도</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1920}
                  max={2030}
                  value={birthInput.year}
                  onChange={(e) => updateField('year', Number(e.target.value))}
                  className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-[#57534E] mb-1">월</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  value={birthInput.month}
                  onChange={(e) => updateField('month', Number(e.target.value))}
                  className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-[#57534E] mb-1">일</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={birthInput.day}
                  onChange={(e) => updateField('day', Number(e.target.value))}
                  className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                />
              </label>
            </div>

            {/* Hour / Minute / Time Unknown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#57534E]">출생 시각 (24시간제)</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-[#57534E] cursor-pointer min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={birthInput.timeUnknown}
                    onChange={(e) => updateField('timeUnknown', e.target.checked)}
                    className="w-4 h-4 accent-[#9A3412]"
                  />
                  시간 모름 · 출생 전 (3주)
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={23}
                    disabled={birthInput.timeUnknown}
                    value={birthInput.hour}
                    onChange={(e) => updateField('hour', Number(e.target.value))}
                    className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] disabled:opacity-50 focus:outline-none focus:border-[#9A3412]"
                    aria-label="시"
                  />
                </label>
                <label className="block">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    disabled={birthInput.timeUnknown}
                    value={birthInput.minute}
                    onChange={(e) => updateField('minute', Number(e.target.value))}
                    className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] disabled:opacity-50 focus:outline-none focus:border-[#9A3412]"
                    aria-label="분"
                  />
                </label>
              </div>
              {birthInput.timeUnknown && (
                <p className="text-[11px] text-[#78716C] leading-relaxed">
                  출생 전 후보 탐색이나 시각 미확인 시 시주 확정 없이 3주(년·월·일주) 기준으로 분석하고, 출생 후 시주를 다시 확정할 수 있습니다.
                </p>
              )}
            </div>

            {/* Gender & True Solar Time */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-xs text-[#57534E] mb-1">성별 (방법론 참고)</span>
                <select
                  value={birthInput.gender}
                  onChange={(e) =>
                    updateField('gender', e.target.value as 'male' | 'female' | 'unspecified')
                  }
                  className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="unspecified">미지정</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs text-[#57534E] mb-1">자시 일주 경계</span>
                <select
                  value={birthInput.ziHourMethod}
                  onChange={(e) => updateField('ziHourMethod', e.target.value as 'midnight' | 'late_zi')}
                  className="w-full px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="midnight">자정(00시) 기준</option>
                  <option value="late_zi">야자시(23시 익일)</option>
                </select>
              </label>
            </div>

            {/* True Solar Time Toggle */}
            <div className="p-3 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={birthInput.useTrueSolarTime}
                  onChange={(e) => updateField('useTrueSolarTime', e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#9A3412] shrink-0"
                />
                <span>
                  진태양시(서울 경도 127.0°E 기준 -32분) 보정 적용
                  <span className="block text-[11px] text-[#78716C] mt-0.5 leading-relaxed">
                    표준시(135°E) 대비 약 32분 시차를 보정하며, 학파별 선택 항목입니다.
                  </span>
                </span>
              </label>
            </div>

            {sajuError && (
              <div className="p-3 border border-[#FECACA] bg-[#FEF2F2] text-[#9A3412] text-xs rounded-sm">
                {sajuError}
              </div>
            )}

            <button
              type="button"
              onClick={onAnalyzeSaju}
              disabled={sajuLoading}
              className="w-full min-h-[46px] px-4 text-sm font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-sm transition-colors cursor-pointer"
            >
              {sajuLoading ? '만세력 계산 중...' : '사주 팔자 및 용신 산출'}
            </button>
          </div>
        </div>

        {/* Right: Saju Chart & Element Distribution (8 cols) */}
        <div className="lg:col-span-8 border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6">
          {!sajuResult ? (
            <div className="py-14 sm:py-16 text-center space-y-2">
              <Compass className="w-8 h-8 text-[#78716C] mx-auto" />
              <p className="text-sm font-medium text-[#1C1917]">
                출생 일시를 입력하고 사주 팔자를 산출해 주세요.
              </p>
              <p className="text-xs text-[#78716C]">
                한국 표준시 이력, 서머타임(DST) 및 KASI 절입 경계를 함께 검증합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6">
              {/* Top Meta Summary (Zero-pill unboxed typography) */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 border-b border-[#E7E2D8] pb-4">
                <div>
                  <p className="text-xs text-[#78716C]">
                    양력 {sajuResult.solarDateLabel} · 음력 {sajuResult.lunarDateLabel} ·{' '}
                    {sajuResult.utcOffsetApplied}
                  </p>
                  <h3 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-1">
                    사주 원국표 — 일간 {sajuResult.dayMaster.stem}({sajuResult.dayMaster.hangul},{' '}
                    {sajuResult.dayMaster.yinYang}·{sajuResult.dayMaster.element})
                  </h3>
                </div>
                <div className="sm:text-right text-xs font-mono tabular-nums text-[#57534E]">
                  <div>적용 시각: {sajuResult.adjustedTimeLabel}</div>
                  <div className="text-[11px] font-sans text-[#78716C] mt-0.5">
                    {sajuResult.historicalTimeNote}
                  </div>
                </div>
              </div>

              {/* Boundary Warnings */}
              {sajuResult.boundaryWarnings.length > 0 && (
                <div className="p-3.5 border border-[#FDE68A] bg-[#FEFCE8] rounded-sm space-y-1">
                  {sajuResult.boundaryWarnings.map((warn, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#78350F]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Plain-Korean Easy Saju Summary */}
              {(() => {
                const plain = buildPlainSajuSummary(sajuResult);
                return (
                  <div className="p-3.5 sm:p-4 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1.5">
                    <div className="text-xs font-semibold text-[#9A3412]">
                      쉽게 읽는 내 사주 요약
                    </div>
                    <div className="text-sm font-semibold text-[#1C1917]">{plain.headline}</div>
                    <ul className="space-y-1 text-xs text-[#57534E] leading-relaxed list-disc list-inside">
                      {plain.lines.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* 4-Pillar Grid (Traditional Right-to-Left order: 시주 | 일주 | 월주 | 년주) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {[...sajuResult.pillars].reverse().map((pillar) => (
                  <div
                    key={pillar.label}
                    className={`border rounded-sm p-3 sm:p-3.5 text-center ${
                      pillar.label === '일주'
                        ? 'border-[#9A3412]/50 bg-[#FBF9F5]'
                        : 'border-[#E7E2D8] bg-white'
                    }`}
                  >
                    <div className="text-xs font-medium text-[#78716C] mb-2">
                      {pillar.label}
                      {pillar.label === '일주' ? ' · 나' : ''}
                    </div>

                    {/* Heavenly Stem */}
                    <div className="pb-2.5 border-b border-[#E7E2D8]">
                      <div className="text-[11px] text-[#57534E] mb-1">
                        {pillar.stemTenGod}
                        {TEN_GOD_PLAIN[pillar.stemTenGod] ? (
                          <span className="block text-[10px] text-[#78716C]">
                            ({TEN_GOD_PLAIN[pillar.stemTenGod]})
                          </span>
                        ) : null}
                      </div>
                      <div className="font-serif-kr text-2xl sm:text-3xl font-bold text-[#1C1917]">
                        {pillar.stem}
                      </div>
                      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-[#57534E]">
                        <span>{pillar.stemHangul}</span>
                        <span aria-hidden="true">·</span>
                        <ElementTag element={pillar.stemElement} />
                      </div>
                    </div>

                    {/* Earthly Branch */}
                    <div className="pt-2.5">
                      <div className="font-serif-kr text-2xl sm:text-3xl font-bold text-[#1C1917]">
                        {pillar.branch}
                      </div>
                      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-[#57534E]">
                        <span>{pillar.branchHangul}</span>
                        <span aria-hidden="true">·</span>
                        <ElementTag element={pillar.branchElement} />
                      </div>
                      <div className="mt-2 text-[11px] text-[#57534E]">
                        {pillar.branchTenGod}
                        {TEN_GOD_PLAIN[pillar.branchTenGod]
                          ? `(${TEN_GOD_PLAIN[pillar.branchTenGod]})`
                          : ''}{' '}
                        · {pillar.twelveStage}
                      </div>
                      <div className="mt-1.5 text-[10px] sm:text-[11px] text-[#78716C]">
                        지장간:{' '}
                        {pillar.hiddenStems
                          .map((h) => `${h.stem}(${h.element})`)
                          .join(' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Element Distribution & Pentagon Cycle + Yongsin Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1">
                {/* Left: Visual Pentagon + 5-Element Counts */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-sm font-semibold text-[#1C1917]">오행 균형 및 상생 도표</h4>
                    <span className="text-[11px] text-[#78716C]">단순 개수 ≠ 용신 확정</span>
                  </div>

                  <div className="p-3 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                    <FiveElementCycleSvg
                      counts={sajuResult.elementCounts}
                      dayMasterElement={sajuResult.dayMaster.element}
                      yongsinElements={sajuResult.eokbuYongsinCandidates}
                    />
                  </div>

                  <div className="space-y-2">
                    {ELEMENTS_ORDER.map((el) => {
                      const rawCount = sajuResult.elementCounts[el];
                      const weighted = sajuResult.hiddenWeightedCounts[el];
                      const meta = ELEMENT_META[el];
                      const pct = Math.min(100, Math.round((weighted / 8) * 100));
                      return (
                        <div key={el} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <ElementTag element={el} />
                              {rawCount === 0 && (
                                <span className="text-[11px] text-[#9A3412]">표면 미출현(무)</span>
                              )}
                              {rawCount >= 3 && (
                                <span className="text-[11px] text-[#78350F]">다수 분포</span>
                              )}
                            </div>
                            <span className="font-mono tabular-nums text-[#57534E]">
                              표면 {rawCount}개 · 가중 {weighted.toFixed(1)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#F4EFE6] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${meta.barColor} transition-all duration-300`}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Yongsin & Interactions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1C1917]">
                    명리 해석 레이어 ({sajuResult.dayMasterStrength})
                  </h4>

                  <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1C1917]">억부용신 후보 오행</span>
                      <div className="flex items-center gap-1.5">
                        {sajuResult.eokbuYongsinCandidates.map((el) => (
                          <ElementTag key={el} element={el} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#57534E] leading-relaxed">{sajuResult.strengthNote}</p>
                  </div>

                  <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1 text-xs">
                    <div className="font-medium text-[#1C1917]">조후(계절 한난조습) 참고</div>
                    <p className="text-[#57534E] leading-relaxed">{sajuResult.johuNote}</p>
                  </div>

                  {sajuResult.interactions.length > 0 && (
                    <div className="text-xs text-[#57534E] leading-relaxed">
                      <span className="font-medium text-[#1C1917]">원국 합·충·형·해: </span>
                      {sajuResult.interactions.join(' · ')}
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onProceedToNaming(sajuResult.eokbuYongsinCandidates)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 min-h-[44px] sm:min-h-[38px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      보완 오행({sajuResult.eokbuYongsinCandidates.join('·')})으로{' '}
                      {appMode === 'naming' ? '새 이름 작명하기' : '이름 감정 · 개명 후보 찾기'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Active Selected Surname Specialized Profile from LUCKYBRIDGE/name */}
      <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E2D8] pb-4">
          <div>
            <p className="text-xs text-[#78716C]">
              02. LUCKYBRIDGE/name 성씨 기준 레코드 ({repoMeta?.surnames.length ?? 31}대 성씨 ·{' '}
              {selectedSurnameProfile?.codepoint || '직접 입력 성씨'})
            </p>
            <h2 className="font-serif-kr text-xl sm:text-2xl font-semibold text-[#1C1917] mt-1">
              성씨 {selectedSurnameHangul} ({selectedSurnameHanja}) 정밀 작명 프로필
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
            {selectedSurnameProfile && (
              <div className="text-xs font-mono tabular-nums text-[#57534E]">
                인구 {selectedSurnameProfile.population2015.toLocaleString()}명 (점유율{' '}
                {selectedSurnameProfile.sharePercent2015}% · {selectedSurnameProfile.rank2015}위)
              </div>
            )}
            <button
              type="button"
              onClick={onOpenSurnamePicker}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] sm:min-h-[36px] text-xs font-medium border border-[#9A3412]/40 bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#9A3412] rounded-sm cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              다른 성씨 선택
            </button>
          </div>
        </div>

        {selectedSurnameProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Column 1: Core Character & Pronunciation Profile */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                <div className="w-16 h-16 border border-[#D6CEBE] bg-white flex items-center justify-center font-serif-kr text-4xl font-bold text-[#1C1917] shrink-0">
                  {selectedSurnameProfile.hanja}
                </div>
                <div className="space-y-1 text-xs min-w-0">
                  <div className="text-sm font-semibold text-[#1C1917] truncate">
                    {selectedSurnameProfile.dictionaryGloss} · 부수 {selectedSurnameProfile.radical}
                  </div>
                  <div className="font-mono tabular-nums text-[#57534E]">
                    기술 {selectedSurnameProfile.technicalTotalStrokes}획 · 원획{' '}
                    {selectedSurnameProfile.wonhoekStrokes}획 (
                    {selectedSurnameProfile.wonhoekStrokes % 2 === 1 ? '양 陽' : '음 陰'})
                  </div>
                  <div className="flex items-center gap-1.5 text-[#57534E]">
                    <span>
                      음절 {selectedSurnameProfile.hangul} ({selectedSurnameProfile.syllableShape}, 초성{' '}
                      {selectedSurnameProfile.onset})
                    </span>
                    <ElementTag element={selectedSurnameProfile.soundElement} />
                  </div>
                </div>
              </div>

              <div className="p-3.5 border border-[#E7E2D8] rounded-sm text-xs space-y-1.5">
                <div className="font-semibold text-[#1C1917]">
                  발음 경계 특성 (
                  {selectedSurnameProfile.syllableShape === 'CV'
                    ? '열린 음절 CV · 받침 없음'
                    : `닫힌 음절 CVC · 받침 '${selectedSurnameProfile.coda}'`}
                  )
                </div>
                <p className="text-[#57534E] leading-relaxed">
                  {selectedSurnameProfile.pronunciationNote}
                </p>
              </div>
            </div>

            {/* Column 2: Naming Policy Rules */}
            <div className="space-y-2.5 text-xs">
              <h3 className="text-sm font-semibold text-[#1C1917]">
                {selectedSurnameProfile.hangul}({selectedSurnameProfile.hanja}) 성씨 작명 핵심 원칙
              </h3>
              <ul className="space-y-2 text-[#57534E]">
                <li className="p-2.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                  <span className="font-semibold text-[#1C1917]">성씨 의미 분리: </span>
                  {selectedSurnameProfile.namingPolicy.surname_semantics ||
                    '성씨의 사전 뜻을 이름자 의미 품질 점수에 자동 합산하지 않습니다.'}
                </li>
                <li className="p-2.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                  <span className="font-semibold text-[#1C1917]">획수 방법론 명시: </span>
                  {selectedSurnameProfile.strokeRule ||
                    '원격·형격·이격·정격 계산 시 원획법/기술총획 기준을 명시해 분리 적용합니다.'}
                </li>
                <li className="p-2.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                  <span className="font-semibold text-[#1C1917]">
                    &apos;{selectedSurnameProfile.hangul}+{selectedSurnameProfile.hangul}○&apos; 반복 처리:{' '}
                  </span>
                  {selectedSurnameProfile.namingPolicy.syllable_repetition ||
                    selectedSurnameProfile.namingPolicy.repeated_syllable ||
                    '성과 이름 첫 음절이 반복되어도 자동 탈락시키지 않고 실사용성 안내로만 처리합니다.'}
                </li>
                <li className="p-2.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
                  <span className="font-semibold text-[#1C1917]">여권 로마자 참고: </span>
                  기본 규칙형{' '}
                  <span className="font-mono font-semibold text-[#1C1917]">
                    {selectedSurnameProfile.romanizationRuleForm}
                  </span>{' '}
                  — {selectedSurnameProfile.romanizationNote}
                </li>
              </ul>
            </div>

            {/* Column 3: Bongwan Census & Historical Evidence Levels */}
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-semibold text-[#1C1917]">주요 본관 분포 (2015 인구주택총조사)</h3>
              {selectedSurnameProfile.clans.length > 0 ? (
                <div className="border border-[#E7E2D8] rounded-sm divide-y divide-[#E7E2D8]">
                  {selectedSurnameProfile.clans.slice(0, 8).map((clan) => (
                    <div
                      key={clan.bongwan}
                      className={`flex items-center justify-between px-3 py-2 text-xs ${
                        clan.isAggregate ? 'bg-[#FBF9F5] text-[#78716C]' : ''
                      }`}
                    >
                      <span className={clan.isAggregate ? 'font-normal' : 'font-medium text-[#1C1917]'}>
                        {clan.isAggregate
                          ? clan.bongwan
                          : `${clan.bongwan} ${selectedSurnameProfile.hangul}씨`}
                      </span>
                      <span className="font-mono tabular-nums text-[#57534E]">
                        {clan.population.toLocaleString()}명
                        {clan.sharePercent !== undefined ? ` (${clan.sharePercent}%)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm text-[#78716C]">
                  {selectedSurnameProfile.hangul}({selectedSurnameProfile.hanja})씨 본관별 상세 통계 표는 추가 정리 중입니다.
                </div>
              )}

              {selectedSurnameProfile.genealogyNotes.length > 0 && (
                <div className="flex items-start gap-1.5 text-[11px] text-[#78716C] leading-relaxed">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {selectedSurnameProfile.genealogyNotes[0].bongwan} 본관 참고:{' '}
                    {selectedSurnameProfile.genealogyNotes[0].claim}
                    {selectedSurnameProfile.genealogyNotes[0].person
                      ? ` (${selectedSurnameProfile.genealogyNotes[0].person})`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm text-xs text-[#57534E] leading-relaxed">
            직접 입력하신 성씨 <strong>{selectedSurnameHangul}({selectedSurnameHanja})</strong>가 적용되었습니다.
            인명용 한자 마스터 획수 및 초성 발음오행을 기준으로 수리·발음·자원오행을 계산합니다.
          </div>
        )}
      </section>
    </div>
  );
}
