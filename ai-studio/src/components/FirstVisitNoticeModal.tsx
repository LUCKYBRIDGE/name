import { useState } from 'react';
import { Info, ShieldAlert, Sparkles, X } from 'lucide-react';

interface FirstVisitNoticeModalProps {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function FirstVisitNoticeModal({ open, onClose }: FirstVisitNoticeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nolsaju-first-notice-title"
      onClick={() => onClose(dontShowAgain)}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90dvh] bg-[#FBF9F5] border-t sm:border border-[#E7E2D8] rounded-t-2xl sm:rounded-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-white">
          <span className="w-10 h-1 rounded-full bg-[#D6CEBE]" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E7E2D8] flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[#9A3412] tracking-wide">
              놀사주 이용 전 안내
            </div>
            <h2
              id="nolsaju-first-notice-title"
              className="font-serif-kr text-lg sm:text-xl font-bold text-[#1C1917] mt-0.5"
            >
              미리보기 환경 및 개인정보·AI 안내
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose(dontShowAgain)}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 flex items-center justify-center text-[#57534E] hover:text-[#1C1917] cursor-pointer"
            aria-label="안내 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs sm:text-[13px] text-[#1C1917] leading-relaxed">
          {/* 1. Preview status */}
          <div className="p-3.5 bg-white border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
              <Info className="w-4 h-4 text-[#9A3412] shrink-0" />
              <span>1. 정식 웹사이트·앱이 아닌 Google AI Studio 미리보기입니다</span>
            </div>
            <p className="text-[#57534E]">
              <strong>놀사주</strong>는 Google AI Studio 미리보기(공유) 기반으로 제공되는 시범·개인용 웹 도구이며,
              정식 상용 서비스나 공식 성명학·법원 기관 사이트가 아닙니다. 미리보기 주소가 변경되거나 일시적으로 중단될 수 있습니다.
            </p>
          </div>

          {/* 2. Quota & billing */}
          <div className="p-3.5 bg-white border border-[#E7E2D8] rounded-sm space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
              <Sparkles className="w-4 h-4 text-[#9A3412] shrink-0" />
              <span>2. 무료 이용 및 AI 사용 한도 안내</span>
            </div>
            <p className="text-[#57534E]">
              사주 계산, 이름 추천, 인명용 한자 검색, 로컬 저장 등 핵심 기능은 AI 호출 없이 바로 작동합니다.
              리포트의 <strong>AI 심층 해설</strong> 기능은 Google AI Studio 공유 환경의 무료 제공 한도(방문자 Google 세션 또는 연동된 API 프로젝트 한도) 내에서 동작하며,{' '}
              <strong>방문자에게 별도 이용 요금이 과금되지 않습니다.</strong> (한도 초과 시 AI 해설만 일시 제한될 수 있습니다.)
            </p>
          </div>

          {/* 3. Storage & Google AI Studio Free Tier training notice */}
          <div className="p-3.5 bg-[#FFF7ED]/70 border border-[#FED7AA] rounded-sm space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#9A3412]">
              <ShieldAlert className="w-4 h-4 text-[#9A3412] shrink-0" />
              <span>3. 개인정보 저장 및 AI 데이터 학습 유의사항</span>
            </div>
            <p className="text-[#57534E]">
              입력하신 이름·생년월일·메모는 놀사주 별도 DB 서버에 수집되거나 저장되지 않고{' '}
              <strong>사용자의 기기 브라우저(로컬 저장소)에만 보관</strong>됩니다.
            </p>
            <p className="text-[#78350F]">
              단, <strong>‘AI 심층 해설’ 버튼을 직접 실행</strong>할 때 AI로 전달되는 요약 내용은 Google AI Studio{' '}
              <strong>무료 등급 정책에 따라 Google의 모델·서비스 개선 및 학습에 활용될 수 있습니다.</strong>{' '}
              민감한 개인 식별 정보는 입력을 삼가거나 AI 해설 호출 없이 기본 분석만 이용해 주세요.
            </p>
          </div>

          {/* 4. Legal disclaimer */}
          <p className="text-[11px] text-[#78716C] px-0.5">
            ※ 본 앱의 성명학 풀이는 참고용이며, 출생·개명 신고 전에는 반드시 대법원 전자가족관계등록시스템에서 최종 인명용 한자 가능 여부를 확인하시기 바랍니다.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-white border-t border-[#E7E2D8] pb-safe flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[32px] text-xs text-[#57534E] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-[#9A3412]"
            />
            다음부터 이 안내 다시 보지 않기
          </label>

          <button
            type="button"
            onClick={() => onClose(dontShowAgain)}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[40px] px-6 py-2 text-sm font-medium text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-sm transition-colors cursor-pointer"
          >
            내용을 확인하고 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
