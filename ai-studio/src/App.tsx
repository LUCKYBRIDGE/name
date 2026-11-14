import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Database,
  FolderOpen,
  GitCompare,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AppMode,
  BirthInput,
  FiveElement,
  NameEvaluation,
  NormalizedSurnameProfile,
  RepoMetadata,
  SajuAnalysisResult,
  SavedWorkspaceProfile,
  StrokeMethodId,
  StudioTab,
} from './types/naming.ts';
import { SajuSurnamePanel } from './components/SajuSurnamePanel.tsx';
import { NamingStudioPanel } from './components/NamingStudioPanel.tsx';
import { ComparisonReportPanel } from './components/ComparisonReportPanel.tsx';
import { HanjaDictionaryPanel } from './components/HanjaDictionaryPanel.tsx';
import { RepoSyncPanel } from './components/RepoSyncPanel.tsx';
import { ContextSummaryStrip } from './components/ContextSummaryStrip.tsx';
import { StartModeSelector } from './components/StartModeSelector.tsx';
import { SurnamePickerModal } from './components/SurnamePickerModal.tsx';
import { WorkspaceSaveLoadModal } from './components/WorkspaceSaveLoadModal.tsx';
import { FirstVisitNoticeModal } from './components/FirstVisitNoticeModal.tsx';

export type NamingConfigState = SavedWorkspaceProfile['namingConfig'];

const STORAGE_SAVED_KEY = 'luckybridge_seo_saved_candidates_v2';
const STORAGE_NOTES_KEY = 'luckybridge_seo_custom_notes_v2';
const STORAGE_PROFILES_KEY = 'luckybridge_workspace_profiles_v2';
const STORAGE_NOTICE_ACK_KEY = 'nolsaju_first_notice_ack_v1';

const DEFAULT_ADULT_BIRTH: BirthInput = {
  calendarType: 'solar',
  isLeapMonth: false,
  year: 1992,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  timeUnknown: false,
  gender: 'unspecified',
  useTrueSolarTime: false,
  longitudeOffsetMinutes: -32,
  ziHourMethod: 'midnight',
  birthplace: '서울',
};

function get2026TodayBirthInput(): BirthInput {
  const now = new Date();
  const is2026 = now.getFullYear() === 2026;
  return {
    calendarType: 'solar',
    isLeapMonth: false,
    year: 2026,
    month: is2026 ? now.getMonth() + 1 : 1,
    day: is2026 ? now.getDate() : 1,
    hour: is2026 ? now.getHours() : 12,
    minute: is2026 ? now.getMinutes() : 0,
    timeUnknown: false,
    gender: 'unspecified',
    useTrueSolarTime: false,
    longitudeOffsetMinutes: -32,
    ziHourMethod: 'midnight',
    birthplace: '서울',
  };
}

const DEFAULT_NAMING_CONFIG: NamingConfigState = {
  studioMode: 'recommend',
  targetElements: ['수', '목'],
  recHangul1: '',
  recHangul2: '',
  recFixedHanja1: '',
  recFixedHanja2: '',
  preferredInput: '',
  manHangul1: '지',
  manHanja1: '智',
  manHangul2: '우',
  manHanja2: '宇',
  requireAllFourGood: true,
  requireSoundHarmony: true,
  excludeTaboo: true,
  avoidSurnameRepetition: true,
  maxStrokesPerChar: 18,
};

function defaultReasonForMode(mode: AppMode): string {
  return mode === 'naming'
    ? '신생아·새 이름 사주 용신 보완 및 수리·발음 조화'
    : '사주 용신 보완 및 수리·발음오행 균형 개선';
}

