import { useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Compass,
  FolderOpen,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import type {
  AppMode,
  NormalizedSurnameProfile,
  RepoMetadata,
  SavedWorkspaceProfile,
} from '../types/naming.ts';
import { ElementTag } from './ElementBadge.tsx';

interface StartModeSelectorProps {
  repoMeta: RepoMetadata | null;
  selectedSurnameHangul: string;
  selectedSurnameHanja: string;
  selectedSurnameProfile: NormalizedSurnameProfile | null;
  today2026Label: string;
  savedProfiles: SavedWorkspaceProfile[];
  onSelectSurname: (hangul: string, hanja: string) => void;
  onOpenSurnamePicker: () => void;
  onStartMode: (mode: AppMode) => void;
  onLoadProfile: (profile: SavedWorkspaceProfile) => void;
  onOpenSaveLoadModal: () => void;
  onImportJson: (rawText: string) => { ok: boolean; message: string };
  onOpenNotice: () => void;
}

const FEATURED_SURNAMES: Array<{ hangul: string; hanja: string; hint?: string }> = [
  { hangul: '김', hanja: '金' },
  { hangul: '이', hanja: '李' },
  { hangul: '박', hanja: '朴' },
  { hangul: '최', hanja: '崔' },
  { hangul: '정', hanja: '鄭' },
  { hangul: '강', hanja: '姜' },
  { hangul: '조', hanja: '趙', hint: '14획' },
  { hangul: '조', hanja: '曺', hint: '10획' },
  { hangul: '윤', hanja: '尹' },
  { hangul: '장', hanja: '張' },
  { hangul: '임', hanja: '林' },
  { hangul: '한', hanja: '韓' },
  { hangul: '오', hanja: '吳' },
  { hangul: '서', hanja: '徐' },
  { hangul: '신', hanja: '申' },
  { hangul: '권', hanja: '權' },
];

export function StartModeSelector({
  repoMeta,
  selectedSurnameHangul,
  selectedSurnameHanja,
  selectedSurnameProfile,
  today2026Label,
  savedProfiles,
  onSelectSurname,
  onOpenSurnamePicker,
  onStartMode,
  onLoadProfile,
  onOpenSaveLoadModal,
  onImportJson,
  onOpenNotice,
}: StartModeSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = onImportJson(content);
      setImportNotice(res.message);
    };
    reader.readAsText(file, 'utf8');
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col">
      {/* Subtle Top Editorial Header */}
      <header className="border-b border-[#E7E2D8] bg-white/85 backdrop-blur-xs">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif-kr text-lg sm:text-xl font-bold text-[#1C1917] truncate">
              놀사주
            </span>
            <span className="hidden md:inline text-xs text-[#78716C] whitespace-nowrap">
              정통 사주·성명학 · {repoMeta?.surnames.length ?? 31}대 성씨 · 대법원 인명용{' '}
              {(repoMeta?.hanjaCount ?? 9460).toLocaleString()}자
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSaveLoadModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 min-h-[44px] sm:min-h-[36px] text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#9A3412]" />
            저장함 ({savedProfiles.length})
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Intro */}
        <section className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#9A3412] tracking-wide">
            놀사주 · 시작 전 성씨와 분석 목적을 선택하세요
          </p>
          <h1 className="font-serif-kr text-2xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
            어떤 작업으로 시작할까요?
          </h1>
          <p className="text-sm text-[#57534E] leading-relaxed">
            전통 명리(만세력·용신)와 정통 성명학(81수리·음양·발음·자원오행)을 한눈에 살필 수 있습니다.
            성씨를 먼저 고르신 뒤 원하시는 모드를 선택해 주세요.
          </p>
        </section>

        {/* Step 1: Surname Quick Selector */}
        <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E2D8] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-[#9A3412]/40 bg-[#FFF7ED] rounded-sm flex items-center justify-center font-serif-kr text-xl font-bold text-[#9A3412] shrink-0">
                {selectedSurnameHangul}
                <span className="text-sm font-normal ml-0.5 text-[#57534E]">
                  {selectedSurnameHanja}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[#78716C]">1단계 · 선택된 성씨</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                  <span className="font-serif-kr text-base font-semibold text-[#1C1917]">
                    {selectedSurnameHangul} ({selectedSurnameHanja})
                  </span>
                  {selectedSurnameProfile && (
                    <>
                      <ElementTag element={selectedSurnameProfile.soundElement} />
                      <span className="text-xs text-[#57534E] font-mono tabular-nums">
                        {selectedSurnameProfile.wonhoekStrokes !==
                        selectedSurnameProfile.technicalTotalStrokes
                          ? `원획 ${selectedSurnameProfile.wonhoekStrokes}획 · 기술 ${selectedSurnameProfile.technicalTotalStrokes}획`
                          : `${selectedSurnameProfile.technicalTotalStrokes}획`}{' '}
                        · {selectedSurnameProfile.syllableShape === 'CV' ? '받침없음' : '받침있음'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSurnamePicker}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] sm:min-h-[38px] text-xs font-medium border border-[#9A3412]/40 bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#9A3412] rounded-sm cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              {repoMeta?.surnames.length ?? 31}대 성씨 전체 · 직접 입력
            </button>
          </div>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5">
            {FEATURED_SURNAMES.map((item) => {
              const active =
                item.hangul === selectedSurnameHangul && item.hanja === selectedSurnameHanja;
              return (
                <button
                  key={`${item.hangul}-${item.hanja}`}
                  type="button"
                  onClick={() => onSelectSurname(item.hangul, item.hanja)}
                  className={`px-2 sm:px-3 min-h-[42px] sm:min-h-[34px] text-xs border rounded-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center ${
                    active
                      ? 'border-[#1C1917] bg-[#1C1917] text-white font-medium'
                      : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917]'
                  }`}
                >
                  {item.hangul}({item.hanja}
                  {item.hint ? `·${item.hint}` : ''})
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Two Primary Mode Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: 내 이름 사주분석 */}
          <button
            type="button"
            onClick={() => onStartMode('analyze')}
            className="group text-left border border-[#E7E2D8] hover:border-[#1C1917] bg-white rounded-md p-5 sm:p-7 transition-all cursor-pointer flex flex-col justify-between space-y-5 active:scale-[0.99]"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A]">
                  <Compass className="w-4 h-4 shrink-0" />
                  현재 이름 진단 · 개명 비교
                </span>
                <span className="text-xs text-[#78716C] group-hover:text-[#1C1917] inline-flex items-center gap-1 shrink-0">
                  시작하기 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <h2 className="font-serif-kr text-2xl font-bold text-[#1C1917] group-hover:text-[#9A3412] transition-colors">
                  내 이름 사주분석
                </h2>
                <p className="text-sm text-[#57534E] leading-relaxed mt-2">
                  내 생년월일시 사주와 지금 쓰고 있는 한자 이름이 얼마나 잘 맞는지 확인합니다.
                  원·형·이·정 4격 수리, 발음오행, 부족한 사주 오행 보완 여부를 진단하고 필요 시 개명 후보와 비교합니다.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E2D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
              <span>기존 한자 이름 정밀 감정 · 개명 전후 대조</span>
              <span className="font-mono text-[#1C1917]">
                성씨 {selectedSurnameHangul}({selectedSurnameHanja}) 적용
              </span>
            </div>
          </button>

          {/* Card 2: 작명하기 (2026년 현재 날짜 기본) */}
          <button
            type="button"
            onClick={() => onStartMode('naming')}
            className="group text-left border-2 border-[#9A3412]/35 hover:border-[#9A3412] bg-white rounded-md p-5 sm:p-7 transition-all cursor-pointer flex flex-col justify-between space-y-5 active:scale-[0.99]"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  신생아 · 새 이름 작명
                </span>
                <span className="text-xs font-medium text-[#9A3412] inline-flex items-center gap-1 shrink-0">
                  시작하기 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <h2 className="font-serif-kr text-2xl font-bold text-[#1C1917] group-hover:text-[#9A3412] transition-colors">
                  작명하기
                </h2>
                <p className="text-sm text-[#57534E] leading-relaxed mt-2">
                  2026년 현재 날짜({today2026Label})를 기본 사주로 세팅해 바로 이름을 지어봅니다.
                  원하는 글자 틀(예: {selectedSurnameHangul}X우)이나 꼭 넣고 싶은 한글·한자를 지정해 추천받을 수 있습니다.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E2D8] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#14532D] font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                기본 날짜: {today2026Label} (2026 KASI 절기)
              </span>
              <span className="font-mono text-[#1C1917]">
                성씨 {selectedSurnameHangul}({selectedSurnameHanja}) 적용
              </span>
            </div>
          </button>
        </section>

        {/* Step 3: Local Save / Load Recent Workspace */}
        <section className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E2D8] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">
                저장한 사주분석 · 작명 기록 불러오기
              </h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                이전에 브라우저에 저장했거나 내보낸 JSON 파일을 불러와 작업을 바로 이어서 볼 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] sm:min-h-[36px] text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-[#9A3412]" />
                JSON 파일 불러오기
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {importNotice && (
            <div className="px-3 py-2 text-xs bg-[#FEF2F2] border border-[#FECACA] text-[#9A3412] rounded-sm">
              {importNotice}
            </div>
          )}

          {savedProfiles.length === 0 ? (
            <p className="text-xs text-[#78716C] leading-relaxed">
              아직 저장된 기록이 없습니다. 위 두 가지 모드 중 하나를 선택해 분석한 뒤 상단의 ‘저장함’으로 기록을 보관해 보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedProfiles.slice(0, 6).map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onLoadProfile(prof)}
                  className="text-left p-4 border border-[#E7E2D8] hover:border-[#9A3412] bg-[#FBF9F5] hover:bg-white rounded-sm transition-colors cursor-pointer space-y-1.5 min-h-[84px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold ${
                        prof.appMode === 'naming' ? 'text-[#14532D]' : 'text-[#1E3A8A]'
                      }`}
                    >
                      {prof.appMode === 'naming' ? '작명하기' : '사주분석'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#78716C]" />
                  </div>
                  <div className="font-serif-kr text-sm font-semibold text-[#1C1917] truncate">
                    {prof.title}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#57534E]">
                    {prof.surname.hangul}({prof.surname.hanja}) · {prof.birthInput.year}.
                    {String(prof.birthInput.month).padStart(2, '0')}.
                    {String(prof.birthInput.day).padStart(2, '0')} · 후보{' '}
                    {prof.savedCandidates.length}건
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#E7E2D8] bg-[#FBF9F5] py-4 px-4 sm:px-6">
        <div className="max-w-[1120px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
          <span>놀사주 · Google AI Studio 미리보기 공유 버전 (비상업·참고용)</span>
          <button
            type="button"
            onClick={onOpenNotice}
            className="min-h-[36px] px-1 text-[#9A3412] hover:underline cursor-pointer"
          >
            미리보기·AI 한도 및 개인정보 안내 보기
          </button>
        </div>
      </footer>
    </div>
  );
}
