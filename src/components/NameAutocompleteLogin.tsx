"use client";

import { useActionState, useMemo, useState } from "react";
import type { LoginState } from "@/app/actions";
import { unlockForLogin } from "@/lib/muck-song";

type MemberOption = { id: string; name: string; is_admin: boolean; has_password: boolean };

export function NameAutocompleteLogin({
  members,
  action,
}: {
  members: MemberOption[];
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberOption | null>(null);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(action, null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    return members.filter((m) => m.name.includes(q)).slice(0, 8);
  }, [query, members]);

  const needsPassword = selected?.is_admin && selected.has_password;

  return (
    <form action={formAction} onSubmit={unlockForLogin} className="flex flex-col gap-3">
      <input
        type="text"
        inputMode="text"
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        placeholder="이름을 입력하세요"
        autoComplete="off"
        className="w-full rounded-2xl border-2 border-sand bg-white px-5 py-4 text-center text-xl font-bold outline-none focus:border-fairway"
      />

      {!selected && suggestions.length > 0 && (
        <div className="card flex flex-col gap-1 !p-2">
          {suggestions.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => {
                setSelected(m);
                setQuery("");
              }}
              className="rounded-xl px-4 py-3 text-left text-lg font-semibold hover:bg-sand/40"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {!selected && query.trim() && suggestions.length === 0 && (
        <p className="text-center text-sm text-foreground/60">
          일치하는 이름이 없어요. 등록된 이름으로 다시 입력해주세요.
        </p>
      )}

      {needsPassword && (
        <input
          type="password"
          name="password"
          placeholder="관리자 비밀번호"
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-2xl border-2 border-sand bg-white px-5 py-4 text-center text-xl font-bold outline-none focus:border-fairway"
        />
      )}

      {state?.error && (
        <p className="text-center text-sm font-semibold text-danger">{state.error}</p>
      )}

      <input type="hidden" name="memberId" value={selected?.id ?? ""} />
      <button type="submit" className="btn btn-primary w-full" disabled={!selected || pending}>
        {!selected
          ? "이름을 선택해주세요"
          : pending
            ? "확인 중..."
            : `${selected.name}(으)로 입장하기`}
      </button>
    </form>
  );
}
