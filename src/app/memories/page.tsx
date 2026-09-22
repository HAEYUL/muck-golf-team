import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getRoundResult, listCompletedRounds } from "@/lib/queries";
import { formatCourseLabel, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const rounds = await listCompletedRounds();

  const cards = await Promise.all(
    rounds.map(async (round) => {
      const result = await getRoundResult(round.id);
      return { round, result };
    })
  );

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fairway">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">📸 추억 페이지</h1>
      </header>

      {cards.length === 0 && (
        <p className="text-center text-foreground/60">
          아직 완료된 라운딩이 없어요. 첫 라운딩을 기다려주세요!
        </p>
      )}

      <div className="flex flex-col gap-4">
        {cards.map(({ round, result }) => {
          const photoCount = result?.photos.length ?? 0;

          return (
            <Link
              key={round.id}
              href={`/rounds/${round.id}`}
              className="card flex flex-col gap-3 transition-transform hover:bg-sand/10 active:scale-[0.98] active:opacity-80"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-extrabold text-fairway-dark">
                  {formatCourseLabel(round)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm text-foreground/60">{formatDate(round.date)}</span>
                  <span className="text-lg text-fairway" aria-hidden="true">
                    ›
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  🎲 조편성
                </span>
                <span className="rounded-full bg-sky/15 px-3 py-1 text-xs font-bold text-sky">
                  ⛳ 스코어
                </span>
                <span className="rounded-full bg-fairway/10 px-3 py-1 text-xs font-bold text-fairway-dark">
                  📸 추억사진{photoCount > 0 ? ` ${photoCount}` : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
