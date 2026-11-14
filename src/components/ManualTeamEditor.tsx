"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { goBack } from "@/lib/navigation";
import { TEAM_THEMES } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

/** 한 조의 최대 인원 (골프 한 팀 = 4명) */
const MAX_PER_TEAM = 4;
const ABSENT = "absent";

type Slot = string; // "1"~"4" 또는 "absent"

interface Person {
  /** 기존 회원은 회원 id, 새로 입력한 게스트는 "new:이름" */
  key: string;
  name: string;
  slot: Slot;
  isNew?: boolean;
}

/**
 * 수동 팀 편성/수정 화면.
 * - 이름을 누르면 선택되고, 아래 버튼으로 다른 조로 옮기거나 불참 처리할 수 있다.
 * - 이름을 하나 고른 뒤 다른 조(또는 불참 칸)의 이름을 누르면 두 사람 자리가 맞바뀐다.
 * - "인원 추가"로 참가하지 않은 회원이나 새 게스트를 대타로 넣을 수 있다.
 */
export function ManualTeamEditor({
  roundId,
  initial,
  candidates,
  action,
  fallbackHref,
}: {
  roundId: string;
  initial: { id: string; name: string; team: string }[];
  /** 현재 참가하지 않는 회원 (대타로 추가할 수 있는 사람) */
  candidates: { id: string; name: string; isGuest: boolean }[];
  action: (formData: FormData) => Promise<void>;
  fallbackHref: string;
}) {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>(() =>
    initial.map((p) => ({ key: p.id, name: p.name, slot: p.team }))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addMemberId, setAddMemberId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [addTeam, setAddTeam] = useState("1");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of people) c[p.slot] = (c[p.slot] ?? 0) + 1;
    return c;
  }, [people]);

  const playing = people.filter((p) => p.slot !== ABSENT).length;
  const neededTeams = Math.max(1, Math.ceil(playing / MAX_PER_TEAM));
  const visibleTeams = TEAM_THEMES.filter(
    (t) => t.no <= neededTeams || (counts[String(t.no)] ?? 0) > 0
  );
  const absentPeople = people.filter((p) => p.slot === ABSENT);
  const selectedPerson = people.find((p) => p.key === selected) ?? null;

  // 인원 확인: 4명 초과 조, 인원 차이가 2명 이상인 경우 경고
  const usedCounts = visibleTeams.map((t) => counts[String(t.no)] ?? 0);
  const warnings: string[] = [];
  visibleTeams.forEach((t) => {
    const n = counts[String(t.no)] ?? 0;
    if (n > MAX_PER_TEAM) warnings.push(`${t.name}가 ${n}명이에요 (최대 ${MAX_PER_TEAM}명).`);
    if (n === 0) warnings.push(`${t.name}에 아무도 없어요.`);
  });
  const nonEmpty = usedCounts.filter((n) => n > 0);
  if (nonEmpty.length > 1 && Math.max(...nonEmpty) - Math.min(...nonEmpty) >= 2) {
    warnings.push("조별 인원 차이가 2명 이상이에요.");
  }
  const summary = visibleTeams
    .map((t) => `${t.name} ${counts[String(t.no)] ?? 0}명`)
    .join(" / ");

  const usedKeys = new Set(people.map((p) => p.key));
  const availableCandidates = candidates.filter((c) => !usedKeys.has(c.id));

  function tapPerson(key: string) {
    if (!selected) return setSelected(key);
    if (selected === key) return setSelected(null);
    const a = people.find((p) => p.key === selected);
    const b = people.find((p) => p.key === key);
    if (!a || !b) return setSelected(key);
    if (a.slot === b.slot) return setSelected(key); // 같은 조끼리는 맞바꿀 필요 없음 → 선택만 바꾼다
    setPeople((prev) =>
      prev.map((p) =>
        p.key === a.key ? { ...p, slot: b.slot } : p.key === b.key ? { ...p, slot: a.slot } : p
      )
    );
    setSelected(null);
  }

  function moveSelected(slot: Slot) {
    if (!selected) return;
    setPeople((prev) => {
      const target = prev.find((p) => p.key === selected);
      // 새로 추가한 게스트를 불참으로 보내면 그냥 목록에서 뺀다
      if (target?.isNew && slot === ABSENT) return prev.filter((p) => p.key !== selected);
      return prev.map((p) => (p.key === selected ? { ...p, slot } : p));
    });
    setSelected(null);
  }

  function addPerson() {
    const name = guestName.trim();
    if (addMemberId) {
      const c = candidates.find((x) => x.id === addMemberId);
      if (!c) return;
      setPeople((prev) => [...prev, { key: c.id, name: c.name, slot: addTeam }]);
    } else if (name) {
      const key = `new:${name}`;
      if (usedKeys.has(key)) return;
      setPeople((prev) => [...prev, { key, name, slot: addTeam, isNew: true }]);
    } else {
      return;
    }
    setAddMemberId("");
    setGuestName("");
    setAddOpen(false);
  }

  function chip(p: Person, color: string) {
    const isSelected = p.key === selected;
    const canSwap = selectedPerson && !isSelected && selectedPerson.slot !== p.slot;
    return (
      <button
        key={p.key}
        type="button"
        onClick={() => tapPerson(p.key)}
        className="rounded-full border-2 px-3 py-1.5 text-base font-semibold transition"
        style={{
          borderColor: isSelected ? color : canSwap ? `${color}99` : "var(--sand)",
          background: isSelected ? color : "white",
          color: isSelected ? "white" : undefined,
          borderStyle: canSwap ? "dashed" : "solid",
        }}
        aria-pressed={isSelected}
      >
        {isSelected && "✓ "}
        {p.name}
        {p.isNew && <span className="ml-1 text-xs opacity-70">(새 게스트)</span>}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        if (
          warnings.length > 0 &&
          !window.confirm(`${summary}\n\n${warnings.join("\n")}\n\n그래도 이대로 확정할까요?`)
        ) {
          return;
        }
        await action(formData);
        goBack(router, fallbackHref);
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="round_id" value={roundId} />
      {people.map((p) =>
        p.isNew ? (
          <span key={p.key}>
            <input type="hidden" name="guest_name" value={p.name} />
            <input type="hidden" name="guest_team" value={p.slot} />
          </span>
        ) : (
          <input key={p.key} type="hidden" name={`team_${p.key}`} value={p.slot} />
        )
      )}

      <p className="rounded-xl bg-sand/40 px-4 py-3 text-sm text-foreground/80">
        이름을 누르면 선택돼요. 선택한 상태에서 <b>다른 조 사람 이름</b>을 누르면 두 사람 자리가
        맞바뀌고, 아래 버튼으로 <b>다른 조로 옮기거나 불참 처리</b>할 수 있어요.
      </p>

      {visibleTeams.map((t) => {
        const members = people.filter((p) => p.slot === String(t.no));
        const n = members.length;
        const over = n > MAX_PER_TEAM;
        return (
          <section
            key={t.no}
            className="rounded-2xl border-2 p-4"
            style={{ borderColor: t.color, background: `${t.color}12` }}
          >
            <h2 className="mb-2 flex items-center justify-between font-extrabold" style={{ color: t.color }}>
              <span>{t.name}</span>
              <span className={`text-sm ${over ? "text-danger" : ""}`}>
                {n}/{MAX_PER_TEAM}명{over && " ⚠️"}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {members.length > 0 ? (
                members.map((p) => chip(p, t.color))
              ) : (
                <span className="text-sm text-foreground/50">비어 있어요</span>
              )}
            </div>
          </section>
        );
      })}

      <section className="rounded-2xl border-2 border-dashed border-foreground/20 p-4">
        <h2 className="mb-2 flex items-center justify-between font-extrabold text-foreground/60">
          <span>🚫 불참</span>
          <span className="text-sm">{absentPeople.length}명</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {absentPeople.length > 0 ? (
            absentPeople.map((p) => chip(p, "#6b7280"))
          ) : (
            <span className="text-sm text-foreground/50">없음</span>
          )}
        </div>
      </section>

      {selectedPerson && (
        <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border-2 border-fairway bg-white p-3 shadow-lg">
          <p className="text-sm font-bold">
            <span className="text-fairway-dark">{selectedPerson.name}</span> 님을…
            <span className="block font-normal text-foreground/60">
              다른 조 사람 이름을 누르면 서로 맞바뀌어요
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {TEAM_THEMES.filter((t) => String(t.no) !== selectedPerson.slot).map((t) => (
              <button
                key={t.no}
                type="button"
                onClick={() => moveSelected(String(t.no))}
                className="btn flex-1 !px-3 !py-2 text-white"
                style={{ background: t.color }}
              >
                {t.name}로
              </button>
            ))}
            {selectedPerson.slot !== ABSENT && (
              <button
                type="button"
                onClick={() => moveSelected(ABSENT)}
                className="btn btn-danger flex-1 !px-3 !py-2"
              >
                {selectedPerson.isNew ? "빼기" : "불참"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-sm text-foreground/60 underline"
          >
            선택 취소
          </button>
        </div>
      )}

      <div className="card flex flex-col gap-3">
        {!addOpen ? (
          <button type="button" onClick={() => setAddOpen(true)} className="btn btn-secondary w-full">
            ＋ 인원 추가 (대타·게스트)
          </button>
        ) : (
          <>
            <h2 className="font-bold">＋ 인원 추가</h2>
            {availableCandidates.length > 0 && (
              <label className="flex flex-col gap-1 text-sm font-semibold">
                회원/등록된 게스트 중에서 고르기
                <select
                  value={addMemberId}
                  onChange={(e) => {
                    setAddMemberId(e.target.value);
                    if (e.target.value) setGuestName("");
                  }}
                  className="rounded-lg border-2 border-sand px-3 py-2 font-normal"
                >
                  <option value="">선택하세요</option>
                  {availableCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isGuest ? " (게스트)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm font-semibold">
              또는 새 게스트 이름 입력
              <input
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (e.target.value) setAddMemberId("");
                }}
                placeholder="예: 홍길동"
                className="rounded-lg border-2 border-sand px-3 py-2 font-normal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              넣을 조
              <select
                value={addTeam}
                onChange={(e) => setAddTeam(e.target.value)}
                className="rounded-lg border-2 border-sand px-3 py-2 font-normal"
              >
                {TEAM_THEMES.map((t) => (
                  <option key={t.no} value={t.no}>
                    {t.name} (현재 {counts[String(t.no)] ?? 0}명)
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="btn btn-secondary flex-1"
              >
                취소
              </button>
              <button
                type="button"
                onClick={addPerson}
                disabled={!addMemberId && !guestName.trim()}
                className="btn btn-primary flex-1"
              >
                추가하기
              </button>
            </div>
          </>
        )}
      </div>

      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          warnings.length > 0 ? "bg-danger/10 text-danger" : "bg-fairway/10 text-fairway-dark"
        }`}
      >
        {summary} · 불참 {absentPeople.length}명
        {warnings.length > 0 ? (
          <ul className="mt-1 list-disc pl-5 font-normal">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <span className="block font-normal">인원이 잘 맞아요 👍</span>
        )}
      </div>

      <SubmitButton className="btn btn-primary w-full">이 팀 편성으로 확정하기</SubmitButton>
    </form>
  );
}
