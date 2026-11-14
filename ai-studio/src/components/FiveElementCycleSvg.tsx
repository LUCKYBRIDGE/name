import type { FiveElement } from '../types/naming.ts';

interface FiveElementCycleSvgProps {
  counts: Record<FiveElement, number>;
  dayMasterElement: FiveElement;
  yongsinElements: FiveElement[];
}

const NODE_COORDS: Array<{
  el: FiveElement;
  hanja: string;
  x: number;
  y: number;
  fill: string;
  stroke: string;
  text: string;
}> = [
  { el: '화', hanja: '火', x: 140, y: 36, fill: '#FFF7ED', stroke: '#C2410C', text: '#9A3412' },
  { el: '토', hanja: '土', x: 238, y: 108, fill: '#FEFCE8', stroke: '#B45309', text: '#78350F' },
  { el: '금', hanja: '金', x: 202, y: 214, fill: '#F4F4F5', stroke: '#52525B', text: '#27272A' },
  { el: '수', hanja: '水', x: 78, y: 214, fill: '#EFF6FF', stroke: '#1D4ED8', text: '#1E3A8A' },
  { el: '목', hanja: '木', x: 42, y: 108, fill: '#ECFDF5', stroke: '#15803D', text: '#14532D' },
];

export function FiveElementCycleSvg({
  counts,
  dayMasterElement,
  yongsinElements,
}: FiveElementCycleSvgProps) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 280 256"
        className="w-full max-w-[260px] h-auto"
        role="img"
        aria-label="오행 상생상극 및 사주 분포 도표"
      >
        <defs>
          <marker
            id="arrow-sangsaeng"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#A8A29E" />
          </marker>
        </defs>

        {/* Inner controlling star (상극: dashed light lines) */}
        <g stroke="#E7E2D8" strokeWidth="1" strokeDasharray="3 3">
          <line x1="140" y1="36" x2="202" y2="214" />
          <line x1="202" y1="214" x2="42" y2="108" />
          <line x1="42" y1="108" x2="238" y2="108" />
          <line x1="238" y1="108" x2="78" y2="214" />
          <line x1="78" y1="214" x2="140" y2="36" />
        </g>

        {/* Outer generating pentagon (상생: 木->火->土->金->水->木) */}
        <g stroke="#A8A29E" strokeWidth="1.4" fill="none" markerEnd="url(#arrow-sangsaeng)">
          <line x1="62" y1="90" x2="114" y2="50" />
          <line x1="166" y1="50" x2="218" y2="90" />
          <line x1="231" y1="136" x2="213" y2="186" />
          <line x1="170" y1="214" x2="110" y2="214" />
          <line x1="67" y1="186" x2="49" y2="136" />
        </g>

        {/* Center label */}
        <text
          x="140"
          y="134"
          textAnchor="middle"
          fontSize="10"
          fill="#78716C"
        >
          상생 순환
        </text>
        <text
          x="140"
          y="148"
          textAnchor="middle"
          fontSize="9"
          fill="#A8A29E"
        >
          실선 상생 · 점선 상극
        </text>

        {/* Five Element Nodes */}
        {NODE_COORDS.map((node) => {
          const count = counts[node.el] ?? 0;
          const isDayMaster = dayMasterElement === node.el;
          const isYongsin = yongsinElements.includes(node.el);

          return (
            <g key={node.el} transform={`translate(${node.x}, ${node.y})`}>
              {isYongsin && (
                <circle
                  r="31"
                  fill="none"
                  stroke="#9A3412"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              )}
              <circle
                r="26"
                fill={node.fill}
                stroke={isDayMaster ? '#1C1917' : node.stroke}
                strokeWidth={isDayMaster ? '2.2' : '1.2'}
              />
              <text
                y="-3"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={node.text}
              >
                {node.hanja} {node.el}
              </text>
              <text
                y="13"
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={count === 0 ? '#9A3412' : '#57534E'}
              >
                {count}개
              </text>
              {isDayMaster && (
                <text y="37" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1C1917">
                  일간
                </text>
              )}
              {!isDayMaster && isYongsin && (
                <text y="37" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9A3412">
                  보완추천
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