export default function App() {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>('analyze');
  const [activeTab, setActiveTab] = useState<StudioTab>('saju');
  const [repoMeta, setRepoMeta] = useState<RepoMetadata | null>(null);

  // Selected Surname state (supports all 31 LUCKYBRIDGE/name surnames + custom)
  const [selectedSurnameHangul, setSelectedSurnameHangul] = useState('서');
  const [selectedSurnameHanja, setSelectedSurnameHanja] = useState('徐');
  const [surnamePickerOpen, setSurnamePickerOpen] = useState(false);

  // Saju state
  const [birthInput, setBirthInput] = useState<BirthInput>(DEFAULT_ADULT_BIRTH);
  const [sajuResult, setSajuResult] = useState<SajuAnalysisResult | null>(null);
  const [sajuLoading, setSajuLoading] = useState(false);
  const [sajuError, setSajuError] = useState<string | null>(null);

  // Method & Current Name (Before Renaming / Reference)
  const [strokeMethod, setStrokeMethod] = useState<StrokeMethodId>('wonhoek_kangxi');
  const [surnameStrokeOverride, setSurnameStrokeOverride] = useState<number | null>(null);
  const [currentHangul1, setCurrentHangul1] = useState('민');
  const [currentHanja1, setCurrentHanja1] = useState('敏');
  const [currentHangul2, setCurrentHangul2] = useState('수');
  const [currentHanja2, setCurrentHanja2] = useState('修');
  const [currentEval, setCurrentEval] = useState<NameEvaluation | null>(null);

  // Naming configuration, targets, filters & selection
  const [namingConfig, setNamingConfig] = useState<NamingConfigState>(DEFAULT_NAMING_CONFIG);
  const [selectedCandidate, setSelectedCandidate] = useState<NameEvaluation | null>(null);
  const [reasonForAnalysis, setReasonForAnalysis] = useState<string>(() =>
    defaultReasonForMode('analyze')
  );

  // Archive & Custom notes persisted in localStorage
  const [savedCandidates, setSavedCandidates] = useState<NameEvaluation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_KEY);
      return raw ? (JSON.parse(raw) as NameEvaluation[]) : [];
    } catch {
      return [];
    }
  });
  const [customNotes, setCustomNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_NOTES_KEY) || '';
    } catch {
      return '';
    }
  });
  const [showArchive, setShowArchive] = useState(false);

  // Local Save / Load Profiles (v2 clean schema)
  const [savedProfiles, setSavedProfiles] = useState<SavedWorkspaceProfile[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      return raw ? (JSON.parse(raw) as SavedWorkspaceProfile[]) : [];
    } catch {
      return [];
    }
  });
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [saveLoadModalOpen, setSaveLoadModalOpen] = useState(false);
  const [firstNoticeOpen, setFirstNoticeOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_NOTICE_ACK_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const handleCloseFirstNotice = (dontShowAgain: boolean) => {
    setFirstNoticeOpen(false);
    try {
      if (dontShowAgain) {
        localStorage.setItem(STORAGE_NOTICE_ACK_KEY, '1');
      } else {
        localStorage.removeItem(STORAGE_NOTICE_ACK_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  };

  const patchNamingConfig = useCallback((patch: Partial<NamingConfigState>) => {
    setNamingConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectedSurnameProfile: NormalizedSurnameProfile | null = useMemo(() => {
    const list = repoMeta?.surnames || [];
    return (
      list.find(
        (s) => s.hanja === selectedSurnameHanja && s.hangul === selectedSurnameHangul
      ) ||
      list.find((s) => s.hanja === selectedSurnameHanja) ||
      null
    );
  }, [repoMeta, selectedSurnameHangul, selectedSurnameHanja]);

  const today2026 = useMemo(() => get2026TodayBirthInput(), []);
  const today2026Label = `${today2026.year}.${String(today2026.month).padStart(2, '0')}.${String(
    today2026.day
  ).padStart(2, '0')}`;

  useEffect(() => {
    fetch('/api/meta')
      .then((r) => r.json())
      .then((d) => setRepoMeta(d))
      .catch(() => {});
  }, []);

  const analyzeSajuWithInput = useCallback(async (inputToUse: BirthInput) => {
    setSajuLoading(true);
    setSajuError(null);
    try {
      const resp = await fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputToUse),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '사주 분석에 실패했습니다.');
      const parsed = data as SajuAnalysisResult;
      setSajuResult(parsed);
      if (parsed.eokbuYongsinCandidates.length > 0) {
        setNamingConfig((prev) => ({
          ...prev,
          targetElements: parsed.eokbuYongsinCandidates,
        }));
      }
    } catch (err) {
      setSajuError(err instanceof Error ? err.message : '사주 계산 중 오류가 발생했습니다.');
    } finally {
      setSajuLoading(false);
    }
  }, []);

  const handleAnalyzeSaju = useCallback(async () => {
    await analyzeSajuWithInput(birthInput);
  }, [analyzeSajuWithInput, birthInput]);

  useEffect(() => {
    void analyzeSajuWithInput(DEFAULT_ADULT_BIRTH);
  }, [analyzeSajuWithInput]);

  // Evaluate Current Name whenever inputs, surname, or Saju change
  useEffect(() => {
    if (!currentHangul1.trim() && !currentHangul2.trim()) {
      setCurrentEval(null);
      return;
    }
    const controller = new AbortController();
    fetch('/api/naming/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surnameHangul: selectedSurnameHangul,
        surnameHanja: selectedSurnameHanja,
        surnameStrokeOverride,
        strokeMethod,
        hangul1: currentHangul1,
        hanja1: currentHanja1,
        hangul2: currentHangul2,
        hanja2: currentHanja2,
        saju: sajuResult,
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => setCurrentEval(d))
      .catch(() => {});
    return () => controller.abort();
  }, [
    selectedSurnameHangul,
    selectedSurnameHanja,
    surnameStrokeOverride,
    strokeMethod,
    currentHangul1,
    currentHanja1,
    currentHangul2,
    currentHanja2,
    sajuResult,
  ]);

  const handleSelectSurname = (hangul: string, hanja: string) => {
    setSelectedSurnameHangul(hangul);
    setSelectedSurnameHanja(hanja);
    setSurnameStrokeOverride(null);
  };

  const handleStartMode = (mode: AppMode) => {
    setAppMode(mode);
    setShowStartScreen(false);
    setActiveTab('saju');
    setSelectedCandidate(null);
    setActiveProfileId(null);
    setReasonForAnalysis(defaultReasonForMode(mode));

    if (mode === 'naming') {
      const nextBirth = get2026TodayBirthInput();
      setBirthInput(nextBirth);
      setCurrentHangul1('');
      setCurrentHanja1('');
      setCurrentHangul2('');
      setCurrentHanja2('');
      void analyzeSajuWithInput(nextBirth);
    } else {
      if (!currentHangul1 && !currentHangul2) {
        setCurrentHangul1('민');
        setCurrentHanja1('敏');
        setCurrentHangul2('수');
        setCurrentHanja2('修');
      }
      if (birthInput.year === 2026) {
        setBirthInput(DEFAULT_ADULT_BIRTH);
        void analyzeSajuWithInput(DEFAULT_ADULT_BIRTH);
      } else {
        void analyzeSajuWithInput(birthInput);
      }
    }
  };

  const handleApply2026Today = () => {
    const nextBirth = get2026TodayBirthInput();
    setBirthInput(nextBirth);
    void analyzeSajuWithInput(nextBirth);
  };

  const handleToggleSaveCandidate = (ev: NameEvaluation) => {
    setSavedCandidates((prev) => {
      const exists = prev.some(
        (c) => c.fullHangul === ev.fullHangul && c.fullHanja === ev.fullHanja
      );
      const next = exists
        ? prev.filter(
            (c) => !(c.fullHangul === ev.fullHangul && c.fullHanja === ev.fullHanja)
          )
        : [ev, ...prev];
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const handleSaveNotes = (notes: string) => {
    setCustomNotes(notes);
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, notes);
    } catch {
      // ignore storage quota errors
    }
  };

  // Build snapshot of current workspace (clean v2 schema)
  const buildCurrentWorkspaceSnapshot = (
    id: string,
    title: string
  ): SavedWorkspaceProfile => ({
    schemaVersion: 'luckybridge-workspace-v2',
    id,
    title,
    savedAt: new Date().toISOString(),
    appMode,
    activeTab,
    surname: {
      hangul: selectedSurnameHangul,
      hanja: selectedSurnameHanja,
      strokeOverride: surnameStrokeOverride,
    },
    strokeMethod,
    birthInput,
    sajuResult,
    currentName: {
      hangul1: currentHangul1,
      hanja1: currentHanja1,
      hangul2: currentHangul2,
      hanja2: currentHanja2,
    },
    namingConfig,
    selectedCandidate,
    savedCandidates,
    reasonForAnalysis,
    customNotes,
  });

  const persistProfiles = (next: SavedWorkspaceProfile[]) => {
    setSavedProfiles(next);
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  };

  const handleSaveAsNewProfile = (title: string) => {
    const newId = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snapshot = buildCurrentWorkspaceSnapshot(newId, title);
    persistProfiles([snapshot, ...savedProfiles]);
    setActiveProfileId(newId);
  };

  const handleOverwriteProfile = (id: string, title: string) => {
    const snapshot = buildCurrentWorkspaceSnapshot(id, title);
    const next = savedProfiles.map((p) => (p.id === id ? snapshot : p));
    persistProfiles(next);
  };

  const handleDeleteProfile = (id: string) => {
    const next = savedProfiles.filter((p) => p.id !== id);
    persistProfiles(next);
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  };

  const handleLoadProfile = (profile: SavedWorkspaceProfile) => {
    setAppMode(profile.appMode);
    setSelectedSurnameHangul(profile.surname.hangul);
    setSelectedSurnameHanja(profile.surname.hanja);
    setSurnameStrokeOverride(profile.surname.strokeOverride ?? null);
    setStrokeMethod(profile.strokeMethod || 'wonhoek_kangxi');
    setBirthInput(profile.birthInput);
    setSajuResult(profile.sajuResult);
    setCurrentHangul1(profile.currentName?.hangul1 || '');
    setCurrentHanja1(profile.currentName?.hanja1 || '');
    setCurrentHangul2(profile.currentName?.hangul2 || '');
    setCurrentHanja2(profile.currentName?.hanja2 || '');
    setNamingConfig({ ...DEFAULT_NAMING_CONFIG, ...profile.namingConfig });
    setSelectedCandidate(profile.selectedCandidate || null);
    if (Array.isArray(profile.savedCandidates)) {
      setSavedCandidates(profile.savedCandidates);
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(profile.savedCandidates));
      } catch {
        // ignore
      }
    }
    setReasonForAnalysis(profile.reasonForAnalysis || defaultReasonForMode(profile.appMode));
    handleSaveNotes(profile.customNotes || '');
    setActiveProfileId(profile.id);
    setShowStartScreen(false);
    setActiveTab(profile.activeTab || (profile.selectedCandidate ? 'studio' : 'saju'));
    if (!profile.sajuResult) {
      void analyzeSajuWithInput(profile.birthInput);
    }
  };

  const handleExportJson = (title: string) => {
    const id = activeProfileId || `ws_${Date.now()}`;
    const snapshot = buildCurrentWorkspaceSnapshot(id, title);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = title.replace(/[^가-힣a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `${safeName || 'naming_workspace'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (rawText: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(rawText) as SavedWorkspaceProfile;
      if (
        !parsed ||
        parsed.schemaVersion !== 'luckybridge-workspace-v2' ||
        !parsed.birthInput ||
        !parsed.surname?.hangul ||
        !parsed.namingConfig
      ) {
        return {
          ok: false,
          message: '올바른 성명학 저장 파일(luckybridge-workspace-v2) 형식이 아닙니다.',
        };
      }
      const imported: SavedWorkspaceProfile = {
        ...parsed,
        id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        savedAt: new Date().toISOString(),
      };
      persistProfiles([imported, ...savedProfiles]);
      handleLoadProfile(imported);
      return {
        ok: true,
        message: `'${imported.title}' 저장 파일을 성공적으로 불러왔습니다.`,
      };
    } catch {
      return {
        ok: false,
        message: 'JSON 파일을 해석할 수 없습니다. 파일 내용을 확인해 주세요.',
      };
    }
  };

  const defaultSaveTitle = useMemo(() => {
    const dateStr = `${birthInput.year}.${String(birthInput.month).padStart(2, '0')}.${String(
      birthInput.day
    ).padStart(2, '0')}`;
    if (appMode === 'naming') {
      const targetStr = selectedCandidate
        ? selectedCandidate.fullHangul
        : `${selectedSurnameHangul}OO`;
      return `${targetStr} 작명 (${dateStr})`;
    }
    const nameStr =
      currentHangul1 || currentHangul2
        ? `${selectedSurnameHangul}${currentHangul1}${currentHangul2}`
        : `${selectedSurnameHangul}씨`;
    return `${nameStr} 사주·이름분석 (${dateStr})`;
  }, [
    appMode,
    birthInput,
    selectedSurnameHangul,
    currentHangul1,
    currentHangul2,
    selectedCandidate,
  ]);

  const navItems: Array<{
    id: StudioTab;
    label: string;
    mobileLabel: string;
    icon: typeof Compass;
  }> = [
    {
      id: 'saju',
      label: `사주·${selectedSurnameHangul}(${selectedSurnameHanja}) 분석`,
      mobileLabel: '사주·성씨',
      icon: Compass,
    },
    {
      id: 'studio',
      label: appMode === 'naming' ? '새 이름 작명' : '개명 작명소',
      mobileLabel: appMode === 'naming' ? '작명하기' : '개명작명',
      icon: Sparkles,
    },
    {
      id: 'compare',
      label: appMode === 'naming' ? '작명 리포트' : '개명 비교 리포트',
      mobileLabel: '리포트',
      icon: GitCompare,
    },
    {
      id: 'hanja',
      label: '인명용 한자·획순',
      mobileLabel: '한자사전',
      icon: BookOpen,
    },
    {
      id: 'sync',
      label: '자료 동기화',
      mobileLabel: '자료·메모',
      icon: Database,
    },
  ];

  const handleNavigateTab = (tab: StudioTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {showStartScreen ? (
        <StartModeSelector
          repoMeta={repoMeta}
          selectedSurnameHangul={selectedSurnameHangul}
          selectedSurnameHanja={selectedSurnameHanja}
          selectedSurnameProfile={selectedSurnameProfile}
          today2026Label={today2026Label}
          savedProfiles={savedProfiles}
          onSelectSurname={handleSelectSurname}
          onOpenSurnamePicker={() => setSurnamePickerOpen(true)}
          onStartMode={handleStartMode}
          onLoadProfile={handleLoadProfile}
          onOpenSaveLoadModal={() => setSaveLoadModalOpen(true)}
          onImportJson={handleImportJson}
          onOpenNotice={() => setFirstNoticeOpen(true)}
        />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
          {/* Top Bar: Relative on mobile (keeps sticky <= 15% cap for bottom tab bar), sticky on desktop */}
          <header className="relative md:sticky md:top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-xs border-b border-[#E7E2D8]">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-8">
              {/* Zone 1: Single-line brand wordmark (clicks return to start screen) */}
              <button
                type="button"
                onClick={() => setShowStartScreen(true)}
                title="놀사주 첫 화면(모드·성씨 선택)으로 돌아가기"
                className="font-serif-kr text-lg sm:text-xl font-bold tracking-tight text-[#1C1917] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] flex items-center"
              >
                놀사주
              </button>

              {/* Zone 2: 5 concise single-line nav links (desktop >= md) */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigateTab(item.id)}
                      className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                        active
                          ? 'text-[#9A3412] border-[#9A3412]'
                          : 'text-[#57534E] border-transparent hover:text-[#1C1917]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Zone 3: Save/Load + Saved Archive (touch-friendly >= 40px) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSaveLoadModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium border border-[#D6CEBE] bg-white hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#9A3412]" />
                  <span className="hidden sm:inline">저장 · 불러오기</span>
                  <span className="sm:hidden">저장함</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchive(true)}
                  className="px-3 sm:px-4 min-h-[40px] sm:min-h-[36px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
                >
                  보관함 ({savedCandidates.length})
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Container (extra bottom padding on mobile for fixed bottom nav) */}
          <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-8">
            <ContextSummaryStrip
              appMode={appMode}
              surnameHangul={selectedSurnameHangul}
              surnameHanja={selectedSurnameHanja}
              activeTab={activeTab}
              onNavigate={handleNavigateTab}
              onOpenSurnamePicker={() => setSurnamePickerOpen(true)}
              sajuResult={sajuResult}
              currentEval={currentEval}
              selectedCandidate={selectedCandidate}
            />

            {activeTab === 'saju' && (
              <SajuSurnamePanel
                appMode={appMode}
                selectedSurnameHangul={selectedSurnameHangul}
                selectedSurnameHanja={selectedSurnameHanja}
                selectedSurnameProfile={selectedSurnameProfile}
                onOpenSurnamePicker={() => setSurnamePickerOpen(true)}
                onApply2026Today={handleApply2026Today}
                birthInput={birthInput}
                onChangeBirthInput={setBirthInput}
                onAnalyzeSaju={handleAnalyzeSaju}
                sajuLoading={sajuLoading}
                sajuError={sajuError}
                sajuResult={sajuResult}
                repoMeta={repoMeta}
                onProceedToNaming={(els) => {
                  if (els.length > 0) patchNamingConfig({ targetElements: els });
                  handleNavigateTab('studio');
                }}
              />
            )}

            {activeTab === 'studio' && (
              <NamingStudioPanel
                appMode={appMode}
                surnameHangul={selectedSurnameHangul}
                surnameHanja={selectedSurnameHanja}
                surnameProfile={selectedSurnameProfile}
                onOpenSurnamePicker={() => setSurnamePickerOpen(true)}
                namingConfig={namingConfig}
                onChangeNamingConfig={patchNamingConfig}
                sajuResult={sajuResult}
                strokeMethod={strokeMethod}
                onChangeStrokeMethod={setStrokeMethod}
                surnameStrokeOverride={surnameStrokeOverride}
                onChangeSurnameStrokeOverride={setSurnameStrokeOverride}
                currentHangul1={currentHangul1}
                currentHangul2={currentHangul2}
                currentHanja1={currentHanja1}
                currentHanja2={currentHanja2}
                onChangeCurrentName={(h1, c1, h2, c2) => {
                  setCurrentHangul1(h1);
                  setCurrentHanja1(c1);
                  setCurrentHangul2(h2);
                  setCurrentHanja2(c2);
                }}
                currentEval={currentEval}
                selectedCandidate={selectedCandidate}
                onSelectCandidate={setSelectedCandidate}
                savedCandidates={savedCandidates}
                onToggleSaveCandidate={handleToggleSaveCandidate}
                onOpenComparison={(ev) => {
                  setSelectedCandidate(ev);
                  handleNavigateTab('compare');
                }}
              />
            )}

            {activeTab === 'compare' && (
              <ComparisonReportPanel
                appMode={appMode}
                sajuResult={sajuResult}
                currentEval={currentEval}
                selectedCandidate={selectedCandidate}
                savedCandidates={savedCandidates}
                onSelectCandidate={setSelectedCandidate}
                reasonForAnalysis={reasonForAnalysis}
                onChangeReasonForAnalysis={setReasonForAnalysis}
                customNotes={customNotes}
              />
            )}

            {activeTab === 'hanja' && <HanjaDictionaryPanel />}

            {activeTab === 'sync' && (
              <RepoSyncPanel
                repoMeta={repoMeta}
                onRefreshMeta={setRepoMeta}
                customNotes={customNotes}
                onSaveCustomNotes={handleSaveNotes}
              />
            )}
          </main>

          {/* Quiet Editorial Footer */}
          <footer className="border-t border-[#E7E2D8] bg-[#FBF9F5] py-5 px-4 sm:px-6 pb-20 md:pb-5">
            <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#78716C]">
              <span>
                놀사주 · LUCKYBRIDGE/name 정통 성명학 · 명리 · 대법원 인명용 한자(2024-07-16 미러) 기준
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <span>
                  전통 성명학 해석은 참고용이며, 출생·개명 신고 전 대법원 전자가족관계등록시스템 최종 확인을 권장합니다.
                </span>
                <button
                  type="button"
                  onClick={() => setFirstNoticeOpen(true)}
                  className="text-[#9A3412] hover:underline cursor-pointer whitespace-nowrap"
                >
                  미리보기·AI 안내
                </button>
              </span>
            </div>
          </footer>

          {/* Mobile Fixed Bottom Navigation Bar (58px -> < 9% of viewport height) */}
          <nav
            aria-label="모바일 하단 메뉴"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-t border-[#E7E2D8] pb-safe"
          >
            <div className="grid grid-cols-5 h-[58px]">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={`mob-${item.id}`}
                    type="button"
                    onClick={() => handleNavigateTab(item.id)}
                    className={`flex flex-col items-center justify-center min-h-[44px] px-1 transition-colors cursor-pointer ${
                      active ? 'text-[#9A3412] font-semibold' : 'text-[#57534E]'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.75} />
                    <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap truncate max-w-full">
                      {item.mobileLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Saved Candidates Drawer */}
          {showArchive && (
            <div
              className="fixed inset-0 z-50 flex justify-end bg-black/40"
              onClick={() => setShowArchive(false)}
            >
              <div
                className="w-full max-w-md bg-[#FBF9F5] h-full border-l border-[#E7E2D8] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-[#E7E2D8] bg-white flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-kr text-lg font-semibold text-[#1C1917]">
                      이름 후보 보관함 ({savedCandidates.length})
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      저장한 후보를 눌러 비교·분석 리포트로 바로 이동할 수 있습니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowArchive(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                    aria-label="보관함 닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                  {savedCandidates.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#78716C]">
                      보관함에 저장된 이름 후보가 없습니다.
                      <br />
                      작명 스튜디오에서 마음에 드는 이름을 담아보세요.
                    </div>
                  ) : (
                    savedCandidates.map((item) => (
                      <div
                        key={`${item.fullHangul}-${item.fullHanja}`}
                        className="border border-[#E7E2D8] bg-white rounded-sm p-3.5 sm:p-4 flex items-start justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(item);
                            handleNavigateTab('compare');
                            setShowArchive(false);
                          }}
                          className="text-left flex-1 min-h-[44px] cursor-pointer"
                        >
                          <div className="font-serif-kr text-lg font-semibold text-[#1C1917]">
                            {item.fullHangul} ({item.fullHanja})
                          </div>
                          <div className="text-xs text-[#57534E] mt-0.5">
                            {item.characters[1]?.meaning.split(',')[0]} ·{' '}
                            {item.characters[2]?.meaning.split(',')[0]}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-[#78716C] mt-1">
                            4격 길수 {item.numerology.goodCount}/4 · 음양 {item.yinYangPattern.labels} ·{' '}
                            {item.pronunciationElements.harmonyLabel}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSaveCandidate(item)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#78716C] hover:text-[#9A3412] cursor-pointer"
                          aria-label="보관함에서 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Modals (accessible from both Start Screen & Studio) */}
      <SurnamePickerModal
        open={surnamePickerOpen}
        repoMeta={repoMeta}
        selectedHangul={selectedSurnameHangul}
        selectedHanja={selectedSurnameHanja}
        onSelect={handleSelectSurname}
        onClose={() => setSurnamePickerOpen(false)}
      />

      <WorkspaceSaveLoadModal
        open={saveLoadModalOpen}
        profiles={savedProfiles}
        activeProfileId={activeProfileId}
        defaultTitle={defaultSaveTitle}
        onClose={() => setSaveLoadModalOpen(false)}
        onSaveAsNew={handleSaveAsNewProfile}
        onOverwriteExisting={handleOverwriteProfile}
        onLoadProfile={handleLoadProfile}
        onDeleteProfile={handleDeleteProfile}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <FirstVisitNoticeModal open={firstNoticeOpen} onClose={handleCloseFirstNotice} />
    </>
  );
}
