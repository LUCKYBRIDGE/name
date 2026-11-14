import { useState } from 'react';
import { ExternalLink, RefreshCw, Save } from 'lucide-react';
import type { FiveElement, RepoMetadata } from '../types/naming.ts';

interface RepoSyncPanelProps {
  repoMeta: RepoMetadata | null;
  onRefreshMeta: (nextMeta: RepoMetadata) => void;
  customNotes: string;
  onSaveCustomNotes: (notes: string) => void;
}

export function RepoSyncPanel({
  repoMeta,
  onRefreshMeta,
  customNotes,
  onSaveCustomNotes,
}: RepoSyncPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState(customNotes);
  const [noteSavedMsg, setNoteSavedMsg] = useState<string | null>(null);

  const [ovHanja, setOvHanja] = useState('');
  const [ovStrokes, setOvStrokes] = useState('');
  const [ovElement, setOvElement] = useState<FiveElement | ''>('');
  const [ovMeaning, setOvMeaning] = useState('');
  const [ovStatus, setOvStatus] = useState<string | null>(null);

  const handleGitHubSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const resp = await fetch('/api/repo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'github' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '동기화 실패');
      setSyncMsg(data.message);
      if (data.meta) onRefreshMeta(data.meta);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : '동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyOverride = async () => {
    if (!ovHanja.trim()) return;
    setOvStatus(null);
    try {
      const resp = await fetch('/api/repo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'custom_overrides',
          overrides: [
            {
              hanja: ovHanja.trim(),
              wonhoekStrokes: ovStrokes ? Number(ovStrokes) : undefined,
              resourceElement: ovElement || undefined,
              primaryMeaning: ovMeaning.trim() || undefined,
              resourceElementBasis: '사용자 직접 보정 규칙',
            },
          ],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '규칙 적용 실패');
      setOvStatus(data.message);
    } catch (err) {
      setOvStatus(err instanceof Error ? err.message : '규칙 적용 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* Left: LUCKYBRIDGE/name Dataset Summary & GitHub Sync */}
      <div className="lg:col-span-6 border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E7E2D8] pb-4">
          <div>
            <p className="text-xs text-[#78716C]">연동된 원본 저장소</p>
            <h2 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-0.5">
              LUCKYBRIDGE/name 데이터셋 현황
            </h2>
          </div>
          <a
            href="https://github.com/LUCKYBRIDGE/name"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline min-h-[36px]"
          >
            GitHub 저장소 열기
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
            <div className="text-[#78716C]">인명용 한자 · 다중의미</div>
            <div className="font-mono tabular-nums text-lg sm:text-xl font-semibold text-[#1C1917] mt-1">
              {repoMeta?.hanjaCount.toLocaleString() ?? '9,460'}자
            </div>
            <div className="text-[11px] text-[#57534E] mt-0.5">
              {repoMeta?.readingCount ?? 486}개 독음 · 13,046개 분해 의미
            </div>
          </div>

          <div className="p-3.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm">
            <div className="text-[#78716C]">성씨 · 본관 레코드</div>
            <div className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-1">
              주요 {repoMeta?.surnames.length ?? 31}대 성씨
            </div>
            <div className="text-[11px] text-[#57534E] mt-0.5">
              2015 본관 요약 31성 완비 · 동음 구분 {repoMeta?.disambiguationNotes.length ?? 5}건
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#57534E]">
          <div className="font-semibold text-[#1C1917]">적용된 저장소 테이블 및 규칙</div>
          <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
            <li>대법원 인명용 한자 미러 + 다중의미 분해(meaning-senses) + 작명 주의 뜻 안내</li>
            <li>자평명리 10천간 · 12지지 · 지장간 · 십성(100) · 12운성 · KASI 2026~2027 24절기</li>
            <li>한국 표준시 역사(1954~1961 UTC+8:30) 및 서머타임(1948~1988 DST) 보정</li>
            <li>{repoMeta?.surnames.length ?? 31}대 성씨 본관 분포 요약(clans-core-2015) 및 음절 경계 원칙</li>
          </ul>
        </div>

        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleGitHubSync}
            disabled={syncing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 min-h-[44px] sm:min-h-[38px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] disabled:opacity-60 rounded-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'GitHub에서 최신 데이터 받는 중...' : 'GitHub 저장소에서 최신 기준 다시 불러오기'}
          </button>
          {syncMsg && (
            <div className="p-2.5 text-xs bg-[#ECFDF5] border border-[#A7F3D0] text-[#14532D] rounded-sm">
              {syncMsg}
            </div>
          )}
        </div>
      </div>

      {/* Right: Custom Hanja Override & Personal Renaming Notes */}
      <div className="lg:col-span-6 space-y-5 sm:space-y-6">
        <div className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="font-serif-kr text-lg font-semibold text-[#1C1917]">
              개별 한자 원획 · 자원오행 사용자 보정
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              특정 작명 학파나 개인 정리 노트의 원획·자원오행 기준이 기본값과 다를 때 즉시 반영합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="text"
              maxLength={1}
              value={ovHanja}
              onChange={(e) => setOvHanja(e.target.value)}
              placeholder="한자 (예: 熙)"
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={40}
              value={ovStrokes}
              onChange={(e) => setOvStrokes(e.target.value)}
              placeholder="원획수"
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm font-mono border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
            />
            <select
              value={ovElement}
              onChange={(e) => setOvElement(e.target.value as FiveElement | '')}
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
            >
              <option value="">자원오행 선택</option>
              <option value="목">木 목</option>
              <option value="화">火 화</option>
              <option value="토">土 토</option>
              <option value="금">金 금</option>
              <option value="수">水 수</option>
            </select>
            <input
              type="text"
              value={ovMeaning}
              onChange={(e) => setOvMeaning(e.target.value)}
              placeholder="뜻 보정(선택)"
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleApplyOverride}
              className="px-4 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-sm transition-colors cursor-pointer"
            >
              보정 규칙 적용
            </button>
            {ovStatus && <span className="text-xs text-[#14532D]">{ovStatus}</span>}
          </div>
        </div>

        <div className="border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-6 space-y-3">
          <div>
            <h3 className="font-serif-kr text-lg font-semibold text-[#1C1917]">
              개인 개명 · 작명 메모 (AI 해설에 반영)
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              집안 항렬자, 피하고 싶은 한자·발음, 중요하게 보는 기준을 적으면 AI 심층 해설과 로컬 저장에 함께 남습니다.
            </p>
          </div>
          <textarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="예: 집안 항렬, 이름에 '우'나 '윤' 발음이 부드럽게 들어가면 좋겠음."
            className="w-full p-3 text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412] leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveCustomNotes(noteDraft);
                setNoteSavedMsg('브라우저에 안전하게 저장되었습니다.');
              }}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              메모 저장
            </button>
            {noteSavedMsg && <span className="text-xs text-[#14532D]">{noteSavedMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
