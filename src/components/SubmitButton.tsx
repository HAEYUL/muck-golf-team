"use client";

import { useFormStatus } from "react-dom";

/** 폼 제출 버튼. 서버 처리 중에는 "처리 중…"으로 바뀌고 잠겨서 두 번 눌리지 않는다 */
export function SubmitButton({
  pendingText = "처리 중…",
  children,
  disabled,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  /** 처리 중에 보여줄 글자. 작은 버튼은 ""로 두면 동그라미만 돈다 */
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
