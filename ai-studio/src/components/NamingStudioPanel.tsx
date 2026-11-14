import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUp,
  Bookmark,
  Check,
  GitCompare,
  RotateCcw,
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  AppMode,
  FiveElement,
  HanjaRecord,
  NameCandidateRequest,
  NameEvaluation,
  NameRecommendResponse,
  NormalizedSurnameProfile,
  SajuAnalysisResult,
  SavedWorkspaceProfile,
  StrokeMethodId,
} from '../types/naming.ts';
import { ElementTag, LuckGradeText } from './ElementBadge.tsx';
import { StrokeOrderCard } from './StrokeOrderCard.tsx';
import { HanjaPickerModal, type HanjaPickerMode } from './HanjaPickerModal.tsx';
import { buildPlainNameSummary } from '../lib/plainKoreanHelper.ts';

type NamingConfig = SavedWorkspaceProfile['namingConfig'];

interface NamingStudioPanelProps {
  appMode: AppMode;
  surnameHangul: string;
  surnameHanja: string;
  surnameProfile: NormalizedSurnameProfile | null;
  onOpenSurnamePicker: () => void;
  namingConfig: NamingConfig;
  onChangeNamingConfig: (patch: Partial<NamingConfig>) => void;
  sajuResult: SajuAnalysisResult | null;
  strokeMethod: StrokeMethodId;
  onChangeStrokeMethod: (m: StrokeMethodId) => void;
  surnameStrokeOverride: number | null;
  onChangeSurnameStrokeOverride: (n: number | null) => void;
  currentHangul1: string;
  currentHangul2: string;
  currentHanja1: string;
  currentHanja2: string;
  onChangeCurrentName: (h1: string, c1: string, h2: string, c2: string) => void;
  currentEval: NameEvaluation | null;
  selectedCandidate: NameEvaluation | null;
  onSelectCandidate: (ev: NameEvaluation) => void;
  savedCandidates: NameEvaluation[];
  onToggleSaveCandidate: (ev: NameEvaluation) => void;
  onOpenComparison: (ev: NameEvaluation) => void;
}

const ALL_ELEMENTS: FiveElement[] = ['목', '화', '토', '금', '수'];

