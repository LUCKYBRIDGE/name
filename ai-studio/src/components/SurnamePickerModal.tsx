import { useMemo, useState } from 'react';
import { AlertCircle, Check, Search, X } from 'lucide-react';
import type { HanjaRecord, NormalizedSurnameProfile, RepoMetadata } from '../types/naming.ts';
import { ElementTag } from './ElementBadge.tsx';

interface SurnamePickerModalProps {
  open: boolean;
  repoMeta: RepoMetadata | null;
  selectedHangul: string;
  selectedHanja: string;
  onSelect: (hangul: string, hanja: string) => void;
  onClose: () => void;
}

export function SurnamePickerModal({
  open,
  repoMeta,
  selectedHangul,
  selectedHanja,
  onSelect,
  onClose,
}: SurnamePickerModalProps) {
  const [query, setQuery] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customHangul, setCustomHangul] = useState('');
  const [customHanja, setCustomHanja] = useState('');
  const [customCandidates, setCustomCandidates] = useState<HanjaRecord[]>([]);
  const [searchingCustom, setSearchingCustom] = useState(false);

  const surnames = repoMeta?.surnames || [];
  const disambiguationNotes = repoMeta?.disambiguationNotes || [];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return surnames;
    return surnames.filter(
      (s) =>
        s.hangul.includes(q) ||
        s.hanja.includes(q) ||
        s.dictionaryGloss.includes(q) ||
        s.romanizationRuleForm.toLowerCase().includes(q.toLowerCase())
    );
  }, [surnames, query]);

  const handleSearchCustomHanja = async (reading: string) => {
    const clean = reading.trim();
    if (!clean) {
      setCustomCandidates([]);
      return;
    }
    setSearchingCustom(true);
    try {
      const resp = await fetch(
        `/api/hanja/search?reading=${encodeURIComponent(clean)}&limit=24`
      );
      const data = await resp.json();
      setCustomCandidates(data.items || []);
    } catch {
      setCustomCandidates([]);
    } finally {
      setSearchingCustom(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[92dvh] sm:h-auto sm:max-h-[88vh] bg-[#FBF9F5] border-t sm:border border-[#E7E2D8] rounded-t-2xl sm:rounded-md shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden bg-white pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#D6CEBE] rounded-full mx-auto" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#E7E2D8] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-[#78716C] truncate">
              LUCKYBRIDGE/name · 주요 31대 성씨 및 직접 입력
            </p>
            <h2 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917] mt-0.5">
              성씨(姓氏) 선택 — 한글·한자 구분
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer shrink-0"
            aria-label="성씨 선택 창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Disambiguation Notice */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#E7E2D8] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="성씨 한글(예: 김, 조, 서) 또는 한자(金, 徐) 검색"
                className="w-full pl-9 pr-3 min-h-[44px] sm:min-h-[38px] text-base sm:text-xs border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              className={`px-3.5 min-h-[44px] sm:min-h-[38px] text-xs font-medium border rounded-sm cursor-pointer transition-colors whitespace-nowrap ${
                showCustom
                  ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412]'
                  : 'border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917]'
              }`}
            >
              {showCustom ? '목록으로 돌아가기' : '목록에 없는 성씨 직접 입력'}
            </button>
          </div>

          {disambiguationNotes.length > 0 && !showCustom && (
            <div className="flex items-start gap-2 px-3 py-2 bg-[#FEFCE8] border border-[#FDE68A] rounded-sm text-[11px] text-[#78350F] leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">동음이의 성씨 확인:</span>{' '}
                <strong>조</strong>(趙 14획 / 曺 10획), <strong>유</strong>(柳 9획 / 劉 15획)처럼
                같은 한글이라도 한자 획수가 다르므로 반드시 한자를 구분해 선택하세요.
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {showCustom ? (
            <div className="max-w-xl mx-auto bg-white border border-[#E7E2D8] rounded-md p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="font-serif-kr text-base font-semibold text-[#1C1917]">
                  기타 성씨 직접 검색 · 입력
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                  31대 성씨 외의 성씨(예: 나 羅, 민 閔, 원 元, 천 千)는 한글 독음을 입력해 한자를 찾거나 직접 입력할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-[#1C1917] mb-1">성씨 한글 (1자)</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={customHangul}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCustomHangul(v);
                      void handleSearchCustomHanja(v);
                    }}
                    placeholder="예: 민"
                    className="w-full px-3 min-h-[44px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-[#1C1917] mb-1">성씨 한자 (1자)</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={customHanja}
                    onChange={(e) => setCustomHanja(e.target.value)}
                    placeholder="예: 閔"
                    className="w-full px-3 min-h-[44px] text-base sm:text-sm font-serif-kr border border-[#D6CEBE] rounded-sm bg-[#FBF9F5]"
                  />
                </label>
              </div>

              {searchingCustom ? (
                <div className="text-xs text-[#78716C]">한자 후보를 불러오는 중...</div>
              ) : customCandidates.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[#57534E]">인명용·상용 한자 후보 선택:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {customCandidates.map((item) => (
                      <button
                        key={item.hanja}
                        type="button"
                        onClick={() => setCustomHanja(item.hanja)}
                        className={`text-left p-2.5 min-h-[56px] border rounded-sm cursor-pointer transition-colors ${
                          customHanja === item.hanja
                            ? 'border-[#9A3412] bg-[#FFF7ED]'
                            : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-serif-kr text-lg font-bold text-[#1C1917]">
                            {item.hanja}
                          </span>
                          <span className="text-[11px] font-mono text-[#78716C]">
                            원획 {item.wonhoekStrokes ?? '?'}획
                          </span>
                        </div>
                        <div className="text-[11px] text-[#57534E] truncate mt-0.5">
                          {item.primaryMeaning || item.legalReadings.join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="px-4 min-h-[44px] sm:min-h-[38px] text-xs border border-[#D6CEBE] bg-white rounded-sm cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!customHangul.trim() || !customHanja.trim()}
                  onClick={() => {
                    onSelect(customHangul.trim(), customHanja.trim());
                    onClose();
                  }}
                  className="px-4 min-h-[44px] sm:min-h-[38px] text-xs font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-sm cursor-pointer"
                >
                  이 성씨 적용하기
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {filtered.map((s: NormalizedSurnameProfile) => {
                const isSelected = s.hanja === selectedHanja && s.hangul === selectedHangul;
                return (
                  <button
                    key={s.surnameId}
                    type="button"
                    onClick={() => {
                      onSelect(s.hangul, s.hanja);
                      onClose();
                    }}
                    className={`text-left p-3.5 border rounded-sm transition-colors cursor-pointer space-y-2 min-h-[96px] ${
                      isSelected
                        ? 'border-[#9A3412] bg-[#FFF7ED]'
                        : 'border-[#E7E2D8] bg-white hover:border-[#9A3412]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif-kr text-2xl font-bold text-[#1C1917]">
                          {s.hangul}
                        </span>
                        <span className="font-serif-kr text-xl text-[#57534E]">{s.hanja}</span>
                        <span className="text-[11px] font-mono text-[#78716C]">
                          {s.romanizationRuleForm}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                          {s.rank2015}위
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#9A3412]" />}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#57534E] truncate">{s.dictionaryGloss}</div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E7E2D8]/80 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#78716C]">발음</span>
                        <ElementTag element={s.soundElement} />
                        <span className="text-[#78716C]">
                          · {s.syllableShape === 'CV' ? '받침없음' : '받침있음'}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-[#1C1917]">
                        {s.wonhoekStrokes !== s.technicalTotalStrokes
                          ? `원획 ${s.wonhoekStrokes}/총 ${s.technicalTotalStrokes}획`
                          : `${s.technicalTotalStrokes}획`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
