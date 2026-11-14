import { useEffect, useState } from 'react';
import { AlertCircle, Check, Search, Sparkles, X } from 'lucide-react';
import type { FiveElement, HanjaRecord, SajuAnalysisResult } from '../types/naming.ts';
import { ElementTag } from './ElementBadge.tsx';

export type HanjaPickerMode =
  | 'slot1'
  | 'slot2'
  | 'preferred'
  | 'manual1'
  | 'manual2'
  | 'current1'
  | 'current2';

interface HanjaPickerModalProps {
  open: boolean;
  mode: HanjaPickerMode;
  initialReading?: string;
  selectedHanja?: string;
  preferredHanjaList?: string[];
  sajuResult: SajuAnalysisResult | null;
  onClose: () => void;
  onSelectSingle: (item: HanjaRecord, readingUsed: string) => void;
  onTogglePreferred?: (hanja: string) => void;
}

const QUICK_READINGS = ['', '우', '윤', '지', '준', '현', '민', '하', '서', '율', '온', '연', '진', '영', '태'];

const MEANING_THEMES: Array<{ label: string; keyword: string }> = [
  { label: '빛 · 밝음', keyword: '빛' },
  { label: '지혜 · 슬기', keyword: '지혜' },
  { label: '어질 · 덕', keyword: '어질' },
  { label: '복 · 도울', keyword: '도울' },
  { label: '맑음 · 윤택', keyword: '맑' },
  { label: '넓음 · 큰', keyword: '클' },
  { label: '하늘 · 별', keyword: '별' },
  { label: '나무 · 풀', keyword: '나무' },
];

const ALL_ELEMENTS: FiveElement[] = ['목', '화', '토', '금', '수'];

const MODE_LABELS: Record<HanjaPickerMode, { title: string; subtitle: string }> = {
  slot1: {
    title: '이름 첫째 글자 한자 고르기',
    subtitle: '원하는 한자를 누르면 첫째 자리에 바로 고정됩니다.',
  },
  slot2: {
    title: '이름 둘째 글자 한자 고르기',
    subtitle: '원하는 한자를 누르면 둘째 자리에 바로 고정됩니다.',
  },
  preferred: {
    title: '최대한 넣고 싶은 한자 고르기 (자리 무관)',
    subtitle: '여러 개를 눌러 담으면 앞·뒤 상관없이 해당 한자가 포함된 이름을 우선 추천합니다.',
  },
  manual1: {
    title: '직접 조합 · 첫째 글자 한자 고르기',
    subtitle: '선택한 한자와 독음이 첫째 글자 칸에 바로 입력됩니다.',
  },
  manual2: {
    title: '직접 조합 · 둘째 글자 한자 고르기',
    subtitle: '선택한 한자와 독음이 둘째 글자 칸에 바로 입력됩니다.',
  },
  current1: {
    title: '기존 이름 · 첫째 글자 한자 고르기',
    subtitle: '개명 전 이름의 첫째 글자 한자를 선택하세요.',
  },
  current2: {
    title: '기존 이름 · 둘째 글자 한자 고르기',
    subtitle: '개명 전 이름의 둘째 글자 한자를 선택하세요.',
  },
};

