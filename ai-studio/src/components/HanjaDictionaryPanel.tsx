import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import type { FiveElement, HanjaRecord } from '../types/naming.ts';
import { ElementTag } from './ElementBadge.tsx';
import { StrokeOrderCard } from './StrokeOrderCard.tsx';

export function HanjaDictionaryPanel() {
  const [reading, setReading] = useState('우');
  const [query, setQuery] = useState('');
  const [element, setElement] = useState<FiveElement | ''>('');
  const [popularOnly, setPopularOnly] = useState(false);
  const [excludeTaboo, setExcludeTaboo] = useState(true);
  const [items, setItems] = useState<HanjaRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<HanjaRecord | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  const searchHanja = async (overrides?: { reading?: string; query?: string }) => {
    setLoading(true);
    try {
      const rVal = overrides?.reading !== undefined ? overrides.reading : reading;
      const qVal = overrides?.query !== undefined ? overrides.query : query;
      const params = new URLSearchParams();
      if (rVal.trim()) params.set('reading', rVal.trim());
      if (qVal.trim()) params.set('q', qVal.trim());
      if (element) params.set('element', element);
      if (popularOnly) params.set('popularOnly', 'true');
      if (excludeTaboo) params.set('excludeTaboo', 'true');
      params.set('limit', '90');

      const resp = await fetch(`/api/hanja/search?${params.toString()}`);
      const data = await resp.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      if (data.items?.length > 0) {
        setSelected(data.items[0]);
      } else {
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void searchHanja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popularOnly, excludeTaboo, element]);

  const handleSelectItem = (item: HanjaRecord) => {
    setSelected(item);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* Left: Search & Result Table / Mobile Cards (8 cols) */}
      <div className="lg:col-span-8 border border-[#E7E2D8] bg-white rounded-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E7E2D8] bg-[#FBF9F5] space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-serif-kr text-lg sm:text-xl font-semibold text-[#1C1917]">
                대법원 인명용 한자 · 획순 사전 (9,460자)
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                자주 쓰는 인명 한자가 우선 정렬되며, 독음·뜻·자원오행으로 바로 찾을 수 있습니다.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#57534E]">
              검색 결과 {total.toLocaleString()}자
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input
              type="text"
              maxLength={2}
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void searchHanja()}
              placeholder="독음 (예: 우)"
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-white focus:outline-none focus:border-[#9A3412]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void searchHanja()}
              placeholder="한자 또는 뜻 (빛, 지혜)"
              className="sm:col-span-2 px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-white focus:outline-none focus:border-[#9A3412]"
            />
            <select
              value={element}
              onChange={(e) => setElement(e.target.value as FiveElement | '')}
              className="px-2.5 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-white focus:outline-none focus:border-[#9A3412]"
            >
              <option value="">전체 자원오행</option>
              <option value="목">木 목</option>
              <option value="화">火 화</option>
              <option value="토">土 토</option>
              <option value="금">金 금</option>
              <option value="수">水 수</option>
            </select>
            <button
              type="button"
              onClick={() => void searchHanja()}
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-[38px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              조회
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#57534E]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
              <span className="text-[#78716C] shrink-0 mr-0.5">뜻 빠른찾기:</span>
              {['빛', '지혜', '어질', '도울', '맑', '클', '별'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    setReading('');
                    setQuery(kw);
                    void searchHanja({ reading: '', query: kw });
                  }}
                  className={`px-2.5 min-h-[34px] sm:min-h-[26px] border rounded-sm cursor-pointer shrink-0 ${
                    query === kw
                      ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-medium'
                      : 'border-[#E7E2D8] bg-white hover:bg-[#F4EFE6]'
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                <input
                  type="checkbox"
                  checked={popularOnly}
                  onChange={(e) => setPopularOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#9A3412]"
                />
                자주 쓰는 인명한자만
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                <input
                  type="checkbox"
                  checked={excludeTaboo}
                  onChange={(e) => setExcludeTaboo(e.target.checked)}
                  className="w-4 h-4 accent-[#9A3412]"
                />
                전통 불용참고 숨기기
              </label>
            </div>
          </div>
        </div>

        <div className="max-h-[460px] lg:max-h-[540px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#78716C]">데이터를 불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78716C]">
              조건에 맞는 인명용 한자가 없습니다.
            </div>
          ) : (
            <>
              {/* Mobile Cards (< md) */}
              <div className="md:hidden divide-y divide-[#E7E2D8]">
                {items.map((item) => {
                  const active = selected?.hanja === item.hanja;
                  return (
                    <button
                      key={`mob-${item.hanja}`}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 cursor-pointer min-h-[72px] ${
                        active ? 'bg-[#FFF7ED]' : 'hover:bg-[#FBF9F5]'
                      }`}
                    >
                      <div className="w-11 h-11 shrink-0 border border-[#E7E2D8] bg-[#FBF9F5] rounded-sm flex items-center justify-center font-serif-kr text-2xl font-bold text-[#1C1917]">
                        {item.hanja}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-[#1C1917] truncate">
                            {item.legalReadings.join(' · ')}
                            {item.isPopularNaming && (
                              <span className="ml-1.5 font-medium text-[#14532D]">· 선호</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <ElementTag element={item.resourceElement} />
                            <span className="text-[11px] font-mono tabular-nums text-[#57534E]">
                              {item.wonhoekStrokes ?? '?'}획
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#57534E] leading-snug">
                          {item.primaryMeaning || 'libhangul 미매칭'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <table className="hidden md:table w-full text-xs text-left">
                <thead className="bg-[#FBF9F5] border-b border-[#E7E2D8] text-[#57534E] sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-medium">한자</th>
                    <th className="py-2 px-3 font-medium">법정 독음</th>
                    <th className="py-2 px-3 font-medium">사전 훈음 (전체 뜻)</th>
                    <th className="py-2 px-3 font-medium">원획 / 기술</th>
                    <th className="py-2 px-3 font-medium">자원오행</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D8]">
                  {items.map((item) => {
                    const active = selected?.hanja === item.hanja;
                    return (
                      <tr
                        key={item.hanja}
                        onClick={() => handleSelectItem(item)}
                        className={`cursor-pointer transition-colors ${
                          active ? 'bg-[#FFF7ED]' : 'hover:bg-[#FBF9F5]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-serif-kr text-xl font-bold text-[#1C1917] whitespace-nowrap">
                          {item.hanja}
                          {item.isPopularNaming && (
                            <span className="ml-1.5 font-sans text-[11px] font-medium text-[#14532D] align-middle">
                              · 선호
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#1C1917] whitespace-nowrap">
                          {item.legalReadings.join(' · ')}
                        </td>
                        <td className="py-2.5 px-3 text-[#57534E] leading-relaxed">
                          {item.primaryMeaning || 'libhangul 미매칭'}
                          {item.tabooWarning && (
                            <span className="block text-[10px] text-[#9A3412]">
                              참고: {item.tabooWarning}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-[#57534E] whitespace-nowrap">
                          {item.wonhoekStrokes ?? '?'}획
                          {item.wonhoekEstimated ? '(보정)' : ''} / {item.unihanTotalStrokes ?? '?'}획
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <ElementTag element={item.resourceElement} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Right: Hanja & Stroke Order Inspector (4 cols) */}
      <div
        ref={inspectorRef}
        className="lg:col-span-4 border border-[#E7E2D8] bg-white rounded-md p-4 sm:p-5 space-y-4 scroll-mt-4"
      >
        {!selected ? (
          <div className="py-12 text-center text-xs text-[#78716C]">
            한자를 클릭하면 획순과 다중의미·세부 메타데이터를 확인할 수 있습니다.
          </div>
        ) : (
          <>
            <StrokeOrderCard
              hanja={selected.hanja}
              hangul={selected.legalReadings[0]}
              meaning={selected.primaryMeaning || '사전 훈음 미매칭'}
              wonhoekStrokes={selected.wonhoekStrokes}
              unihanStrokes={selected.unihanTotalStrokes}
              wonhoekEstimated={selected.wonhoekEstimated}
              radicalNo={selected.kangxiRadicalNo}
            />

            {/* Reading-by-Reading Multi-Sense Breakdown */}
            {selected.sensesByReading && Object.keys(selected.sensesByReading).length > 0 && (
              <div className="space-y-2 text-xs border-t border-[#E7E2D8] pt-3">
                <div className="font-semibold text-[#1C1917]">
                  독음별 다중의미 (사전 분해 기준)
                </div>
                <div className="space-y-2">
                  {Object.entries(selected.sensesByReading).map(([rd, senses]) => (
                    <div
                      key={rd}
                      className="p-2.5 bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm space-y-1"
                    >
                      <div className="font-medium text-[#1C1917]">독음 &apos;{rd}&apos;</div>
                      <ul className="space-y-1 text-[11px] text-[#57534E]">
                        {senses.map((s) => (
                          <li key={s.senseId} className="leading-snug">
                            <span className="font-mono text-[#78716C] mr-1">{s.senseOrder}.</span>
                            <span className={s.concernLevel ? 'text-[#9A3412] font-medium' : ''}>
                              {s.rawSense}
                            </span>
                            {s.editorialGloss && (
                              <span className="block text-[#14532D] pl-3 mt-0.5">
                                → {s.editorialGloss}
                              </span>
                            )}
                            {s.concernNote && (
                              <span className="flex items-start gap-1 text-[#9A3412] pl-3 mt-0.5">
                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                {s.concernNote}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs border-t border-[#E7E2D8] pt-3">
              <div className="flex justify-between">
                <span className="text-[#78716C]">유니코드</span>
                <span className="font-mono text-[#1C1917]">{selected.codepoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">허용 독음</span>
                <span className="text-[#1C1917]">{selected.legalReadings.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#78716C]">자원오행 참고</span>
                <ElementTag element={selected.resourceElement} />
              </div>
              <div className="text-[11px] text-[#78716C] pt-1 leading-relaxed">
                {selected.resourceElementBasis} · {selected.strokeDataStatus}
              </div>
              <div className="text-[11px] text-[#57534E] bg-[#FBF9F5] border border-[#E7E2D8] p-2.5 rounded-sm leading-relaxed">
                <strong>획수가 2가지인 이유:</strong> 성명학 수리 계산에는 부수의 원래 형태 획수인{' '}
                <strong>원획</strong>(예: 氵는 水=4획, 艹는 艸=6획)을 쓰고, 필기·검색 기준에는{' '}
                <strong>기술총획</strong>(눈에 보이는 획수)을 씁니다.
              </div>
              <div className="text-[11px] text-[#57534E] bg-[#FBF9F5] border border-[#E7E2D8] p-2.5 rounded-sm">
                법적 상태: {selected.legalDataStatus} (출생·개명 신고 전 대법원 공식 조회 재확인 필요)
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
