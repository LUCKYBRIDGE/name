import type { FiveElement, LuckGrade } from '../types/naming.ts';

export const ELEMENT_META: Record<
  FiveElement,
  { hanja: string; label: string; textClass: string; bgClass: string; borderClass: string; barColor: string }
> = {
  목: {
    hanja: '木',
    label: '木 목',
    textClass: 'text-[#14532D]',
    bgClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
    barColor: 'bg-[#15803D]',
  },
  화: {
    hanja: '火',
    label: '火 화',
    textClass: 'text-[#9A3412]',
    bgClass: 'bg-[#FFF7ED]',
    borderClass: 'border-[#FED7AA]',
    barColor: 'bg-[#C2410C]',
  },
  토: {
    hanja: '土',
    label: '土 토',
    textClass: 'text-[#78350F]',
    bgClass: 'bg-[#FEFCE8]',
    borderClass: 'border-[#FDE68A]',
    barColor: 'bg-[#B45309]',
  },
  금: {
    hanja: '金',
    label: '金 금',
    textClass: 'text-[#3F3F46]',
    bgClass: 'bg-[#F4F4F5]',
    borderClass: 'border-[#D4D4D8]',
    barColor: 'bg-[#52525B]',
  },
  수: {
    hanja: '水',
    label: '水 수',
    textClass: 'text-[#1E3A8A]',
    bgClass: 'bg-[#EFF6FF]',
    borderClass: 'border-[#BFDBFE]',
    barColor: 'bg-[#1D4ED8]',
  },
};

export function ElementTag({ element }: { element: FiveElement | null | undefined }) {
  if (!element) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-stone-500 border border-[#E7E2D8] bg-[#FBF9F5] rounded-sm whitespace-nowrap">
        미분류
      </span>
    );
  }
  const meta = ELEMENT_META[element];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium border rounded-sm whitespace-nowrap ${meta.textClass} ${meta.bgClass} ${meta.borderClass}`}
    >
      {meta.label}
    </span>
  );
}

export function LuckGradeText({ grade }: { grade: LuckGrade }) {
  const colorMap: Record<LuckGrade, string> = {
    대길: 'text-[#14532D] font-semibold',
    길: 'text-[#1E3A8A] font-semibold',
    반길반흉: 'text-[#78350F] font-medium',
    흉: 'text-[#9A3412] font-semibold',
  };
  return <span className={`text-xs whitespace-nowrap ${colorMap[grade]}`}>{grade}</span>;
}
