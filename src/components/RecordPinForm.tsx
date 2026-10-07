"use client";

import { useActionState } from "react";
import type { PinState } from "@/app/me/records/actions";

const pinInputClass =
  "rounded-xl border-2 border-sand px-4 py-3 text-center text-2xl tracking-[0.5em]";

export function RecordPinForm({
  mode,
  action,
}: {
  mode: "set" | "unlock";
  action: (prevState: PinState, formData: FormData) => Promise<PinState>;
}) {
  const [state, formAction, pending] = useActionState<PinState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="password"
        name="pin"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        required
        autoFocus
        autoComplete="off"
        placeholder="••••"
        aria-label={mode === "set" ? "새 비밀번호 4자리" : "비밀번호 4자리"}
        className={pinInputClass}
      />
      {mode === "set" && (
        <input
          type="password"
          name="pin_confirm"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          autoComplete="off"
          placeholder="한 번 더"
          aria-label="비밀번호 확인"
          className={pinInputClass}
        />
      )}
      {state?.error && (
        <p className="text-center text-sm font-semibold text-danger">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "확인 중..." : mode === "set" ? "비밀번호 정하고 시작하기" : "기록장 열기"}
      </button>
    </form>
  );
}
