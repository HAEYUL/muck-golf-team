import Link from "next/link";
import { getCurrentMember } from "@/lib/session";
import {
  getActiveRound,
  getLatestTeamAssignment,
  listActiveAnnouncements,
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
import { AddToHomeScreenButton } from "@/components/AddToHomeScreenButton";
import { getCharacterUrl } from "@/lib/characters";
import { SongReplayButton, SongToggleButton } from "@/components/MuckSongButtons";

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
          members={members
            .filter((m) => m.is_active)
            .map((m) => ({
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

  const announcements = await listActiveAnnouncements();
  const activeRound = await getActiveRound();
  const participants = activeRound
    ? await listParticipants(activeRound.id)
    : [];
  const assignment = activeRound
    ? await getLatestTeamAssignment(activeRound.id)
    : null;

  const attendingIds = new Set(
    participants.filter((p) => p.attending).map((p) => p.member_id)
  );
  const attendingParticipants = members
    .filter((m) => attendingIds.has(m.id))
    .map((m) => ({ id: m.id, name: m.name }));

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

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getCharacterUrl(member.name, member.character_url) && (
            <img
              src={getCharacterUrl(member.name, member.character_url)!}
              alt={`${member.name} 캐릭터`}
              className="h-20 w-auto shrink-0 object-contain"
            />
          )}
          <div>
            <p className="text-sm text-foreground/60">환영해요</p>
            <h1 className="text-2xl font-extrabold text-fairway-dark">
              {member.name}님 ⛳️
            </h1>
            <SongToggleButton />
          </div>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-secondary !px-4 !py-2 !text-sm">
            다른 이름으로
          </button>
        </form>
      </header>

      {announcements.length > 0 && (
        <section className="flex flex-col gap-2">
          {announcements.map((a, i) => (
            <div
              key={a.id}
              className="overflow-hidden rounded-xl border-2 border-accent bg-accent/10 px-4 py-3"
            >
              <p className="text-sm font-extrabold text-accent">📢 알림/공지사항</p>
              <p
                className="notice-slide-in mt-1 text-sm font-semibold text-foreground/90"
                style={{ animationDelay: `${i * 0.6}s` }}
              >
                {a.content}
              </p>
            </div>
          ))}
        </section>
      )}

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
          <TeamResultsList
            teams={assignment.teams}
            getName={getName}
            memberOrder={members.map((m) => m.id)}
          />
        </section>
      )}

      {activeRound?.status === "완료" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">스코어</h2>
          <ScoreRankedList
            scores={scores}
            getName={getName}
            assignedMemberIds={assignment ? Object.values(assignment.teams).flat() : []}
            teams={assignment?.teams}
            memberOrder={members.map((m) => m.id)}
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
        <Link href="/guide" className="btn btn-secondary col-span-2">
          📖 앱 가이드
        </Link>
        <p className="col-span-2 py-2 text-center text-base font-bold leading-relaxed text-fairway-dark">
          좋은 사람, 좋은 그린, 좋은 하루
          <br />
          만날수록 반가운 사람들
          <br />
          함께라서 좋은, <span className="font-extrabold text-fairway">먹회골프</span>
        </p>
        <SongReplayButton />
        {member.is_admin ? (
          <Link href="/admin" className="btn btn-primary col-span-2">
            🛠 관리자 페이지
          </Link>
        ) : (
          <AddToHomeScreenButton />
        )}
      </nav>

      <footer className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 pt-2 text-center text-xs text-foreground/40">
        <span aria-hidden="true">⛳️</span>
        <span className="text-sm font-extrabold text-fairway">먹회골프</span>
        <span>Copyright ©먹회골프 All Rights Reserved.</span>
        <span>· V 2.0</span>
      </footer>
    </main>
  );
}
