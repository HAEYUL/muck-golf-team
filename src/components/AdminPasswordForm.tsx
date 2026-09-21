"use client";

import { useActionState } from "react";
import { setAdminPasswordAction, type AdminPasswordState } from "@/app/admin/actions";

export function AdminPasswordForm() {
  const [state, formAction, pending] = useActionState<AdminPasswordState, FormData>(
    setAdminPasswordAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="password"
        name="new_password"
        placeholder="새 비밀번호 (4자 이상)"
        autoComplete="new-password"
        required
        className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
      />
      <input
        type="password"
        name="confirm_password"
        placeholder="새 비밀번호 확인"
        autoComplete="new-password"
        required
        className="rounded-xl border-2 border-sand px-4 py-3 text-lg"
      />
      {state?.error && <p className="text-sm font-semibold text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm font-semibold text-fairway">{state.success}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "저장 중..." : "비밀번호 저장"}
      </button>
    </form>
  );
}
