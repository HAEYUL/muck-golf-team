import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getRecordPin, isRecordsUnlocked, listGolfRecords } from "@/lib/records";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import { RecordPinForm } from "@/components/RecordPinForm";
import { ScoreTrendChart } from "@/components/ScoreTrendChart";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deletePersonalRoundAction, setRecordPinAction, unlockRecordsAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "muck", label: "⛳ 먹회골프" },
  { key: "personal", label: "🏌️ 개인 라운딩" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function average(scores: number[]) {
  return scores.length
    ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
    : null;
}

export default async function GolfRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const header = (
    <header className="flex items-center justify-between">
      <Link href="/me" className="text-sm font-semibold text-fairway">
        ← 마이페이지
      </Link>
      <h1 className="text-xl font-extrabold text-fairway-dark">📒 내 골프 기록장</h1>
    </header>
  );

  const pin = await getRecordPin(member.id);
  if (!(await isRecordsUnlocked(member.id, pin))) {
    return (
      <main className="flex flex-col gap-6">
        {header}
        <section className="card flex flex-col gap-4">
          <div className="text-center">
            <p className="text-4xl" aria-hidden="true">
              🔒
            </p>
            {pin ? (
              <p className="mt-2 font-bold">기록장 비밀번호 4자리를 입력해주세요</p>
            ) : (
              <>
                <p className="mt-2 font-bold">기록장에서 쓸 비밀번호 4자리를 정해주세요</p>
                <p className="mt-1 text-sm text-foreground/60">
                  내 개인 기록은 나만 볼 수 있도록 잠가둘게요. 잊어버리면 관리자에게 초기화를
                  부탁하세요 (기록은 지워지지 않아요).
                </p>
              </>
            )}
          </div>
          <RecordPinForm
            mode={pin ? "unlock" : "set"}
            action={pin ? unlockRecordsAction : setRecordPinAction}
          />
        </section>
      </main>
    );
  }

  const { type } = await searchParams;
  const filter: FilterKey = type === "muck" || type === "personal" ? type : "all";
  const allRecords = await listGolfRecords(member.id);
  const records = filter === "all" ? allRecords : allRecords.filter((r) => r.kind === filter);

  const scores = records.map((r) => r.score);
  const avg = average(scores);
  const best = scores.length ? Math.min(...scores) : null;
  const recent5 = average(scores.slice(0, 5));
  const muckAvg = average(allRecords.filter((r) => r.kind === "muck").map((r) => r.score));
  const personalAvg = average(allRecords.filter((r) => r.kind === "personal").map((r) => r.score));

  const chartPoints = [...records].reverse().map((r) => ({
    key: `${r.kind}-${r.id}`,
    kind: r.kind,
    date: r.date,
    label: r.golf_course,
    score: r.score,
  }));

  return (
    <main className="flex flex-col gap-6">
      {header}

      <Link href="/me/records/new" className="btn btn-primary w-full">
        ➕ 개인 라운딩 기록하기
      </Link>

      <nav className="flex gap-2" aria-label="기록 종류">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/me/records" : `/me/records?type=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`flex-1 rounded-full border-2 px-2 py-2 text-center text-sm font-semibold ${
              filter === f.key
                ? "border-fairway bg-fairway text-white"
                : "border-sand text-foreground/70"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="card">
          <p className="text-2xl font-extrabold">{records.length}</p>
          <p className="text-sm text-foreground/60">라운딩 수</p>
        </div>
        <div className="card">
          <p className="text-2xl font-extrabold">{avg ?? "-"}</p>
          <p className="text-sm text-foreground/60">평균 타수</p>
        </div>
        <div className="card">
          <p className="text-2xl font-extrabold">{best ?? "-"}</p>
          <p className="text-sm text-foreground/60">최고 기록</p>
        </div>
        <div className="card">
          <p className="text-2xl font-extrabold">{recent5 ?? "-"}</p>
          <p className="text-sm text-foreground/60">최근 5회 평균</p>
        </div>
      </section>

      {filter === "all" && muckAvg !== null && personalAvg !== null && (
        <p className="rounded-xl bg-sand/30 px-4 py-3 text-center text-sm">
          평균 타수 · 먹회골프 <span className="font-extrabold">{muckAvg}</span> / 개인 라운딩{" "}
          <span className="font-extrabold">{personalAvg}</span>
        </p>
      )}

      {chartPoints.length > 0 && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">📈 스코어 그래프</h2>
          <ScoreTrendChart key={filter} points={chartPoints} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">기록 목록</h2>
        {records.length === 0 && (
          <p className="text-foreground/60">
            {filter === "muck"
              ? "아직 스코어가 입력된 먹회골프 라운딩이 없어요."
              : "아직 기록이 없어요. 위의 ‘개인 라운딩 기록하기’로 첫 기록을 남겨보세요."}
          </p>
        )}
        {records.map((r) => (
          <div key={`${r.kind}-${r.id}`} className="card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground/60">
                  {r.kind === "muck" ? "⛳ 먹회골프" : "🏌️ 개인 라운딩"}
                </p>
                <p className="font-bold">{formatCourseLabel(r)}</p>
                <p className="text-sm text-foreground/60">
                  {formatDate(r.date)}
                  {r.time && ` · ${formatTime(r.time)}`}
                </p>
              </div>
              <p className="shrink-0 text-2xl font-extrabold text-fairway-dark">{r.score}타</p>
            </div>
            {r.companions.length > 0 && (
              <p className="text-sm text-foreground/80">👥 {r.companions.join(", ")}</p>
            )}
            {r.memo && (
              <p className="whitespace-pre-wrap rounded-lg bg-sand/30 px-3 py-2 text-sm text-foreground/80">
                {r.memo}
              </p>
            )}
            <div className="flex justify-end gap-2">
              {r.kind === "muck" ? (
                <Link
                  href={`/rounds/${r.id}`}
                  className="btn btn-secondary !px-3 !py-1.5 !text-sm"
                >
                  라운딩 보기
                </Link>
              ) : (
                <>
                  <Link
                    href={`/me/records/${r.id}/edit`}
                    className="btn btn-secondary !px-3 !py-1.5 !text-sm"
                  >
                    수정
                  </Link>
                  <ConfirmSubmitButton
                    action={deletePersonalRoundAction}
                    fields={{ id: r.id }}
                    message={`${formatDate(r.date)} ${r.golf_course} 기록을 삭제할까요?`}
                    label="삭제"
                    className="btn btn-danger !px-3 !py-1.5 !text-sm"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
