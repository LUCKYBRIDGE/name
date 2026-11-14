import { useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, Save, Trash2, Upload, X } from 'lucide-react';
import type { SavedWorkspaceProfile } from '../types/naming.ts';

interface WorkspaceSaveLoadModalProps {
  open: boolean;
  profiles: SavedWorkspaceProfile[];
  activeProfileId: string | null;
  defaultTitle: string;
  onClose: () => void;
  onSaveAsNew: (title: string) => void;
  onOverwriteExisting: (id: string, title: string) => void;
  onLoadProfile: (profile: SavedWorkspaceProfile) => void;
  onDeleteProfile: (id: string) => void;
  onExportJson: (title: string) => void;
  onImportJson: (rawText: string) => { ok: boolean; message: string };
}

export function WorkspaceSaveLoadModal({
  open,
  profiles,
  activeProfileId,
  defaultTitle,
  onClose,
  onSaveAsNew,
  onOverwriteExisting,
  onLoadProfile,
  onDeleteProfile,
  onExportJson,
  onImportJson,
}: WorkspaceSaveLoadModalProps) {
  const [titleInput, setTitleInput] = useState(defaultTitle);
  const [statusMessage, setStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTitleInput(defaultTitle);
      setStatusMessage(null);
    }
  }, [open, defaultTitle]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = onImportJson(content);
      setStatusMessage({ ok: result.ok, text: result.message });
    };
    reader.onerror = () => {
      setStatusMessage({ ok: false, text: '파일을 읽는 중 오류가 발생했습니다.' });
    };
    reader.readAsText(file, 'utf8');
    e.target.value = '';
  };

  const activeProfile = activeProfileId
    ? profiles.find((p) => p.id === activeProfileId) || null
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[92dvh] sm:h-auto sm:max-h-[88vh] bg-[#FBF9F5] border-t sm:border border-[#E7E2D8] rounded-t-2xl sm:rounded-md shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden bg-white pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#D6CEBE] rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#E7E2D8] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-[#78716C] truncate">
              로컬 저장소 + JSON 백업 (luckybridge-workspace-v2)
            </p>
            <h2 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-0.5">
              분석 · 작명 작업 저장 및 불러오기
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer shrink-0"
            aria-label="저장·불러오기 창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {statusMessage && (
            <div
              className={`px-4 py-2.5 text-xs rounded-sm border ${
                statusMessage.ok
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#14532D]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#9A3412]'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Section 1: Save current state & Export/Import file */}
          <div className="bg-white border border-[#E7E2D8] rounded-md p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1C1917]">
                현재 사주분석 · 작명 필터 · 후보 전체 저장
              </h3>
              <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                성씨, 출생 일시, 사주 결과, 희망 글자 틀, 상세 필터 설정, 보관한 이름 후보와 메모가 한 번에 저장됩니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="저장 제목 (예: 김민수 내 이름 사주분석, 2026 박씨 작명)"
                className="flex-1 min-w-0 px-3 min-h-[44px] text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
              />

              <button
                type="button"
                onClick={() => {
                  const title = titleInput.trim() || defaultTitle;
                  onSaveAsNew(title);
                  setStatusMessage({
                    ok: true,
                    text: `'${title}' 기록을 브라우저 로컬 저장소에 새로 저장했습니다.`,
                  });
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-sm cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                브라우저에 새로 저장
              </button>

              {activeProfile && (
                <button
                  type="button"
                  onClick={() => {
                    const title = titleInput.trim() || activeProfile.title;
                    onOverwriteExisting(activeProfile.id, title);
                    setStatusMessage({
                      ok: true,
                      text: `'${title}' 기존 기록을 현재 상태로 업데이트했습니다.`,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-xs font-medium border border-[#9A3412] text-[#9A3412] bg-[#FFF7ED] hover:bg-[#FFEDD5] rounded-sm cursor-pointer whitespace-nowrap"
                >
                  현재 기록 덮어쓰기
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-[#78716C]">
                스마트폰·PC 간에 옮기려면 JSON 파일로 내려받거나 불러오세요.
              </span>
              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const title = titleInput.trim() || defaultTitle;
                    onExportJson(title);
                    setStatusMessage({
                      ok: true,
                      text: `JSON 파일로 내려받기를 시작했습니다.`,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-[36px] text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  파일 저장(.json)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-[36px] text-xs font-medium border border-[#1C1917] bg-[#1C1917] hover:bg-[#292524] text-white rounded-sm cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  파일 불러오기
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Saved Profiles List */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#1C1917]">
                저장된 로컬 기록 목록 ({profiles.length}건)
              </h3>
              <span className="text-[11px] text-[#78716C]">
                이 기기 브라우저의 localStorage에 보관됩니다.
              </span>
            </div>

            {profiles.length === 0 ? (
              <div className="bg-white border border-[#E7E2D8] rounded-md p-8 sm:p-10 text-center text-xs text-[#78716C]">
                아직 저장된 기록이 없습니다. 위에서 제목을 입력하고 ‘브라우저에 새로 저장’을 눌러보세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {profiles.map((prof) => {
                  const isCurrent = prof.id === activeProfileId;
                  const savedDate = new Date(prof.savedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={prof.id}
                      className={`p-3.5 sm:p-4 border rounded-sm bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent ? 'border-[#9A3412]' : 'border-[#E7E2D8]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-[11px] font-medium">
                          <span className={prof.appMode === 'naming' ? 'text-[#14532D]' : 'text-[#1E3A8A]'}>
                            {prof.appMode === 'naming' ? '작명하기' : '사주분석'}
                          </span>
                          {isCurrent && (
                            <span className="text-[#9A3412] ml-2">· 현재 작업중</span>
                          )}
                        </div>
                        <div className="font-serif-kr text-sm font-semibold text-[#1C1917] truncate">
                          {prof.title}
                        </div>
                        <div className="text-[11px] text-[#57534E] font-mono tabular-nums">
                          {prof.surname.hangul}({prof.surname.hanja}) · {prof.birthInput.year}.
                          {String(prof.birthInput.month).padStart(2, '0')}.
                          {String(prof.birthInput.day).padStart(2, '0')} · 후보{' '}
                          {prof.savedCandidates.length}건 · {savedDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadProfile(prof);
                            onClose();
                          }}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm cursor-pointer whitespace-nowrap"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          불러오기
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProfile(prof.id)}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-[#78716C] hover:text-[#9A3412] border border-[#E7E2D8] rounded-sm cursor-pointer"
                          aria-label="저장 기록 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
