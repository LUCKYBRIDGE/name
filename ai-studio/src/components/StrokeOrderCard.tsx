import { useEffect, useId, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Play, RotateCcw, PenTool } from 'lucide-react';

interface StrokeOrderCardProps {
  hanja: string;
  hangul?: string;
  meaning?: string;
  wonhoekStrokes?: number | null;
  unihanStrokes?: number | null;
  wonhoekEstimated?: boolean;
  radicalNo?: number | null;
  compact?: boolean;
}

export function StrokeOrderCard({
  hanja,
  hangul,
  meaning,
  wonhoekStrokes,
  unihanStrokes,
  wonhoekEstimated,
  radicalNo,
  compact = false,
}: StrokeOrderCardProps) {
  const containerId = useId().replace(/:/g, '_');
  const writerRef = useRef<HanziWriter | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [quizMode, setQuizMode] = useState(false);

  const size = compact ? 96 : 128;

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
    writerRef.current = null;
    setQuizMode(false);

    if (!hanja || hanja === '?') {
      setStatus('fallback');
      return;
    }

    setStatus('loading');
    let cancelled = false;

    try {
      const writer = HanziWriter.create(containerId, hanja, {
        width: size,
        height: size,
        padding: 8,
        showOutline: true,
        strokeColor: '#1C1917',
        outlineColor: '#D6CEBE',
        radicalColor: '#9A3412',
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 180,
        onLoadCharDataSuccess: () => {
          if (!cancelled) setStatus('ready');
        },
        onLoadCharDataError: () => {
          if (!cancelled) setStatus('fallback');
        },
      });
      writerRef.current = writer;
    } catch {
      setStatus('fallback');
    }

    return () => {
      cancelled = true;
      writerRef.current = null;
    };
  }, [hanja, containerId, size]);

  const handleAnimate = () => {
    if (!writerRef.current) return;
    setQuizMode(false);
    writerRef.current.cancelQuiz();
    writerRef.current.showCharacter();
    writerRef.current.animateCharacter();
  };

  const handleQuiz = () => {
    if (!writerRef.current) return;
    setQuizMode(true);
    writerRef.current.quiz({
      onComplete: () => {
        setQuizMode(false);
      },
    });
  };

  const handleReset = () => {
    if (!writerRef.current) return;
    setQuizMode(false);
    writerRef.current.cancelQuiz();
    writerRef.current.showCharacter();
  };

  return (
    <div className="border border-[#E7E2D8] bg-white rounded-md p-3 flex flex-col items-center gap-2">
      <div
        className="relative bg-[#FBF9F5] border border-[#E7E2D8] rounded-sm flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Calligraphy rice-grid crosshairs */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <line x1="50" y1="0" x2="50" y2="100" stroke="#E7E2D8" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#E7E2D8" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="0" y1="0" x2="100" y2="100" stroke="#EFECE4" strokeWidth="0.6" strokeDasharray="2 3" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#EFECE4" strokeWidth="0.6" strokeDasharray="2 3" />
        </svg>

        <div
          id={containerId}
          className={status === 'fallback' ? 'hidden' : 'relative z-10'}
        />

        {status === 'fallback' && (
          <span className="relative z-10 font-serif-kr text-5xl text-[#1C1917] select-none">
            {hanja || '?'}
          </span>
        )}
      </div>

      <div className="text-center w-full">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="font-serif-kr text-lg font-semibold text-[#1C1917]">{hanja || '?'}</span>
          {hangul && <span className="text-sm font-medium text-[#57534E]">{hangul}</span>}
        </div>
        {meaning && (
          <p className="text-xs text-[#57534E] truncate max-w-[160px] mx-auto" title={meaning}>
            {meaning}
          </p>
        )}
        <div className="mt-1 text-[11px] font-mono tabular-nums text-[#78716C]">
          {wonhoekStrokes !== undefined && wonhoekStrokes !== null ? (
            <span>
              원획 {wonhoekStrokes}획{wonhoekEstimated ? '(부수보정)' : ''}
              {unihanStrokes !== null && unihanStrokes !== undefined && unihanStrokes !== wonhoekStrokes
                ? ` / 기술 ${unihanStrokes}획`
                : ''}
            </span>
          ) : unihanStrokes !== undefined && unihanStrokes !== null ? (
            <span>기술 {unihanStrokes}획</span>
          ) : (
            <span>획수 미확인</span>
          )}
          {radicalNo ? ` · 부수 #${radicalNo}` : ''}
        </div>
      </div>

      {status === 'ready' && (
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleAnimate}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917] rounded-sm transition-colors cursor-pointer whitespace-nowrap"
            title="획순 애니메이션 재생"
          >
            <Play className="w-3 h-3 text-[#9A3412]" />
            획순 재생
          </button>
          {!compact && (
            <button
              type="button"
              onClick={quizMode ? handleReset : handleQuiz}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                quizMode
                  ? 'border-[#9A3412] bg-[#FFF7ED] text-[#9A3412]'
                  : 'border-[#E7E2D8] bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#1C1917]'
              }`}
              title="직접 획순 따라 쓰기"
            >
              {quizMode ? (
                <>
                  <RotateCcw className="w-3 h-3" />
                  초기화
                </>
              ) : (
                <>
                  <PenTool className="w-3 h-3 text-[#57534E]" />
                  따라쓰기
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
