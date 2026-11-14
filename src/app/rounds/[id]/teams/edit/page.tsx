import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getRound,
  listMembers,
  listParticipants,
} from "@/lib/queries";
import { formatCourseLabel } from "@/lib/format";
import { saveManualTeamsAction } from "../../../actions";
import { BackButton } from "@/components/BackButton";
import { ManualTeamEditor } from "@/components/ManualTeamEditor";

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
  const attendingIdSet = new Set(
    participants.filter((p) => p.attending).map((p) => p.member_id)
  );
  const attendingIds = members.filter((m) => attendingIdSet.has(m.id)).map((m) => m.id);

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
          <BackButton fallbackHref={`/rounds/${id}`} />
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
        <BackButton fallbackHref={`/rounds/${id}`} />
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">✍️ 수동 팀 편성</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <ManualTeamEditor
        roundId={id}
        initial={attendingIds.map((memberId) => ({
          id: memberId,
          name: memberMap.get(memberId)?.name ?? "?",
          team: currentTeamByMember.get(memberId) ?? "1",
        }))}
        candidates={members
          .filter((m) => !attendingIdSet.has(m.id) && m.is_active)
          .map((m) => ({ id: m.id, name: m.name, isGuest: m.is_guest }))}
        action={saveManualTeamsAction}
        fallbackHref={`/rounds/${id}`}
      />
    </main>
  );
}