export function HanjaPickerModal({
  open,
  mode,
  initialReading = '',
  selectedHanja = '',
  preferredHanjaList = [],
  sajuResult,
  onClose,
  onSelectSingle,
  onTogglePreferred,
}: HanjaPickerModalProps) {
  const [reading, setReading] = useState(initialReading);
  const [query, setQuery] = useState('');
  const [element, setElement] = useState<FiveElement | ''>('');
  const [popularOnly, setPopularOnly] = useState(false);
  const [excludeTaboo, setExcludeTaboo] = useState(true);
  const [items, setItems] = useState<HanjaRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReading(initialReading);
    setQuery('');
    setElement('');
  }, [open, initialReading, mode]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (reading.trim()) params.set('reading', reading.trim());
        if (query.trim()) params.set('q', query.trim());
        if (element) params.set('element', element);
        if (popularOnly) params.set('popularOnly', 'true');
        if (excludeTaboo) params.set('excludeTaboo', 'true');
        params.set('limit', '90');

        const resp = await fetch(`/api/hanja/search?${params.toString()}`);
        const data = await resp.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch {
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [open, reading, query, element, popularOnly, excludeTaboo]);

  if (!open) return null;

  const yongsinSet = new Set(sajuResult?.eokbuYongsinCandidates ?? []);
  const headerInfo = MODE_LABELS[mode];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[93dvh] sm:h-auto sm:max-h-[90vh] bg-[#FBF9F5] border-t sm:border border-[#D6CEBE] rounded-t-2xl sm:rounded-md shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden bg-white pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#D6CEBE] rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-white border-b border-[#E7E2D8] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif-kr text-base sm:text-lg font-bold text-[#1C1917] truncate">
              {headerInfo.title}
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5 line-clamp-1 sm:line-clamp-none">
              {headerInfo.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#57534E] hover:text-[#1C1917] hover:bg-[#F4EFE6] rounded-sm cursor-pointer shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 sm:p-4 sm:px-5 bg-white border-b border-[#E7E2D8] space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-3 relative">
              <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                한글 독음 (소리)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={1}
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder="예: 우 (전체=비움)"
                  className="w-full px-3 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                />
                {reading && (
                  <button
                    type="button"
                    onClick={() => setReading('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    aria-label="독음 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-6 relative">
              <label className="block text-[11px] font-medium text-[#57534E] mb-1">
                한자 뜻 또는 한자 직접 검색
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#78716C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="예: 빛, 지혜, 복 또는 한자(宇)"
                  className="w-full pl-8 pr-8 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm border border-[#D6CEBE] rounded-sm bg-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-3 flex flex-col justify-end">
              <div className="text-[11px] text-[#78716C] mb-1">
                검색 결과 <strong className="text-[#1C1917] font-mono">{total.toLocaleString()}</strong>자
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#57534E]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                  <input
                    type="checkbox"
                    checked={popularOnly}
                    onChange={(e) => setPopularOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#9A3412]"
                  />
                  자주 쓰는 한자만
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                  <input
                    type="checkbox"
                    checked={excludeTaboo}
                    onChange={(e) => setExcludeTaboo(e.target.checked)}
                    className="w-4 h-4 accent-[#9A3412]"
                  />
                  불용참고 제외
                </label>
              </div>
            </div>
          </div>

          {/* Quick Readings (horizontal scroll friendly on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-[#78716C] shrink-0 mr-0.5">인기 음:</span>
            {QUICK_READINGS.map((r) => (
              <button
                key={r || 'all'}
                type="button"
                onClick={() => setReading(r)}
                className={`px-2.5 min-h-[36px] sm:min-h-[28px] border rounded-sm cursor-pointer transition-colors shrink-0 ${
                  reading === r
                    ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-semibold'
                    : 'border-[#E7E2D8] bg-[#FBF9F5] text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {r || '전체'}
              </button>
            ))}
          </div>

          {/* Meaning Themes & Element Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
              <span className="text-[#78716C] shrink-0 mr-0.5">뜻 테마:</span>
              {MEANING_THEMES.map((t) => (
                <button
                  key={t.keyword}
                  type="button"
                  onClick={() => {
                    setReading('');
                    setQuery(t.keyword);
                  }}
                  className={`px-2.5 min-h-[34px] sm:min-h-[26px] border rounded-sm cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                    query === t.keyword
                      ? 'border-[#1C1917] bg-[#1C1917] text-white'
                      : 'border-[#E7E2D8] bg-[#FBF9F5] text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              <span className="text-[#78716C] shrink-0 mr-0.5">자원오행:</span>
              <button
                type="button"
                onClick={() => setElement('')}
                className={`px-2.5 min-h-[34px] sm:min-h-[26px] border rounded-sm cursor-pointer shrink-0 ${
                  element === ''
                    ? 'border-[#1C1917] bg-[#1C1917] text-white'
                    : 'border-[#E7E2D8] bg-[#FBF9F5] text-[#57534E]'
                }`}
              >
                전체
              </button>
              {ALL_ELEMENTS.map((el) => {
                const isYongsin = yongsinSet.has(el);
                return (
                  <button
                    key={el}
                    type="button"
                    onClick={() => setElement(element === el ? '' : el)}
                    className={`px-2.5 min-h-[34px] sm:min-h-[26px] border rounded-sm cursor-pointer inline-flex items-center gap-1 shrink-0 ${
                      element === el
                        ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412] font-semibold'
                        : isYongsin
                          ? 'border-[#9A3412]/40 bg-[#FFF7ED]/50 text-[#1C1917]'
                          : 'border-[#E7E2D8] bg-[#FBF9F5] text-[#57534E]'
                    }`}
                  >
                    {el}
                    {isYongsin && <Sparkles className="w-2.5 h-2.5 text-[#9A3412]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#78716C]">
              대법원 인명용 한자 사전에서 찾는 중...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-medium text-[#1C1917]">조건에 맞는 한자가 없습니다.</p>
              <p className="text-xs text-[#78716C]">
                '자주 쓰는 한자만' 체크를 해제하거나 검색어를 줄여 다시 확인해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {items.map((item) => {
                const isSelected =
                  mode === 'preferred'
                    ? preferredHanjaList.includes(item.hanja)
                    : selectedHanja === item.hanja;
                const displayReading =
                  reading.trim() && item.legalReadings.includes(reading.trim())
                    ? reading.trim()
                    : item.legalReadings[0] || '';
                const readingSenses = item.sensesByReading?.[displayReading];
                const curatedPositive = readingSenses?.find((s) => s.recommendedForName && s.editorialGloss);
                const cautionSense = readingSenses?.find(
                  (s) => s.concernLevel === 'medium' || s.concernLevel === 'high'
                );
                const meaningForReading =
                  (displayReading && item.meaningByReading[displayReading]?.join(', ')) ||
                  item.primaryMeaning ||
                  '사전 훈음 미매칭';
                const strokesDiff =
                  item.wonhoekStrokes !== null &&
                  item.unihanTotalStrokes !== null &&
                  item.wonhoekStrokes !== item.unihanTotalStrokes;

                return (
                  <button
                    key={item.hanja}
                    type="button"
                    onClick={() => {
                      if (mode === 'preferred' && onTogglePreferred) {
                        onTogglePreferred(item.hanja);
                      } else {
                        onSelectSingle(item, displayReading);
                      }
                    }}
                    className={`text-left p-3.5 rounded-sm border transition-colors cursor-pointer flex items-start gap-3 min-h-[92px] ${
                      isSelected
                        ? 'border-[#9A3412] bg-[#FFF7ED]'
                        : 'border-[#E7E2D8] bg-white hover:border-[#9A3412]/50 hover:bg-[#FFFDF9]'
                    }`}
                  >
                    <div className="w-12 h-12 shrink-0 rounded-sm bg-[#FBF9F5] border border-[#E7E2D8] flex items-center justify-center font-serif-kr text-3xl font-bold text-[#1C1917]">
                      {item.hanja}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-bold text-[#1C1917] truncate">
                            {item.legalReadings.join(' · ')}
                          </span>
                          {item.isPopularNaming && (
                            <span className="text-[11px] font-medium text-[#14532D] shrink-0">
                              · 자주쓰는
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ElementTag element={item.resourceElement} />
                          {isSelected && <Check className="w-4 h-4 text-[#9A3412]" />}
                        </div>
                      </div>

                      <p className="text-xs text-[#57534E] leading-relaxed break-keep">
                        {meaningForReading}
                      </p>

                      {curatedPositive?.editorialGloss && (
                        <p className="text-[11px] text-[#14532D] leading-snug">
                          작명 뜻: {curatedPositive.editorialGloss}
                        </p>
                      )}

                      {cautionSense && (
                        <p className="text-[11px] text-[#9A3412] flex items-center gap-1 leading-snug">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          다중의미 참고: &apos;{cautionSense.rawSense}&apos; 뜻 포함
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#78716C] pt-0.5">
                        <span>
                          원획 {item.wonhoekStrokes ?? '?'}획
                          {strokesDiff ? ` (기술 ${item.unihanTotalStrokes}획)` : ''}
                        </span>
                        {item.tabooWarning && (
                          <span className="font-sans text-[11px] text-[#9A3412]">불용참고</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-[#E7E2D8] flex items-center justify-between gap-3 pb-safe">
          <div className="text-xs text-[#57534E] min-w-0 truncate">
            {mode === 'preferred' ? (
              <>
                우선 포함:{' '}
                <strong className="text-[#9A3412]">
                  {preferredHanjaList.length > 0 ? preferredHanjaList.join(' · ') : '없음'}
                </strong>
              </>
            ) : (
              '원하는 한자를 누르면 바로 적용됩니다.'
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-white bg-[#1C1917] hover:bg-[#292524] rounded-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            {mode === 'preferred' ? '선택 완료' : '닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
