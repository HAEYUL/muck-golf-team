import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { listMemberScoreHistory } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const history = await listMemberScoreHistory(member.id);
  const count = history.length;
  const average = count
    ? Math.round((history.reduce((sum, h) => sum + h.score, 0) / count) * 10) / 10
    : null;
  const best = count ? Math.min(...history.map((h) => h.score)) : null;

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fairway">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">🙋 마이페이지</h1>
      </header>

      <section className="card text-center">
        <p className="text-2xl font-extrabold text-fairway-dark">{member.name}님</p>
        <p className="mt-1 text-foreground/60">
          {member.is_admin ? "관리자" : member.is_guest ? "게스트" : "정회원"} · 실력순위 {member.skill_rank}위
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="card">
          <p className="text-2xl font-extrabold">{count}</p>
          <p className="text-sm text-foreground/60">참여 횟수</p>
        </div>
        <div className="card">
          <p className="text-2xl font-extrabold">{average ?? "-"}</p>
          <p className="text-sm text-foreground/60">평균 타수</p>
        </div>
        <div className="card">
          <p className="text-2xl font-extrabold">{best ?? "-"}</p>
          <p className="text-sm text-foreground/60">최고 기록</p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">역대 라운딩</h2>
        {history.length === 0 && (
          <p className="text-foreground/60">아직 기록된 라운딩이 없어요.</p>
        )}
        {history.map((h) => (
          <Link
            key={h.id}
            href={`/rounds/${h.round_id}`}
            className="card flex items-center justify-between"
          >
            <div>
              <p className="font-bold">{h.rounds.golf_course}</p>
              <p className="text-sm text-foreground/60">{formatDate(h.rounds.date)}</p>
            </div>
            <p className="text-xl font-extrabold text-fairway-dark">{h.score}타</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