export function NamingStudioPanel({
  appMode,
  surnameHangul,
  surnameHanja,
  surnameProfile,
  onOpenSurnamePicker,
  namingConfig,
  onChangeNamingConfig,
  sajuResult,
  strokeMethod,
  onChangeStrokeMethod,
  surnameStrokeOverride,
  onChangeSurnameStrokeOverride,
  currentHangul1,
  currentHangul2,
  currentHanja1,
  currentHanja2,
  onChangeCurrentName,
  currentEval,
  selectedCandidate,
  onSelectCandidate,
  savedCandidates,
  onToggleSaveCandidate,
  onOpenComparison,
}: NamingStudioPanelProps) {
  const {
    studioMode,
    targetElements,
    recHangul1,
    recHangul2,
    recFixedHanja1,
    recFixedHanja2,
    preferredInput,
    manHangul1,
    manHanja1,
    manHangul2,
    manHanja2,
    requireAllFourGood,
    requireSoundHarmony,
    excludeTaboo,
    avoidSurnameRepetition,
    maxStrokesPerChar,
  } = namingConfig;

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  const [recPool1, setRecPool1] = useState<HanjaRecord[]>([]);
  const [recPool2, setRecPool2] = useState<HanjaRecord[]>([]);
  const [pickerModal, setPickerModal] = useState<{ open: boolean; mode: HanjaPickerMode }>({
    open: false,
    mode: 'slot1',
  });

  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [relaxedNotice, setRelaxedNotice] = useState<string | null>(null);
  const [resolvedPatternLabel, setResolvedPatternLabel] = useState<string>(`${surnameHangul} X X`);
  const [recommendations, setRecommendations] = useState<NameEvaluation[]>([]);

  // Parse preferred Hangul syllables and Hanja characters from freeform input (e.g. "우, 宇, 윤")
  const parsedPreferences = useMemo(() => {
    const hangul: string[] = [];
    const hanja: string[] = [];
    for (const ch of preferredInput) {
      if (/[가-힣]/.test(ch)) {
        if (!hangul.includes(ch)) hangul.push(ch);
      } else if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(ch)) {
        if (!hanja.includes(ch)) hanja.push(ch);
      }
    }
    return { hangul, hanja };
  }, [preferredInput]);

  const [pool1, setPool1] = useState<HanjaRecord[]>([]);
  const [pool2, setPool2] = useState<HanjaRecord[]>([]);
  const [curPool1, setCurPool1] = useState<HanjaRecord[]>([]);
  const [curPool2, setCurPool2] = useState<HanjaRecord[]>([]);
  const [showCurrentPicker, setShowCurrentPicker] = useState(false);

  const defaultSurnameStrokes = surnameProfile
    ? strokeMethod === 'wonhoek_kangxi'
      ? surnameProfile.wonhoekStrokes
      : surnameProfile.technicalTotalStrokes
    : null;
  const surnameSoundElLabel = surnameProfile?.soundElement || '초성오행';

  const toggleElement = (el: FiveElement) => {
    if (targetElements.includes(el)) {
      onChangeNamingConfig({ targetElements: targetElements.filter((e) => e !== el) });
    } else {
      onChangeNamingConfig({ targetElements: [...targetElements, el] });
    }
  };

  // Load Hanja choices for current name editing
  useEffect(() => {
    if (!showCurrentPicker) return;
    if (currentHangul1.trim()) {
      fetch(`/api/hanja/search?reading=${encodeURIComponent(currentHangul1.trim())}&limit=40`)
        .then((r) => r.json())
        .then((d) => setCurPool1(d.items || []))
        .catch(() => setCurPool1([]));
    } else {
      setCurPool1([]);
    }
  }, [currentHangul1, showCurrentPicker]);

  useEffect(() => {
    if (!showCurrentPicker) return;
    if (currentHangul2.trim()) {
      fetch(`/api/hanja/search?reading=${encodeURIComponent(currentHangul2.trim())}&limit=40`)
        .then((r) => r.json())
        .then((d) => setCurPool2(d.items || []))
        .catch(() => setCurPool2([]));
    } else {
      setCurPool2([]);
    }
  }, [currentHangul2, showCurrentPicker]);

  // Load Hanja choices for manual composer
  useEffect(() => {
    if (studioMode !== 'manual') return;
    if (manHangul1.trim()) {
      fetch(`/api/hanja/search?reading=${encodeURIComponent(manHangul1.trim())}&limit=60`)
        .then((r) => r.json())
        .then((d) => setPool1(d.items || []))
        .catch(() => setPool1([]));
    } else {
      setPool1([]);
    }
  }, [manHangul1, studioMode]);

  useEffect(() => {
    if (studioMode !== 'manual') return;
    if (manHangul2.trim()) {
      fetch(`/api/hanja/search?reading=${encodeURIComponent(manHangul2.trim())}&limit=60`)
        .then((r) => r.json())
        .then((d) => setPool2(d.items || []))
        .catch(() => setPool2([]));
    } else {
      setPool2([]);
    }
  }, [manHangul2, studioMode]);

  // Fetch quick legal Hanja suggestions for recommendation slot 1 & slot 2
  useEffect(() => {
    const h = recHangul1.trim();
    if (!h) {
      setRecPool1([]);
      return;
    }
    fetch(`/api/hanja/search?reading=${encodeURIComponent(h)}&excludeTaboo=true&limit=24`)
      .then((r) => r.json())
      .then((d) => setRecPool1(d.items || []))
      .catch(() => setRecPool1([]));
  }, [recHangul1]);

  useEffect(() => {
    const h = recHangul2.trim();
    if (!h) {
      setRecPool2([]);
      return;
    }
    fetch(`/api/hanja/search?reading=${encodeURIComponent(h)}&excludeTaboo=true&limit=24`)
      .then((r) => r.json())
      .then((d) => setRecPool2(d.items || []))
      .catch(() => setRecPool2([]));
  }, [recHangul2]);

  const handleRecommend = async (override?: Partial<NameCandidateRequest>) => {
    setRecLoading(true);
    setRecError(null);
    try {
      const request: NameCandidateRequest = {
        surnameHangul,
        surnameHanja,
        hangul1: (override?.hangul1 !== undefined ? override.hangul1 : recHangul1).trim() || undefined,
        hangul2: (override?.hangul2 !== undefined ? override.hangul2 : recHangul2).trim() || undefined,
        fixedHanja1:
          (override?.fixedHanja1 !== undefined ? override.fixedHanja1 : recFixedHanja1).trim() ||
          undefined,
        fixedHanja2:
          (override?.fixedHanja2 !== undefined ? override.fixedHanja2 : recFixedHanja2).trim() ||
          undefined,
        preferredHangul:
          override?.preferredHangul !== undefined
            ? override.preferredHangul
            : parsedPreferences.hangul,
        preferredHanja:
          override?.preferredHanja !== undefined
            ? override.preferredHanja
            : parsedPreferences.hanja,
        targetElements,
        strokeMethod,
        surnameStrokeCount: surnameStrokeOverride,
        requireAllFourGood,
        requireSoundHarmony,
        maxStrokesPerChar,
        excludeTaboo,
        avoidSurnameRepetition,
        limit: 24,
      };
      const resp = await fetch('/api/naming/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, saju: sajuResult }),
      });
      const data = (await resp.json()) as NameRecommendResponse & { error?: string };
      if (!resp.ok) throw new Error(data.error || '추천 조회에 실패했습니다.');
      const items = (data.items || []) as NameEvaluation[];
      setRecommendations(items);
      setRelaxedNotice(data.relaxedNotice || null);
      setResolvedPatternLabel(data.resolvedPatternLabel || `${surnameHangul} X X`);
      if (items.length > 0) {
        onSelectCandidate(items[0]);
      }
    } catch (err) {
      setRecError(err instanceof Error ? err.message : '후보 추천 중 오류가 발생했습니다.');
    } finally {
      setRecLoading(false);
    }
  };

  // Run recommendation whenever surname changes or on initial mount
  useEffect(() => {
    void handleRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surnameHangul, surnameHanja]);

  const applyQuickPattern = (h1: string, c1: string, h2: string, c2: string) => {
    onChangeNamingConfig({
      recHangul1: h1,
      recFixedHanja1: c1,
      recHangul2: h2,
      recFixedHanja2: c2,
    });
    void handleRecommend({ hangul1: h1, fixedHanja1: c1, hangul2: h2, fixedHanja2: c2 });
  };

  const swapPatternSlots = () => {
    const nextH1 = recHangul2;
    const nextC1 = recFixedHanja2;
    const nextH2 = recHangul1;
    const nextC2 = recFixedHanja1;
    onChangeNamingConfig({
      recHangul1: nextH1,
      recFixedHanja1: nextC1,
      recHangul2: nextH2,
      recFixedHanja2: nextC2,
    });
    void handleRecommend({
      hangul1: nextH1,
      fixedHanja1: nextC1,
      hangul2: nextH2,
      fixedHanja2: nextC2,
    });
  };

  const addPreferredToken = (token: string) => {
    const clean = token.trim();
    if (!clean) return;
    if (preferredInput.includes(clean)) return;
    onChangeNamingConfig({
      preferredInput: preferredInput.trim() ? `${preferredInput.trim()}, ${clean}` : clean,
    });
  };

  const removePreferredToken = (token: string) => {
    const remaining = [...parsedPreferences.hangul, ...parsedPreferences.hanja].filter(
      (t) => t !== token
    );
    onChangeNamingConfig({ preferredInput: remaining.join(', ') });
  };

  const handleEvaluateManual = async (scrollOnMobile = false) => {
    try {
      const resp = await fetch('/api/naming/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surnameHangul,
          surnameHanja,
          surnameStrokeOverride,
          strokeMethod,
          hangul1: manHangul1.trim(),
          hanja1: manHanja1.trim(),
          hangul2: manHangul2.trim(),
          hanja2: manHanja2.trim(),
          saju: sajuResult,
        }),
      });
      const data = (await resp.json()) as NameEvaluation;
      if (resp.ok) {
        onSelectCandidate(data);
        if (scrollOnMobile && typeof window !== 'undefined' && window.innerWidth < 1024) {
          inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch {
      // ignore transient error
    }
  };

  // Auto-evaluate in manual composition mode whenever any character or rule changes
  useEffect(() => {
    if (studioMode !== 'manual') return;
    if (!manHangul1.trim() && !manHangul2.trim()) return;
    const timer = setTimeout(() => {
      void handleEvaluateManual(false);
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    studioMode,
    surnameHangul,
    surnameHanja,
    manHangul1,
    manHanja1,
    manHangul2,
    manHanja2,
    strokeMethod,
    surnameStrokeOverride,
    sajuResult,
  ]);

  const handlePickCandidate = (item: NameEvaluation) => {
    onSelectCandidate(item);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isSaved = (ev: NameEvaluation) =>
    savedCandidates.some(
      (c) => c.fullHangul === ev.fullHangul && c.fullHanja === ev.fullHanja
    );

  const semanticNoticesForCandidate = useMemo(() => {
    if (!selectedCandidate) return [];
    return selectedCandidate.characters
      .filter((c) => c.role !== 'surname' && (c.readingSenses?.length || c.semanticNotice || c.editorialMeaningGloss))
      .map((c) => c);
  }, [selectedCandidate]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Bar: Existing Name (Before Renaming / Optional Reference) & Method Selector */}
      <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-[#78716C]">
              {appMode === 'naming'
                ? '비교 기준 이름 입력 (선택 · 가족 이름이나 비교하고 싶은 이름)'
                : '내 현재 이름 (개명 전 비교 기준점)'}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-serif-kr text-xl font-semibold text-[#1C1917]">
                {currentHangul1 || currentHangul2
                  ? `${currentEval?.fullHangul || `${surnameHangul}${currentHangul1}${currentHangul2}`} (${currentEval?.fullHanja || `${surnameHanja}${currentHanja1}${currentHanja2}`})`
                  : `${surnameHangul}(${surnameHanja}) · 비교 이름 미입력`}
              </span>
              {currentEval && currentEval.numerology.available && (
                <span className="text-xs text-[#57534E] font-mono tabular-nums">
                  4격 길수 {currentEval.numerology.goodCount}/4 · 음양{' '}
                  {currentEval.yinYangPattern.labels} · 발음{' '}
                  {currentEval.pronunciationElements.harmonyLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-[#57534E] shrink-0">획수 기준:</span>
              <select
                value={strokeMethod}
                onChange={(e) => onChangeStrokeMethod(e.target.value as StrokeMethodId)}
                className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
              >
                <option value="wonhoek_kangxi">전통 원획법 (강희자전 부수 보정)</option>
                <option value="unihan_technical">기술 총획 (Unihan 참고)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#57534E] shrink-0">{surnameHanja} 획수:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={surnameStrokeOverride ?? defaultSurnameStrokes ?? ''}
                placeholder="자동"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeSurnameStrokeOverride(val > 0 ? val : null);
                }}
                className="w-16 min-h-[44px] sm:min-h-[36px] px-2 py-1 text-base sm:text-xs font-mono tabular-nums border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                title={`성명학 학파별 ${surnameHanja} 획수 기준 지정`}
              />
              {surnameStrokeOverride !== null && (
                <button
                  type="button"
                  onClick={() => onChangeSurnameStrokeOverride(null)}
                  className="min-h-[44px] sm:min-h-[32px] px-2 text-xs text-[#78716C] hover:text-[#9A3412] cursor-pointer"
                  title="자동 획수 기준으로 되돌리기"
                >
                  자동
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCurrentPicker((v) => !v)}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              {showCurrentPicker
                ? '이름 편집 닫기'
                : appMode === 'naming'
                ? '비교 이름 입력'
                : '기존 이름 변경'}
            </button>
          </div>
        </div>

        {showCurrentPicker && (
          <div className="mt-4 pt-4 border-t border-[#E7E2D8] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#1C1917]">
                  기존 이름 첫째 글자 (음 · 한자)
                </label>
                <button
                  type="button"
                  onClick={() => setPickerModal({ open: true, mode: 'current1' })}
                  className="min-h-[36px] px-1 text-xs text-[#9A3412] hover:underline cursor-pointer"
                >
                  한자 넓게 찾아 고르기 →
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={1}
                    value={currentHangul1}
                    onChange={(e) =>
                      onChangeCurrentName(e.target.value, currentHanja1, currentHangul2, currentHanja2)
                    }
                    className="w-16 min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                    placeholder="음"
                  />
                  <input
                    type="text"
                    maxLength={1}
                    value={currentHanja1}
                    onChange={(e) =>
                      onChangeCurrentName(currentHangul1, e.target.value, currentHangul2, currentHanja2)
                    }
                    className="w-16 min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                    placeholder="한자"
                  />
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {curPool1.slice(0, 12).map((item) => (
                    <button
                      key={item.hanja}
                      type="button"
                      onClick={() =>
                        onChangeCurrentName(currentHangul1, item.hanja, currentHangul2, currentHanja2)
                      }
                      className={`min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-xs border rounded-sm cursor-pointer ${
                        currentHanja1 === item.hanja
                          ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412]'
                          : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6]'
                      }`}
                    >
                      {item.hanja} ({item.primaryMeaning.split(',')[0] || item.legalReadings[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#1C1917]">
                  기존 이름 둘째 글자 (음 · 한자)
                </label>
                <button
                  type="button"
                  onClick={() => setPickerModal({ open: true, mode: 'current2' })}
                  className="min-h-[36px] px-1 text-xs text-[#9A3412] hover:underline cursor-pointer"
                >
                  한자 넓게 찾아 고르기 →
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={1}
                    value={currentHangul2}
                    onChange={(e) =>
                      onChangeCurrentName(currentHangul1, currentHanja1, e.target.value, currentHanja2)
                    }
                    className="w-16 min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                    placeholder="음"
                  />
                  <input
                    type="text"
                    maxLength={1}
                    value={currentHanja2}
                    onChange={(e) =>
                      onChangeCurrentName(currentHangul1, currentHanja1, currentHangul2, e.target.value)
                    }
                    className="w-16 min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                    placeholder="한자"
                  />
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {curPool2.slice(0, 12).map((item) => (
                    <button
                      key={item.hanja}
                      type="button"
                      onClick={() =>
                        onChangeCurrentName(currentHangul1, currentHanja1, currentHangul2, item.hanja)
                      }
                      className={`min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-xs border rounded-sm cursor-pointer ${
                        currentHanja2 === item.hanja
                          ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412]'
                          : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6]'
                      }`}
                    >
                      {item.hanja} ({item.primaryMeaning.split(',')[0] || item.legalReadings[0]})
                    </button>
                  ))}
                </div>
              </div>
              {(currentHangul1 || currentHangul2 || currentHanja1 || currentHanja2) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onChangeCurrentName('', '', '', '')}
                    className="min-h-[36px] px-2 text-xs text-[#78716C] hover:text-[#9A3412] cursor-pointer"
                  >
                    입력된 비교 이름 비우기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Main Studio Grid: Left Controls + Candidate List (5 cols), Right Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: Mode Switch, Filters, and Candidate List */}
        <div ref={listTopRef} className="lg:col-span-5 space-y-4">
          <div className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-5 space-y-4">
            {/* Mode Switch */}
            <div className="flex items-center gap-1 p-1 bg-[#F4EFE6] rounded-md border border-[#E7E2D8]">
              <button
                type="button"
                onClick={() => onChangeNamingConfig({ studioMode: 'recommend' })}
                className={`flex-1 min-h-[44px] sm:min-h-[36px] py-1.5 px-3 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                  studioMode === 'recommend'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {appMode === 'naming' ? '맞춤 작명 추천' : '맞춤 개명 추천'}
              </button>
              <button
                type="button"
                onClick={() => onChangeNamingConfig({ studioMode: 'manual' })}
                className={`flex-1 min-h-[44px] sm:min-h-[36px] py-1.5 px-3 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                  studioMode === 'manual'
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                직접 한자 조합
              </button>
            </div>

            {studioMode === 'recommend' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[#1C1917]">
                      보완 희망 자원오행 (사주 용신 기준)
                    </span>
                    {sajuResult && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeNamingConfig({
                            targetElements: sajuResult.eokbuYongsinCandidates,
                          })
                        }
                        className="min-h-[36px] px-1.5 text-xs text-[#9A3412] hover:underline cursor-pointer shrink-0"
                      >
                        용신({sajuResult.eokbuYongsinCandidates.join('·')}) 적용
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ALL_ELEMENTS.map((el) => {
                      const active = targetElements.includes(el);
                      return (
                        <button
                          key={el}
                          type="button"
                          onClick={() => toggleElement(el)}
                          className={`min-h-[44px] sm:min-h-[34px] px-2 py-1 text-xs font-medium border rounded-sm transition-colors cursor-pointer ${
                            active
                              ? 'border-[#1C1917] bg-[#1C1917] text-white'
                              : 'border-[#D6CEBE] bg-[#FBF9F5] text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          {el}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Name Slot Pattern Builder (성씨 X 우 / 성씨 윤 X / 한자 고정) */}
                <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-[#1C1917]">
                        희망 이름 틀 설정 ({surnameHangul} X 우 · 한자 고정)
                      </span>
                      <span className="block text-[11px] text-[#78716C] mt-0.5">
                        비워두면(X) 자동 탐색, 입력하면 해당 자리에 고정됩니다.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={swapPatternSlots}
                        title="첫째 자리와 둘째 자리 바꾸기"
                        className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-[11px] border border-[#D6CEBE] bg-white hover:bg-[#F4EFE6] text-[#57534E] rounded-sm cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        앞↔뒤
                      </button>
                      {(recHangul1 || recHangul2 || recFixedHanja1 || recFixedHanja2) && (
                        <button
                          type="button"
                          onClick={() => applyQuickPattern('', '', '', '')}
                          title="이름 틀 초기화"
                          className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-[11px] border border-[#D6CEBE] bg-white hover:bg-[#F4EFE6] text-[#57534E] rounded-sm cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          초기화
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-slot visual template: Stacked cleanly on mobile, 11-col inline on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 sm:gap-1.5 items-stretch">
                    {/* Surname Fixed */}
                    <button
                      type="button"
                      onClick={onOpenSurnamePicker}
                      title="클릭하여 성씨 변경"
                      className="sm:col-span-3 min-h-[56px] p-2.5 sm:p-2 bg-[#F4EFE6] hover:bg-[#EAE3D5] border border-[#E7E2D8] rounded-sm flex sm:flex-col items-center justify-between sm:justify-center text-center cursor-pointer transition-colors"
                    >
                      <span className="text-[11px] text-[#9A3412] underline underline-offset-2 order-2 sm:order-1">
                        성씨 변경
                      </span>
                      <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-center sm:gap-0 order-1 sm:order-2">
                        <span className="font-serif-kr text-lg sm:text-base font-bold text-[#1C1917] leading-tight">
                          {surnameHangul}
                        </span>
                        <span className="font-serif-kr text-sm sm:text-xs text-[#57534E]">
                          {surnameHanja}
                        </span>
                      </div>
                    </button>

                    {/* Slot 1 */}
                    <div className="sm:col-span-4 p-2.5 sm:p-2 bg-white border border-[#D6CEBE] rounded-sm space-y-2 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[10px] font-medium text-[#57534E]">
                          첫째 글자
                        </span>
                        {(recHangul1 || recFixedHanja1) && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeNamingConfig({ recHangul1: '', recFixedHanja1: '' })
                            }
                            className="p-1 text-[#78716C] hover:text-[#9A3412] cursor-pointer"
                            aria-label="첫째 글자 비우기"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1.5 sm:gap-1">
                        <input
                          type="text"
                          maxLength={1}
                          value={recHangul1}
                          onChange={(e) =>
                            onChangeNamingConfig({
                              recHangul1: e.target.value,
                              recFixedHanja1: '',
                            })
                          }
                          placeholder="X"
                          className="w-1/2 min-h-[44px] sm:min-h-[32px] px-1.5 py-1 text-base sm:text-xs font-semibold text-center border border-[#E7E2D8] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                        />
                        <input
                          type="text"
                          maxLength={1}
                          value={recFixedHanja1}
                          onChange={(e) =>
                            onChangeNamingConfig({ recFixedHanja1: e.target.value })
                          }
                          placeholder="한자"
                          className="w-1/2 min-h-[44px] sm:min-h-[32px] px-1.5 py-1 text-base sm:text-xs font-serif-kr text-center border border-[#E7E2D8] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerModal({ open: true, mode: 'slot1' })}
                        className="w-full min-h-[40px] sm:min-h-[28px] py-1 text-xs sm:text-[11px] font-medium text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#9A3412]/30 rounded-sm cursor-pointer transition-colors"
                      >
                        한자 고르기
                      </button>
                    </div>

                    {/* Slot 2 */}
                    <div className="sm:col-span-4 p-2.5 sm:p-2 bg-white border border-[#D6CEBE] rounded-sm space-y-2 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[10px] font-medium text-[#57534E]">
                          둘째 글자
                        </span>
                        {(recHangul2 || recFixedHanja2) && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeNamingConfig({ recHangul2: '', recFixedHanja2: '' })
                            }
                            className="p-1 text-[#78716C] hover:text-[#9A3412] cursor-pointer"
                            aria-label="둘째 글자 비우기"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1.5 sm:gap-1">
                        <input
                          type="text"
                          maxLength={1}
                          value={recHangul2}
                          onChange={(e) =>
                            onChangeNamingConfig({
                              recHangul2: e.target.value,
                              recFixedHanja2: '',
                            })
                          }
                          placeholder="X"
                          className="w-1/2 min-h-[44px] sm:min-h-[32px] px-1.5 py-1 text-base sm:text-xs font-semibold text-center border border-[#E7E2D8] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                        />
                        <input
                          type="text"
                          maxLength={1}
                          value={recFixedHanja2}
                          onChange={(e) =>
                            onChangeNamingConfig({ recFixedHanja2: e.target.value })
                          }
                          placeholder="한자"
                          className="w-1/2 min-h-[44px] sm:min-h-[32px] px-1.5 py-1 text-base sm:text-xs font-serif-kr text-center border border-[#E7E2D8] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerModal({ open: true, mode: 'slot2' })}
                        className="w-full min-h-[40px] sm:min-h-[28px] py-1 text-xs sm:text-[11px] font-medium text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#9A3412]/30 rounded-sm cursor-pointer transition-colors"
                      >
                        한자 고르기
                      </button>
                    </div>
                  </div>

                  {/* Quick legal Hanja chips when user specifies Hangul in slot 1 or slot 2 */}
                  {recHangul1.trim() && recPool1.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-[#57534E]">
                        첫째 &apos;{recHangul1}&apos; 한자 선택 (비우면 자동 조합):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => onChangeNamingConfig({ recFixedHanja1: '' })}
                          className={`min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-[11px] border rounded-sm cursor-pointer ${
                            recFixedHanja1 === ''
                              ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                              : 'border-[#E7E2D8] bg-white text-[#57534E]'
                          }`}
                        >
                          전체 한자
                        </button>
                        {recPool1.slice(0, 14).map((item) => (
                          <button
                            key={`p1-${item.hanja}`}
                            type="button"
                            onClick={() => onChangeNamingConfig({ recFixedHanja1: item.hanja })}
                            className={`min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-[11px] border rounded-sm cursor-pointer ${
                              recFixedHanja1 === item.hanja
                                ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                                : 'border-[#E7E2D8] bg-white text-[#1C1917] hover:bg-[#F4EFE6]'
                            }`}
                          >
                            <span className="font-serif-kr">{item.hanja}</span>{' '}
                            <span className="text-[#78716C]">
                              (
                              {item.primaryMeaning.split(',')[0].split(' ')[0] ||
                                `${item.wonhoekStrokes}획`}
                              )
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recHangul2.trim() && recPool2.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-[#57534E]">
                        둘째 &apos;{recHangul2}&apos; 한자 선택 (비우면 자동 조합):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => onChangeNamingConfig({ recFixedHanja2: '' })}
                          className={`min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-[11px] border rounded-sm cursor-pointer ${
                            recFixedHanja2 === ''
                              ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                              : 'border-[#E7E2D8] bg-white text-[#57534E]'
                          }`}
                        >
                          전체 한자
                        </button>
                        {recPool2.slice(0, 14).map((item) => (
                          <button
                            key={`p2-${item.hanja}`}
                            type="button"
                            onClick={() => onChangeNamingConfig({ recFixedHanja2: item.hanja })}
                            className={`min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-[11px] border rounded-sm cursor-pointer ${
                              recFixedHanja2 === item.hanja
                                ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                                : 'border-[#E7E2D8] bg-white text-[#1C1917] hover:bg-[#F4EFE6]'
                            }`}
                          >
                            <span className="font-serif-kr">{item.hanja}</span>{' '}
                            <span className="text-[#78716C]">
                              (
                              {item.primaryMeaning.split(',')[0].split(' ')[0] ||
                                `${item.wonhoekStrokes}획`}
                              )
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Pattern Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[#78716C] mr-0.5">빠른 틀:</span>
                    {[
                      { label: `${surnameHangul}XX (전체)`, h1: '', h2: '' },
                      { label: `${surnameHangul}X우`, h1: '', h2: '우' },
                      { label: `${surnameHangul}우X`, h1: '우', h2: '' },
                      { label: `${surnameHangul}X윤`, h1: '', h2: '윤' },
                      { label: `${surnameHangul}지X`, h1: '지', h2: '' },
                    ].map((preset) => {
                      const active =
                        recHangul1 === preset.h1 &&
                        recHangul2 === preset.h2 &&
                        !recFixedHanja1 &&
                        !recFixedHanja2;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyQuickPattern(preset.h1, '', preset.h2, '')}
                          className={`min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 border rounded-sm cursor-pointer transition-colors ${
                            active
                              ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                              : 'border-[#E7E2D8] bg-white text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Position-independent Preferred Hangul & Hanja Input */}
                <div className="p-3 sm:p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[#1C1917]">
                      최대한 넣고 싶은 한글 · 한자 (자리 무관)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPickerModal({ open: true, mode: 'preferred' })}
                      className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-xs sm:text-[11px] font-medium text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#9A3412]/30 rounded-sm cursor-pointer"
                    >
                      <Search className="w-3 h-3" />
                      한자 찾아서 담기
                    </button>
                  </div>
                  <input
                    type="text"
                    value={preferredInput}
                    onChange={(e) => onChangeNamingConfig({ preferredInput: e.target.value })}
                    placeholder="예: 우, 宇, 윤 (앞·뒤 어디든 최대한 포함해 추천)"
                    className="w-full min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-white focus:outline-none focus:border-[#9A3412]"
                  />

                  {(parsedPreferences.hangul.length > 0 || parsedPreferences.hanja.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {parsedPreferences.hangul.map((h) => (
                        <button
                          key={`ph-${h}`}
                          type="button"
                          onClick={() => removePreferredToken(h)}
                          className="inline-flex items-center gap-1 min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-xs border border-[#D6CEBE] bg-white text-[#1C1917] rounded-sm cursor-pointer hover:bg-[#FEF2F2]"
                        >
                          한글 <strong>{h}</strong>
                          <X className="w-3 h-3 text-[#78716C]" />
                        </button>
                      ))}
                      {parsedPreferences.hanja.map((c) => (
                        <button
                          key={`pc-${c}`}
                          type="button"
                          onClick={() => removePreferredToken(c)}
                          className="inline-flex items-center gap-1 min-h-[34px] sm:min-h-[26px] px-2.5 py-0.5 text-xs border border-[#9A3412]/40 bg-[#FFF7ED] text-[#9A3412] rounded-sm cursor-pointer"
                        >
                          한자 <strong className="font-serif-kr">{c}</strong>
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Criteria checkboxes */}
                <div className="space-y-1 text-xs text-[#1C1917]">
                  <label className="flex items-center gap-2.5 min-h-[40px] sm:min-h-[28px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAllFourGood}
                      onChange={(e) =>
                        onChangeNamingConfig({ requireAllFourGood: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#9A3412]"
                    />
                    원·형·이·정 4격 81수리 모두 길수(대길/길)
                  </label>
                  <label className="flex items-center gap-2.5 min-h-[40px] sm:min-h-[28px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireSoundHarmony}
                      onChange={(e) =>
                        onChangeNamingConfig({ requireSoundHarmony: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#9A3412]"
                    />
                    {surnameHangul}({surnameSoundElLabel}) 성씨와 발음오행 상생·비화만 보기
                  </label>
                  <label className="flex items-center gap-2.5 min-h-[40px] sm:min-h-[28px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeTaboo}
                      onChange={(e) =>
                        onChangeNamingConfig({ excludeTaboo: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#9A3412]"
                    />
                    전통 불용참고 한자 제외
                  </label>
                  <label className="flex items-center gap-2.5 min-h-[40px] sm:min-h-[28px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoidSurnameRepetition}
                      onChange={(e) =>
                        onChangeNamingConfig({ avoidSurnameRepetition: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#9A3412]"
                    />
                    &apos;{surnameHangul}+{surnameHangul}○&apos; 동일 음절 반복 회피
                  </label>
                </div>

                <label className="block text-xs">
                  <div className="flex justify-between text-[#57534E] mb-1.5">
                    <span>글자당 최대 획수 (쓰기 편의)</span>
                    <span className="font-mono tabular-nums text-[#1C1917] font-medium">
                      {maxStrokesPerChar}획 이하
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={26}
                    value={maxStrokesPerChar}
                    onChange={(e) =>
                      onChangeNamingConfig({ maxStrokesPerChar: Number(e.target.value) })
                    }
                    className="w-full h-7 accent-[#9A3412]"
                  />
                </label>

                {recError && (
                  <div className="p-2.5 text-xs text-[#9A3412] bg-[#FEF2F2] border border-[#FECACA] rounded-sm">
                    {recError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleRecommend()}
                  disabled={recLoading}
                  className="w-full min-h-[48px] py-2.5 px-4 text-sm font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-60 rounded-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {recLoading
                    ? '9,460자 인명용 DB 탐색 중...'
                    : appMode === 'naming'
                    ? '설정한 조건으로 새 이름 추천받기'
                    : '설정한 조건으로 개명 후보 추천받기'}
                </button>
              </div>
            ) : (
              /* Manual Hanja Composition Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#1C1917]">
                        이름 첫째 글자
                      </label>
                      <button
                        type="button"
                        onClick={() => setPickerModal({ open: true, mode: 'manual1' })}
                        className="min-h-[36px] px-1 text-xs font-medium text-[#9A3412] hover:underline cursor-pointer"
                      >
                        넓게 찾아 고르기 →
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={1}
                        value={manHangul1}
                        onChange={(e) => onChangeNamingConfig({ manHangul1: e.target.value })}
                        className="w-16 min-h-[44px] sm:min-h-[36px] px-2 py-1.5 text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                        placeholder="음"
                      />
                      <input
                        type="text"
                        maxLength={1}
                        value={manHanja1}
                        onChange={(e) => onChangeNamingConfig({ manHanja1: e.target.value })}
                        className="w-16 min-h-[44px] sm:min-h-[36px] px-2 py-1.5 text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                        placeholder="한자"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-[#E7E2D8] rounded-sm divide-y divide-[#E7E2D8] bg-[#FBF9F5]">
                      {pool1.length === 0 ? (
                        <div className="p-3 text-xs text-[#78716C]">
                          독음에 해당하는 인명용 한자 없음
                        </div>
                      ) : (
                        pool1.map((item) => (
                          <button
                            key={item.hanja}
                            type="button"
                            onClick={() => onChangeNamingConfig({ manHanja1: item.hanja })}
                            className={`w-full text-left px-3 py-2.5 min-h-[44px] text-xs space-y-0.5 cursor-pointer ${
                              manHanja1 === item.hanja ? 'bg-[#FFF7ED] text-[#9A3412]' : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                <strong className="font-serif-kr text-base mr-1.5">
                                  {item.hanja}
                                </strong>
                                {item.isPopularNaming && (
                                  <span className="text-[11px] font-medium text-[#14532D]">
                                    · 선호
                                  </span>
                                )}
                              </span>
                              <span className="font-mono tabular-nums text-[11px] text-[#78716C] shrink-0">
                                {item.wonhoekStrokes}획 · {item.resourceElement || '?'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#57534E] leading-snug">
                              {item.primaryMeaning || '훈음미매칭'}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#1C1917]">
                        이름 둘째 글자
                      </label>
                      <button
                        type="button"
                        onClick={() => setPickerModal({ open: true, mode: 'manual2' })}
                        className="min-h-[36px] px-1 text-xs font-medium text-[#9A3412] hover:underline cursor-pointer"
                      >
                        넓게 찾아 고르기 →
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={1}
                        value={manHangul2}
                        onChange={(e) => onChangeNamingConfig({ manHangul2: e.target.value })}
                        className="w-16 min-h-[44px] sm:min-h-[36px] px-2 py-1.5 text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                        placeholder="음"
                      />
                      <input
                        type="text"
                        maxLength={1}
                        value={manHanja2}
                        onChange={(e) => onChangeNamingConfig({ manHanja2: e.target.value })}
                        className="w-16 min-h-[44px] sm:min-h-[36px] px-2 py-1.5 text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] text-center"
                        placeholder="한자"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto border border-[#E7E2D8] rounded-sm divide-y divide-[#E7E2D8] bg-[#FBF9F5]">
                      {pool2.length === 0 ? (
                        <div className="p-3 text-xs text-[#78716C]">
                          독음에 해당하는 인명용 한자 없음
                        </div>
                      ) : (
                        pool2.map((item) => (
                          <button
                            key={item.hanja}
                            type="button"
                            onClick={() => onChangeNamingConfig({ manHanja2: item.hanja })}
                            className={`w-full text-left px-3 py-2.5 min-h-[44px] text-xs space-y-0.5 cursor-pointer ${
                              manHanja2 === item.hanja ? 'bg-[#FFF7ED] text-[#9A3412]' : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                <strong className="font-serif-kr text-base mr-1.5">
                                  {item.hanja}
                                </strong>
                                {item.isPopularNaming && (
                                  <span className="text-[11px] font-medium text-[#14532D]">
                                    · 선호
                                  </span>
                                )}
                              </span>
                              <span className="font-mono tabular-nums text-[11px] text-[#78716C] shrink-0">
                                {item.wonhoekStrokes}획 · {item.resourceElement || '?'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#57534E] leading-snug">
                              {item.primaryMeaning || '훈음미매칭'}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleEvaluateManual(true)}
                  className="w-full min-h-[48px] py-2.5 px-4 text-sm font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  이 조합 성명학 감정하기
                </button>
              </div>
            )}
          </div>

          {/* Candidate Results List (when in recommend mode) */}
          {studioMode === 'recommend' && (
            <div className="border border-[#E7E2D8] bg-white rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E7E2D8] flex flex-wrap items-center justify-between gap-2 bg-[#FBF9F5]">
                <span className="text-xs font-semibold text-[#1C1917]">
                  {appMode === 'naming' ? '추천 작명 후보' : '추천 개명 후보'} ({recommendations.length}
                  건 · <span className="text-[#9A3412]">{resolvedPatternLabel}</span>)
                </span>
                <span className="text-[11px] text-[#78716C]">눌러서 상세 보기</span>
              </div>

              {relaxedNotice && (
                <div className="px-4 py-2.5 bg-[#FEFCE8] border-b border-[#FDE68A] text-[11px] text-[#78350F] leading-relaxed">
                  {relaxedNotice}
                </div>
              )}

              {recommendations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#78716C] space-y-2">
                  <p>현재 조건에 맞는 후보가 없습니다.</p>
                  <p>최대 획수를 늘리거나 &apos;4격 모두 길수&apos; 조건을 완화해 다시 탐색해 보세요.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E2D8] max-h-[540px] overflow-y-auto">
                  {recommendations.map((item) => {
                    const active =
                      selectedCandidate?.fullHanja === item.fullHanja &&
                      selectedCandidate?.fullHangul === item.fullHangul;
                    const matchedPrefs = [
                      ...parsedPreferences.hangul.filter(
                        (h) =>
                          item.characters[1]?.hangul === h || item.characters[2]?.hangul === h
                      ),
                      ...parsedPreferences.hanja.filter(
                        (c) =>
                          item.characters[1]?.hanja === c || item.characters[2]?.hanja === c
                      ),
                    ];
                    const hasCaution = item.characters.some(
                      (c) => c.role !== 'surname' && Boolean(c.semanticNotice)
                    );
                    return (
                      <button
                        key={`${item.fullHangul}-${item.fullHanja}`}
                        type="button"
                        onClick={() => handlePickCandidate(item)}
                        className={`w-full text-left px-4 py-3.5 min-h-[60px] transition-colors cursor-pointer space-y-1.5 ${
                          active ? 'bg-[#FFF7ED]' : 'hover:bg-[#FBF9F5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex items-baseline gap-2">
                            <span className="font-serif-kr text-base font-semibold text-[#1C1917]">
                              {item.fullHangul}
                            </span>
                            <span className="font-serif-kr text-sm text-[#57534E]">
                              {item.fullHanja}
                            </span>
                            <span className="text-[11px] font-mono text-[#78716C] truncate">
                              {item.romanized}
                            </span>
                          </div>
                          <span className="text-xs font-mono tabular-nums text-[#14532D] font-medium shrink-0">
                            4격 {item.numerology.goodCount}/4길
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                          <span className="truncate">
                            {matchedPrefs.length > 0 && (
                              <span className="text-[#9A3412] font-medium mr-1.5">
                                희망포함({matchedPrefs.join('·')})
                              </span>
                            )}
                            {hasCaution && (
                              <span className="text-[#9A3412] mr-1">· 뜻 확인</span>
                            )}
                            {item.characters[1]?.meaning.split(',')[0]} ·{' '}
                            {item.characters[2]?.meaning.split(',')[0]}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-[#78716C] shrink-0">
                            {item.numerology.grids
                              .map((g) => `${g.name.charAt(0)}${g.reduced81}`)
                              .join('·')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Evaluation & Interactive Stroke Order (7 cols) */}
        <div
          id="candidate-inspector"
          ref={inspectorRef}
          className="lg:col-span-7 border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 scroll-mt-4"
        >
          {!selectedCandidate ? (
            <div className="py-16 sm:py-20 text-center text-sm text-[#78716C]">
              후보 이름을 선택하거나 직접 한자를 조합해 주세요.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mobile Quick Back to List */}
              <div className="lg:hidden flex items-center justify-between pb-2 border-b border-[#E7E2D8]">
                <span className="text-[11px] font-medium text-[#78716C]">
                  선택한 이름 상세 풀이
                </span>
                <button
                  type="button"
                  onClick={() => listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="inline-flex items-center gap-1 min-h-[36px] px-2.5 text-xs font-medium text-[#9A3412] border border-[#E7E2D8] bg-[#FBF9F5] rounded-sm cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  조건 · 후보 목록
                </button>
              </div>

              {/* Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#E7E2D8] pb-4">
                <div>
                  <div className="text-xs text-[#78716C]">
                    {selectedCandidate.romanized} · {selectedCandidate.usability.legalStatusLabel}
                  </div>
                  <h3 className="font-serif-kr text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">
                    {selectedCandidate.fullHangul}{' '}
                    <span className="font-normal text-[#57534E]">{selectedCandidate.fullHanja}</span>
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleSaveCandidate(selectedCandidate)}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-medium border rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                      isSaved(selectedCandidate)
                        ? 'border-[#14532D] bg-[#ECFDF5] text-[#14532D]'
                        : 'border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917]'
                    }`}
                  >
                    {isSaved(selectedCandidate) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        보관함 저장됨
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        보관함에 담기
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenComparison(selectedCandidate)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    {appMode === 'naming' ? '비교 리포트 보기' : '기존 이름과 비교 리포트'}
                  </button>
                </div>
              </div>

              {/* Plain-Korean Easy Name Explanation */}
              <div className="p-4 bg-[#FFF7ED]/60 border border-[#E7E2D8] rounded-sm space-y-1.5">
                <div className="text-xs font-semibold text-[#9A3412]">
                  한눈에 읽는 쉬운 이름 풀이
                </div>
                <ul className="space-y-1.5 text-xs text-[#1C1917] leading-relaxed list-disc list-inside">
                  {buildPlainNameSummary(selectedCandidate, currentEval, sajuResult).map(
                    (line, idx) => (
                      <li key={idx}>{line}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Multi-Sense Semantic Inspector (per-reading sense breakdown + caution notice) */}
              {semanticNoticesForCandidate.length > 0 && (
                <div className="p-4 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#1C1917]">
                      한자 다중 의미 · 음(音) 기준 작명 뜻풀이
                    </h4>
                    <span className="text-[11px] text-[#78716C]">
                      대표 긍정 뜻과 참고용 다중 의미를 구분해 표시합니다
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {semanticNoticesForCandidate.map((char) => (
                      <div
                        key={`sem-${char.role}-${char.hanja}`}
                        className="p-3 bg-white border border-[#E7E2D8] rounded-sm space-y-1.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif-kr text-sm font-semibold text-[#1C1917]">
                            {char.hanja} ({char.hangul})
                          </span>
                          {char.editorialMeaningGloss && (
                            <span className="text-[11px] text-[#14532D] font-medium">
                              권장 뜻: {char.editorialMeaningGloss}
                            </span>
                          )}
                        </div>
                        {char.readingSenses && char.readingSenses.length > 0 && (
                          <div className="text-[11px] text-[#57534E] leading-relaxed space-y-0.5">
                            {char.readingSenses.map((sense) => (
                              <div key={sense.senseId} className="flex items-start gap-1.5">
                                <span className="font-mono text-[10px] text-[#78716C] shrink-0 mt-0.5">
                                  #{sense.senseOrder}
                                </span>
                                <span
                                  className={
                                    sense.concernLevel && sense.concernLevel !== 'none'
                                      ? 'text-[#9A3412] font-medium'
                                      : ''
                                  }
                                >
                                  {sense.rawSense}
                                  {sense.concernNote ? ` (${sense.concernNote})` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {char.semanticNotice && (
                          <div className="pt-1 flex items-start gap-1.5 text-[11px] text-[#9A3412] leading-snug">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{char.semanticNotice}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before -> After Quick Delta Banner */}
              {currentEval && (
                <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[11px] text-[#78716C]">4격 길수 변화</div>
                    <div className="font-mono tabular-nums font-semibold text-[#1C1917] mt-0.5">
                      {currentEval.numerology.goodCount}/4 →{' '}
                      <span className="text-[#14532D]">{selectedCandidate.numerology.goodCount}/4</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">음양 조화</div>
                    <div className="font-medium text-[#1C1917] mt-0.5">
                      {currentEval.yinYangPattern.isBalanced ? '균형' : '편중'} →{' '}
                      <span
                        className={
                          selectedCandidate.yinYangPattern.isBalanced
                            ? 'text-[#14532D]'
                            : 'text-[#9A3412]'
                        }
                      >
                        {selectedCandidate.yinYangPattern.isBalanced ? '균형' : '편중'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">발음오행</div>
                    <div className="font-medium text-[#1C1917] mt-0.5">
                      {selectedCandidate.pronunciationElements.harmonyLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">용신 보완</div>
                    <div className="font-medium text-[#1C1917] mt-0.5">
                      {selectedCandidate.resourceAlignment.matchesYongsin
                        ? `${selectedCandidate.resourceAlignment.matchedElements.join('·')} 보충`
                        : '참고 범위'}
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Sound Five-Element Flow Diagram */}
              <div className="p-4 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs font-semibold text-[#1C1917]">
                    발음오행(소리 흐름) 한눈에 보기
                  </h4>
                  <span className="text-[11px] text-[#57534E]">
                    {selectedCandidate.pronunciationElements.harmonyLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedCandidate.characters
                    .filter((c) => c.hangul)
                    .map((char, idx, arr) => {
                      const rel = selectedCandidate.pronunciationElements.relations[idx];
                      return (
                        <div key={`flow-${idx}`} className="flex items-center gap-2">
                          <div className="px-2.5 py-1.5 bg-white border border-[#E7E2D8] rounded-sm flex items-center gap-1.5">
                            <span className="font-serif-kr font-semibold text-[#1C1917]">
                              {char.hangul}({char.hanja || '?'})
                            </span>
                            <ElementTag element={char.soundElement} />
                          </div>
                          {idx < arr.length - 1 && rel && (
                            <span
                              className={`text-[11px] font-medium px-1 py-0.5 ${
                                rel.relation === '상극' ? 'text-[#9A3412]' : 'text-[#14532D]'
                              }`}
                            >
                              ─ {rel.relation} →
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Interactive Stroke Order Cards for all 3 characters */}
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-[#1C1917]">
                    한자 획순(필순) · 부수 · 자원오행 상세
                  </h4>
                  <span className="text-[11px] text-[#78716C]">
                    &apos;획순 재생&apos; 또는 &apos;따라쓰기&apos;로 필순을 확인하세요
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedCandidate.characters
                    .filter((c) => c.hangul || c.hanja)
                    .map((char, idx) => (
                      <div key={`${char.role}-${idx}`} className="space-y-2">
                        <StrokeOrderCard
                          hanja={char.hanja}
                          hangul={char.hangul}
                          meaning={char.meaning}
                          wonhoekStrokes={char.wonhoekStrokes}
                          unihanStrokes={char.unihanStrokes}
                          wonhoekEstimated={char.wonhoekEstimated}
                          radicalNo={char.radicalNo}
                        />
                        <div className="flex items-center justify-between px-1 text-xs text-[#57534E]">
                          <span>
                            발음 <ElementTag element={char.soundElement} />
                          </span>
                          <span>
                            자원 <ElementTag element={char.resourceElement} />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 4-Grid 81 Numerology Lifecycle Strip + Mobile Cards / Desktop Table */}
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
                  <h4 className="text-sm font-semibold text-[#1C1917]">
                    원·형·이·정 4격 81수리 생애 주기별 풀이
                  </h4>
                  <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                    기준:{' '}
                    {selectedCandidate.strokeMethod === 'wonhoek_kangxi'
                      ? '전통 원획법'
                      : '기술 총획'}{' '}
                    ({selectedCandidate.characters[0]?.hanja}{' '}
                    {selectedCandidate.characters[0]?.strokesUsed}획)
                  </span>
                </div>

                {!selectedCandidate.numerology.available ? (
                  <div className="p-3.5 border border-[#FDE68A] bg-[#FEFCE8] text-xs text-[#78350F] rounded-sm">
                    {selectedCandidate.numerology.unavailableReason}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Visual 4-stage lifecycle summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedCandidate.numerology.grids.map((g) => (
                        <div
                          key={`arc-${g.key}`}
                          className="p-2.5 border border-[#E7E2D8] bg-[#FBF9F5] rounded-sm"
                        >
                          <div className="text-[11px] text-[#78716C]">{g.period}</div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-xs font-semibold text-[#1C1917]">
                              {g.name.split('(')[0]}
                            </span>
                            <LuckGradeText grade={g.grade} />
                          </div>
                          <div className="mt-1 font-mono tabular-nums text-xs text-[#57534E]">
                            {g.reduced81}수 · {g.title.split('(')[0]}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Stacked Detail Cards (< md) */}
                    <div className="md:hidden space-y-2">
                      {selectedCandidate.numerology.grids.map((g) => (
                        <div
                          key={`mob-${g.key}`}
                          className="p-3 border border-[#E7E2D8] bg-[#FBF9F5] rounded-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-[#1C1917]">
                              {g.name}{' '}
                              <span className="font-normal text-[#78716C]">({g.period})</span>
                            </div>
                            <LuckGradeText grade={g.grade} />
                          </div>
                          <div className="text-xs font-mono tabular-nums text-[#1C1917]">
                            {g.formula} = <strong>{g.reduced81}수</strong> ·{' '}
                            <span className="font-sans text-[#57534E]">{g.title}</span>
                          </div>
                          <p className="text-xs text-[#57534E] leading-relaxed">{g.summary}</p>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Numerology Table (md+) */}
                    <div className="hidden md:block border border-[#E7E2D8] rounded-sm overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FBF9F5] border-b border-[#E7E2D8] text-[#57534E]">
                          <tr>
                            <th className="py-2 px-3 font-medium">격(格)</th>
                            <th className="py-2 px-3 font-medium">수식 / 81수리</th>
                            <th className="py-2 px-3 font-medium">길흉</th>
                            <th className="py-2 px-3 font-medium">핵심 풀이</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7E2D8]">
                          {selectedCandidate.numerology.grids.map((g) => (
                            <tr key={g.key} className="hover:bg-[#FBF9F5]">
                              <td className="py-2.5 px-3 font-medium text-[#1C1917] whitespace-nowrap">
                                {g.name}
                                <span className="block text-[10px] font-normal text-[#78716C]">
                                  {g.period}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-[#1C1917] whitespace-nowrap">
                                {g.formula} = <strong>{g.reduced81}수</strong>
                                <span className="block text-[11px] font-sans text-[#57534E]">
                                  {g.title}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <LuckGradeText grade={g.grade} />
                              </td>
                              <td className="py-2.5 px-3 text-[#57534E] leading-relaxed">
                                {g.summary}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Yin-Yang, Sound Elements, Resource Elements & Usability Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1.5">
                  <div className="font-semibold text-[#1C1917]">
                    음양 조화 · {selectedCandidate.yinYangPattern.labels}
                  </div>
                  <p className="text-[#57534E] leading-relaxed">
                    {selectedCandidate.yinYangPattern.note}
                  </p>
                </div>

                <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1.5">
                  <div className="font-semibold text-[#1C1917]">
                    발음오행 · {selectedCandidate.pronunciationElements.harmonyLabel}
                  </div>
                  <p className="text-[#57534E] leading-relaxed">
                    {selectedCandidate.pronunciationElements.note}
                  </p>
                </div>

                <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1.5">
                  <div className="font-semibold text-[#1C1917]">자원오행 · 사주 보완</div>
                  <p className="text-[#57534E] leading-relaxed">
                    {selectedCandidate.resourceAlignment.note}
                  </p>
                </div>

                <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1.5">
                  <div className="font-semibold text-[#1C1917]">실사용성 및 성씨 경계</div>
                  <p className="text-[#57534E] leading-relaxed">
                    {selectedCandidate.usability.notes[0] ||
                      selectedCandidate.usability.boundaryAssimilationNote}
                  </p>
                  {selectedCandidate.usability.tabooWarnings.length > 0 && (
                    <p className="text-[#9A3412] font-medium">
                      참고: {selectedCandidate.usability.tabooWarnings.join(' / ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onOpenComparison(selectedCandidate)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[32px] px-2 text-xs font-medium text-[#9A3412] hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {appMode === 'naming'
                    ? '리포트에서 AI 정통 작명 해설 받아보기 →'
                    : '비교 리포트에서 AI 개명 심층 해설 받아보기 →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <HanjaPickerModal
        open={pickerModal.open}
        mode={pickerModal.mode}
        initialReading={
          pickerModal.mode === 'slot1'
            ? recHangul1.trim()
            : pickerModal.mode === 'slot2'
              ? recHangul2.trim()
              : pickerModal.mode === 'manual1'
                ? manHangul1.trim()
                : pickerModal.mode === 'manual2'
                  ? manHangul2.trim()
                  : pickerModal.mode === 'current1'
                    ? currentHangul1.trim()
                    : pickerModal.mode === 'current2'
                      ? currentHangul2.trim()
                      : ''
        }
        selectedHanja={
          pickerModal.mode === 'slot1'
            ? recFixedHanja1
            : pickerModal.mode === 'slot2'
              ? recFixedHanja2
              : pickerModal.mode === 'manual1'
                ? manHanja1
                : pickerModal.mode === 'manual2'
                  ? manHanja2
                  : pickerModal.mode === 'current1'
                    ? currentHanja1
                    : pickerModal.mode === 'current2'
                      ? currentHanja2
                      : ''
        }
        preferredHanjaList={parsedPreferences.hanja}
        sajuResult={sajuResult}
        onClose={() => setPickerModal((prev) => ({ ...prev, open: false }))}
        onTogglePreferred={(hanja) => {
          if (parsedPreferences.hanja.includes(hanja)) {
            removePreferredToken(hanja);
          } else {
            addPreferredToken(hanja);
          }
        }}
        onSelectSingle={(item, readingUsed) => {
          const r = readingUsed || item.legalReadings[0] || '';
          if (pickerModal.mode === 'slot1') {
            onChangeNamingConfig({ recHangul1: r, recFixedHanja1: item.hanja });
          } else if (pickerModal.mode === 'slot2') {
            onChangeNamingConfig({ recHangul2: r, recFixedHanja2: item.hanja });
          } else if (pickerModal.mode === 'manual1') {
            onChangeNamingConfig({
              ...(r ? { manHangul1: r } : {}),
              manHanja1: item.hanja,
            });
          } else if (pickerModal.mode === 'manual2') {
            onChangeNamingConfig({
              ...(r ? { manHangul2: r } : {}),
              manHanja2: item.hanja,
            });
          } else if (pickerModal.mode === 'current1') {
            onChangeCurrentName(r || currentHangul1, item.hanja, currentHangul2, currentHanja2);
          } else if (pickerModal.mode === 'current2') {
            onChangeCurrentName(currentHangul1, currentHanja1, r || currentHangul2, item.hanja);
          }
          setPickerModal((prev) => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
}
