"use client";

import { useRef, useState } from "react";

type WheelTeam = { no: number; name: string; color: string };

const SPIN_DURATION_MS = 4500;
const RESULT_PAUSE_MS = 900;

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** 원 중심(cx,cy)에서 12시 방향을 0도로, 시계방향으로 도는 부채꼴(wedge) SVG path */
function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const p1 = polarPoint(cx, cy, r, startDeg);
  const p2 = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

export function TeamRouletteButton({
  roundId,
  name,
  characterUrl,
  wheelTeams,
  myTeamNo,
  revealAction,
}: {
  roundId: string;
  name: string;
  characterUrl?: string | null;
  wheelTeams: WheelTeam[];
  myTeamNo: number;
  revealAction: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const teamCount = wheelTeams.length;
  const segAngle = 360 / teamCount;
  const myIndex = Math.max(
    0,
    wheelTeams.findIndex((t) => t.no === myTeamNo)
  );
  const myTheme = wheelTeams[myIndex] ?? wheelTeams[0];

  function handleStart() {
    setOpen(true);
    // 다음 프레임에 값을 바꿔야 CSS transition이 적용된다
    requestAnimationFrame(() => {
      const segCenter = myIndex * segAngle + segAngle / 2;
      const jitter = (Math.random() - 0.5) * (segAngle * 0.5);
      const extraSpins = 6;
      setSpinning(true);
      setRotation(extraSpins * 360 + (360 - segCenter - jitter));
    });

    window.setTimeout(() => setShowResult(true), SPIN_DURATION_MS);
    window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, SPIN_DURATION_MS + RESULT_PAUSE_MS);
  }

  const cx = 100;
  const cy = 100;
  const r = 92;

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        className="name-box w-full gap-2"
        style={{ borderColor: "var(--fairway)", background: "rgba(47,122,79,0.1)" }}
      >
        {characterUrl && (
          <img src={characterUrl} alt="" className="h-12 w-auto shrink-0 object-contain" />
        )}
        {name} 눌러보기!
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/10 p-4 backdrop-blur-[1px]">
          <p
            className="rounded-full px-4 py-2 text-lg font-bold shadow-lg"
            style={{ background: "rgba(246,243,234,0.95)", color: "var(--fairway-dark)" }}
          >
            {showResult ? `${myTheme.name} 당첨! 🎉` : "두구두구두구..."}
          </p>

          <div className="relative h-[260px] w-[260px]">
            <div
              className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: "18px solid #f6f3ea",
              }}
            />
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.35, 1)`
                  : "none",
              }}
            >
              <circle cx={cx} cy={cy} r={r + 4} fill="#f6f3ea" />
              {wheelTeams.map((team, idx) => {
                const start = idx * segAngle;
                const end = start + segAngle;
                const mid = start + segAngle / 2;
                const labelPoint = polarPoint(cx, cy, r * 0.6, mid);
                return (
                  <g key={team.no}>
                    <path
                      d={wedgePath(cx, cy, r, start, end)}
                      fill={team.color}
                      stroke="#f6f3ea"
                      strokeWidth={2}
                    />
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y}
                      fill="white"
                      fontSize={14}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {team.name}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={14} fill="#f6f3ea" stroke="#2f7a4f" strokeWidth={3} />
            </svg>
          </div>

          <form ref={formRef} action={revealAction}>
            <input type="hidden" name="round_id" value={roundId} />
          </form>
        </div>
      )}
    </>
  );
}
