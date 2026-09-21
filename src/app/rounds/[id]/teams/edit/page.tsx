import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getRound,
  listMembers,
  listParticipants,
} from "@/lib/queries";
import { formatCourseLabel } from "@/lib/format";
import { TEAM_THEMES } from "@/lib/types";
import { saveManualTeamsAction } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/");
  if (!member.is_admin) redirect(`/rounds/${id}`);

  const round = await getRound(id);
  if (!round) notFound();

  const [members, participants, assignment] = await Promise.all([
    listMembers(),
    listParticipants(id),
    getLatestTeamAssignment(id),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const attendingIds = participants.filter((p) => p.attending).map((p) => p.member_id);

  const currentTeamByMember = new Map<string, string>();
  if (assignment) {
    Object.entries(assignment.teams).forEach(([teamNo, ids]) => {
      ids.forEach((memberId) => currentTeamByMember.set(memberId, teamNo));
    });
  }

  if (attendingIds.length === 0) {
    return (
      <main className="flex flex-col gap-6">
        <header>
          <Link href={`/rounds/${id}`} className="text-sm font-semibold text-fairway">
            ← 라운딩으로
          </Link>
        </header>
        <p className="card text-center text-foreground/70">
          참가 확정된 인원이 없어서 팀을 편성할 수 없어요.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      <header>
        <Link href={`/rounds/${id}`} className="text-sm font-semibold text-fairway">
          ← 라운딩으로
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">✍️ 수동 팀 편성</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <form action={saveManualTeamsAction} className="flex flex-col gap-3">
        <input type="hidden" name="round_id" value={id} />
        <div className="card flex flex-col gap-3">
          {attendingIds.map((memberId) => {
            const name = memberMap.get(memberId)?.name ?? "?";
            const defaultTeam = currentTeamByMember.get(memberId) ?? "1";
            return (
              <div key={memberId} className="flex items-center justify-between gap-3">
                <span className="font-semibold">{name}</span>
                <select
                  name={`team_${memberId}`}
                  defaultValue={defaultTeam}
                  className="rounded-lg border-2 border-sand px-3 py-2 text-center font-bold"
                >
                  {TEAM_THEMES.map((theme) => (
                    <option key={theme.no} value={theme.no}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        <button type="submit" className="btn btn-primary w-full">
          이 팀 편성으로 확정하기
        </button>
      </form>
    </main>
  );
}
