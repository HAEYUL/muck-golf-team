import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getLatestTeamAssignment, getRound, listMembers } from "@/lib/queries";
import { TeamDrawGame } from "@/components/TeamDrawGame";
import { TEAM_MODE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamDrawPage({
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

  const members = await listMembers();
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const teamByMember: Record<string, number> = {};
  const participants: { id: string; name: string }[] = [];
  Object.entries(assignment.teams).forEach(([teamNo, ids]) => {
    ids.forEach((mid) => {
      teamByMember[mid] = Number(teamNo);
      const m = memberMap.get(mid);
      if (m) participants.push({ id: mid, name: m.name });
    });
  });

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href={`/rounds/${id}`} className="text-sm font-semibold text-fairway">
          ← 라운딩으로
        </Link>
        <span className="text-sm text-foreground/50">
          {TEAM_MODE_LABEL[assignment.mode]} · {assignment.attempt_no}차
        </span>
      </header>

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-fairway-dark">
          {round.golf_course} 팀 뽑기
        </h1>
      </div>

      <TeamDrawGame
        key={`${assignment.round_id}-${assignment.attempt_no}`}
        participants={participants}
        teamByMember={teamByMember}
      />
    </main>
  );
}
