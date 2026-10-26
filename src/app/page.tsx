import Link from "next/link";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getAnnouncementBoard,
  listMembers,
  listParticipants,
  listPublishedRounds,
  listTeamReveals,
} from "@/lib/queries";
import { loginAction, logoutAction } from "./actions";
import { NameAutocompleteLogin } from "@/components/NameAutocompleteLogin";
import { RoundSummaryCard } from "@/components/RoundSummaryCard";
import { AddToHomeScreenButton } from "@/components/AddToHomeScreenButton";
import { getCharacterUrl } from "@/lib/characters";
import { formatDate } from "@/lib/format";
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

  const { active: announcement, history: pastAnnouncements } = await getAnnouncementBoard();
  const publishedRounds = await listPublishedRounds();
  const roundCards = await Promise.all(
    publishedRounds.map(async (round) => {
      const [participants, assignment] = await Promise.all([
        listParticipants(round.id),
        getLatestTeamAssignment(round.id),
      ]);
      const reveals =
        round.status === "조편성중" && assignment ? await listTeamReveals(assignment.id) : [];
      return { round, participants, assignment, revealedIds: reveals.map((r) => r.member_id) };
    })
  );

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

      {(announcement || pastAnnouncements.length > 0) && (
        <section className="flex flex-col gap-2">
          {announcement && (
            <div className="overflow-hidden rounded-xl border-2 border-accent bg-accent/10 px-4 py-3">
              <p className="text-sm font-extrabold text-accent">📢 알림/공지사항</p>
              <p className="notice-slide-in mt-1 text-sm font-semibold text-foreground/90">
                {announcement.content}
              </p>
            </div>
          )}
          {pastAnnouncements.length > 0 && (
            <details className="rounded-xl border-2 border-sand px-4 py-2">
              <summary className="cursor-pointer text-sm font-semibold text-foreground/60">
                지난 공지 보기 ({pastAnnouncements.length}개)
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {pastAnnouncements.map((a) => (
                  <li key={a.id} className="rounded-lg bg-sand/30 px-3 py-2">
                    <p className="text-sm text-foreground/80">{a.content}</p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {formatDate(a.start_date)} ~ {formatDate(a.end_date)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {roundCards.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">⛳️ 다가오는 라운딩</h2>
          {roundCards.map((c) => (
            <RoundSummaryCard key={c.round.id} {...c} currentMemberId={member.id} />
          ))}
        </section>
      ) : (
        <section className="card text-center">
          <p className="text-foreground/70">예정된 라운딩이 없어요 ⛳️</p>
          {member.is_admin && (
            <Link href="/admin" className="btn btn-primary mt-4 w-full">
              새 라운딩 만들기
            </Link>
          )}
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
