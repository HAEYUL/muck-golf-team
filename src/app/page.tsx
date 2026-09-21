import Link from "next/link";
import { getCurrentMember } from "@/lib/session";
import {
  getActiveRound,
  getLatestTeamAssignment,
  getMemberAverageScores,
  listMembers,
  listParticipants,
  listScores,
  listTeamReveals,
} from "@/lib/queries";
import { loginAction, logoutAction } from "./actions";
import { revealTeamAction } from "./rounds/actions";
import { NameAutocompleteLogin } from "@/components/NameAutocompleteLogin";
import { RoundCard } from "@/components/RoundCard";
import { TeamRevealSection } from "@/components/TeamRevealSection";
import { TeamResultsList } from "@/components/TeamResultsList";
import { ScoreRankedList } from "@/components/ScoreRankedList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const member = await getCurrentMember();
  const members = await listMembers();

  if (!member) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-8">
        <div className="text-center">
          <p className="text-5xl">⛳️</p>
          <h1 className="mt-2 text-3xl font-extrabold text-fairway-dark">
            먹회골프
          </h1>
          <p className="mt-1 text-foreground/70">이름을 입력하고 입장해주세요</p>
        </div>
        <NameAutocompleteLogin
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            is_admin: m.is_admin,
            has_password: !!m.password_hash,
          }))}
          action={loginAction}
        />
      </main>
    );
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const getName = (id: string) => memberMap.get(id)?.name ?? "?";

  const activeRound = await getActiveRound();
  const participants = activeRound
    ? await listParticipants(activeRound.id)
    : [];
  const assignment = activeRound
    ? await getLatestTeamAssignment(activeRound.id)
    : null;

  const attendingParticipants = participants
    .filter((p) => p.attending)
    .map((p) => ({ id: p.member_id, name: getName(p.member_id) }));

  const teamByMember: Record<string, number> = {};
  if (assignment) {
    Object.entries(assignment.teams).forEach(([teamNo, ids]) => {
      ids.forEach((id) => (teamByMember[id] = Number(teamNo)));
    });
  }

  const reveals =
    activeRound?.status === "조편성중" && assignment
      ? await listTeamReveals(assignment.id)
      : [];

  const scores =
    activeRound?.status === "완료" ? await listScores(activeRound.id) : [];
  const averageByMember =
    activeRound?.status === "완료" ? await getMemberAverageScores() : {};

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground/60">환영해요</p>
          <h1 className="text-2xl font-extrabold text-fairway-dark">
            {member.name}님 ⛳️
          </h1>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-secondary !px-4 !py-2 !text-sm">
            다른 이름으로
          </button>
        </form>
      </header>

      <RoundCard
        round={activeRound}
        participants={participants}
        currentMemberId={member.id}
        isAdmin={member.is_admin}
      />

      {activeRound?.status === "조편성중" && (
        <TeamRevealSection
          roundId={activeRound.id}
          participants={attendingParticipants}
          mode={assignment?.mode ?? null}
          teamByMember={teamByMember}
          revealedIds={reveals.map((r) => r.member_id)}
          currentMemberId={member.id}
          revealAction={revealTeamAction}
        />
      )}

      {activeRound?.status === "확정" && assignment && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">팀 편성 결과</h2>
          <TeamResultsList teams={assignment.teams} getName={getName} />
        </section>
      )}

      {activeRound?.status === "완료" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">스코어</h2>
          <ScoreRankedList
            scores={scores}
            averageByMember={averageByMember}
            getName={getName}
          />
        </section>
      )}

      <nav className="grid grid-cols-2 gap-3">
        <Link href="/memories" className="btn btn-secondary">
          📸 추억 페이지
        </Link>
        <Link href="/me" className="btn btn-secondary">
          🙋 마이페이지
        </Link>
        {member.is_admin && (
          <Link href="/admin" className="btn btn-primary col-span-2">
            🛠 관리자 페이지
          </Link>
        )}
      </nav>
    </main>
  );
}
