"use client";

import { useState } from "react";

export type ScorePoint = {
  key: string;
  kind: "muck" | "personal";
  date: string; // YYYY-MM-DD
  label: string; // 골프장 이름
  score: number;
};

const KIND_LABEL = { muck: "먹회골프", personal: "개인 라운딩" } as const;
const KIND_COLOR = { muck: "var(--chart-muck)", personal: "var(--chart-personal)" } as const;

const WIDTH = 340;
const HEIGHT = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 32 };

function shortDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${y.slice(2)}.${Number(m)}.${Number(d)}`;
}

/** 먹회골프는 동그라미, 개인 라운딩은 네모 (색만으로 구분하지 않도록) */
function Marker({
  kind,
  x,
  y,
  size,
}: {
  kind: ScorePoint["kind"];
  x: number;
  y: number;
  size: number;
}) {
  const common = { fill: KIND_COLOR[kind], stroke: "var(--card)", strokeWidth: 2 };
  return kind === "muck" ? (
    <circle cx={x} cy={y} r={size / 2} {...common} />
  ) : (
    <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={1.5} {...common} />
  );
}

/** 날짜순 스코어 변화 꺾은선 그래프. 점을 누르면 그 라운딩 정보가 아래에 나온다 */
export function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  const [selected, setSelected] = useState<number>(points.length - 1);
  if (points.length === 0) return null;

  const scores = points.map((p) => p.score);
  const step = 5;
  const yMin = Math.floor((Math.min(...scores) - 2) / step) * step;
  const yMax = Math.ceil((Math.max(...scores) + 2) / step) * step;
  const ticks: number[] = [];
  const tickStep = yMax - yMin > 30 ? 10 : step;
  for (let t = Math.ceil(yMin / tickStep) * tickStep; t <= yMax; t += tickStep) ticks.push(t);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const xAt = (i: number) =>
    PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const yAt = (score: number) => PAD.top + ((score - yMin) / (yMax - yMin)) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.score).toFixed(1)}`)
    .join(" ");
  const kinds = (["muck", "personal"] as const).filter((k) => points.some((p) => p.kind === k));
  const current = points[selected] ?? points[points.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
        {kinds.map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden="true">
              <Marker kind={kind} x={6} y={6} size={10} />
            </svg>
            {KIND_LABEL[kind]}
          </span>
        ))}
        <span className="ml-auto text-xs text-foreground/50">위쪽일수록 좋은 기록</span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`스코어 변화 그래프, ${points.length}개 라운딩`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={PAD.left - 6}
              y={yAt(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              fillOpacity={0.55}
            >
              {t}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 6} fontSize="10" fill="currentColor" fillOpacity={0.55}>
          {shortDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text
            x={WIDTH - PAD.right}
            y={HEIGHT - 6}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            fillOpacity={0.55}
          >
            {shortDate(points[points.length - 1].date)}
          </text>
        )}

        {current && (
          <line
            x1={xAt(selected)}
            x2={xAt(selected)}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeDasharray="3 3"
          />
        )}
        <path d={linePath} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={2} />

        {points.map((p, i) => (
          <g key={p.key}>
            <Marker kind={p.kind} x={xAt(i)} y={yAt(p.score)} size={i === selected ? 12 : 9} />
            {/* 손가락으로 누르기 쉽게 점보다 넓은 투명 영역 */}
            <rect
              x={xAt(i) - Math.max(6, plotW / points.length / 2)}
              y={PAD.top}
              width={Math.max(12, plotW / points.length)}
              height={plotH}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
            >
              <title>{`${shortDate(p.date)} ${p.label} ${p.score}타`}</title>
            </rect>
          </g>
        ))}
      </svg>

      {current && (
        <p className="rounded-lg bg-sand/30 px-3 py-2 text-sm">
          <span className="font-semibold">{shortDate(current.date)}</span> · {current.label} ·{" "}
          <span className="font-extrabold">{current.score}타</span>
          <span className="text-foreground/60"> ({KIND_LABEL[current.kind]})</span>
        </p>
      )}
    </div>
  );
}
