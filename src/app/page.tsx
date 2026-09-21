import Link from "next/link";
import { getCurrentMember } from "@/lib/session";
import {
  getActiveRound,
  getLatestTeamAssignment,
  listMembers,
  listParticipants,
} from "@/lib/queries";
import { loginAction, logoutAction } from "./actions";
import { NameAutocompleteLogin } from "@/components/NameAutocompleteLogin";
import { MemberLineup } from "@/components/MemberLineup";
import { RoundCard } from "@/components/RoundCard";

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

  const activeRound = await getActiveRound();
  const participants = activeRound
    ? await listParticipants(activeRound.id)
    : [];
  const assignment = activeRound
    ? await getLatestTeamAssignment(activeRound.id)
    : null;

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
        assignment={assignment}
        currentMemberId={member.id}
        isAdmin={member.is_admin}
      />

      <section>
        <h2 className="mb-2 text-lg font-bold">멤버 라인업</h2>
        <MemberLineup members={members} currentMemberId={member.id} />
      </section>

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
