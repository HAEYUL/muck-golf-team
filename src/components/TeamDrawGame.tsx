"use client";

import { useMemo, useState } from "react";
import { TEAM_THEMES } from "@/lib/types";

type Participant = { id: string; name: string };

/** Fisher-Yates 셔플 */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function TeamDrawGame({
  participants,
  teamByMember,
}: {
  participants: Participant[];
  teamByMember: Record<string, number>;
}) {
  const order = useMemo(() => shuffle(participants), [participants]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const revealCount = revealed.size;
  const total = participants.length;

  function handleDraw(id: string) {
    if (revealed.has(id) || animatingId) return;
    setAnimatingId(id);
    window.setTimeout(() => {
      setRevealed((prev) => new Set(prev).add(id));
      setAnimatingId(null);
    }, 550);
  }

  function revealAll() {
    setRevealed(new Set(participants.map((p) => p.id)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card text-center">
        <p className="text-lg font-bold">
          🏌️ 이름을 눌러서 골프공을 뽑아보세요!
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          {revealCount} / {total}명 뽑기 완료
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {order.map((p) => {
          const isRevealed = revealed.has(p.id);
          const isAnimating = animatingId === p.id;
          const teamNo = teamByMember[p.id];
          const theme = TEAM_THEMES[(teamNo ?? 1) - 1] ?? TEAM_THEMES[0];

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDraw(p.id)}
              disabled={isRevealed || animatingId !== null}
              className={`name-box flex-col gap-1 !min-h-24 ${
                isAnimating ? "golf-draw-animating" : ""
              }`}
              style={{
                background: isRevealed ? theme.color : undefined,
                borderColor: isRevealed ? theme.color : undefined,
                color: isRevealed ? "white" : undefined,
              }}
            >
              {isAnimating ? (
                <span className="text-2xl">⛳️</span>
              ) : isRevealed ? (
                <>
                  <span className="text-2xl" style={{ color: theme.ball }}>
                    ⛳
                  </span>
                  <span>{p.name}</span>
                  <span className="text-xs font-semibold opacity-90">
                    {theme.name}
                  </span>
                </>
              ) : (
                <span>{p.name}</span>
              )}
            </button>
          );
        })}
      </div>

      {revealCount < total && (
        <button type="button" onClick={revealAll} className="btn btn-secondary w-full">
          한번에 모두 공개하기
        </button>
      )}
    </div>
  );
}
