import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getRound,
  listMembers,
  listScores,
} from "@/lib/queries";
import { TEAM_THEMES } from "@/lib/types";
import { formatCourseLabel } from "@/lib/format";
import { submitScoresAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const round = await getRound(id);
  if (!round) notFound();

  const assignment = await getLatestTeamAssignment(id);
  if (!assignment) redirect(`/rounds/${id}`);

  const [members, scores] = await Promise.all([listMembers(), listScores(id)]);
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const scoreMap = new Map(scores.map((s) => [s.member_id, s.score]));

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href={`/rounds/${id}`} className="text-sm font-semibold text-fairway">
          ← 라운딩으로
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">스코어보드 입력</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <form action={submitScoresAction} className="flex flex-col gap-4">
        <input type="hidden" name="round_id" value={id} />

        {Object.entries(assignment.teams).map(([teamNo, ids]) => {
          const theme = TEAM_THEMES[Number(teamNo) - 1] ?? TEAM_THEMES[0];
          return (
            <div
              key={teamNo}
              className="card flex flex-col gap-2"
              style={{ borderLeft: `6px solid ${theme.color}` }}
            >
              <p className="font-extrabold" style={{ color: theme.color }}>
                {theme.name}
              </p>
              {ids.map((mid) => (
                <div key={mid} className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{memberMap.get(mid)?.name ?? "?"}</span>
                  <input
                    type="number"
                    name={`score_${mid}`}
                    defaultValue={scoreMap.get(mid) ?? ""}
                    placeholder="타수"
                    className="w-24 rounded-lg border-2 border-sand px-3 py-2 text-center text-lg"
                  />
                </div>
              ))}
            </div>
          );
        })}

        <div className="card flex flex-col gap-2">
          <p className="font-bold">라운딩 사진</p>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="rounded-lg border-2 border-dashed border-sand p-3"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          스코어 저장하고 완료 처리하기
        </button>
      </form>
    </main>
  );
}
