import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import {
  getLatestTeamAssignment,
  getMemberAverageScores,
  getRound,
  getRoundResult,
  listMembers,
  listParticipants,
  listScores,
  listSuggestions,
  listTeamReveals,
} from "@/lib/queries";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { RoundProgressSteps } from "@/components/RoundProgressSteps";
import { TeamResultsList } from "@/components/TeamResultsList";
import { ScoreRankedList } from "@/components/ScoreRankedList";
import { ParticipantChecklist } from "@/components/ParticipantChecklist";
import { ROUND_STATUS_STEPS, TEAM_MODE_DESCRIPTION, TEAM_MODE_LABEL } from "@/lib/types";
import type { TeamMode } from "@/lib/types";
import {
  addSuggestionAction,
  deleteSuggestionAction,
  closeRsvpAction,
  createTeamAssignmentAction,
  forceConfirmTeamsAction,
  reopenRsvpAction,
  revertRoundStatusAction,
  rsvpAction,
} from "../actions";

export const dynamic = "force-dynamic";

const MODES: TeamMode[] = [
  "random",
  "couples_together",
  "couples_split",
  "gender_balance",
  "skill_balance",
];

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const round = await getRound(id);
  if (!round) notFound();

  const [members, participants, assignment, scores, result, suggestions, averageByMember] =
    await Promise.all([
      listMembers(),
      listParticipants(id),
      getLatestTeamAssignment(id),
      listScores(id),
      getRoundResult(id),
      listSuggestions(id),
      getMemberAverageScores(),
    ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const getName = (memberId: string) => memberMap.get(memberId)?.name ?? "?";
  const participantMap = new Map(participants.map((p) => [p.member_id, p]));
  const attendingMembers = members.filter(
    (m) => participantMap.get(m.id)?.attending
  );
  const myEntry = participantMap.get(member.id);

  const reveals =
    round.status === "조편성중" && assignment
      ? await listTeamReveals(assignment.id)
      : [];
  const revealedSet = new Set(reveals.map((r) => r.member_id));
  const waitingNames = assignment
    ? Object.values(assignment.teams)
        .flat()
        .filter((mid) => !revealedSet.has(mid))
        .map(getName)
    : [];

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fairway">
          ← 홈으로
        </Link>
        <StatusBadge status={round.status} />
      </header>

      <section className="card flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fairway-dark">
            {formatCourseLabel(round)}
          </h1>
          <p className="text-foreground/70">
            {formatDate(round.date)} · {formatTime(round.time)}
          </p>
        </div>
        <RoundProgressSteps status={round.status} />
        {member.is_admin && round.status !== "모집중" && (
          <form action={revertRoundStatusAction}>
            <input type="hidden" name="round_id" value={round.id} />
            <button type="submit" className="btn btn-secondary w-full !py-2 !text-sm">
              ⏪ 이전 단계({ROUND_STATUS_STEPS[ROUND_STATUS_STEPS.indexOf(round.status) - 1]})로
              되돌리기
            </button>
          </form>
        )}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold">💬 건의사항</h2>
        <div className="flex flex-col gap-2">
          {suggestions.length === 0 && (
            <p className="text-sm text-foreground/60">아직 등록된 건의사항이 없어요.</p>
          )}
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-sand/30 px-3 py-2"
            >
              <div>
                <p className="text-sm text-foreground/90">{s.content}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {memberMap.get(s.member_id)?.name ?? "?"}
                </p>
              </div>
              {(s.member_id === member.id || member.is_admin) && (
                <form action={deleteSuggestionAction}>
                  <input type="hidden" name="suggestion_id" value={s.id} />
                  <input type="hidden" name="round_id" value={round.id} />
                  <button
                    type="submit"
                    className="shrink-0 text-xs font-semibold text-danger"
                    aria-label="건의사항 삭제"
                  >
                    삭제
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
        <form action={addSuggestionAction} className="flex flex-col gap-2">
          <input type="hidden" name="round_id" value={round.id} />
          <textarea
            name="content"
            required
            placeholder="건의사항을 남겨주세요"
            rows={2}
            className="rounded-xl border-2 border-sand px-4 py-3 text-base"
          />
          <button type="submit" className="btn btn-secondary w-full">
            건의사항 남기기
          </button>
        </form>
      </section>

      {round.status === "모집중" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">참가 체크</h2>
          <div className="flex gap-2">
            <form action={rsvpAction} className="flex-1">
              <input type="hidden" name="round_id" value={round.id} />
              <input type="hidden" name="attending" value="true" />
              <button
                type="submit"
                className={`btn w-full ${
                  myEntry?.attending ? "btn-primary" : "btn-secondary"
                }`}
              >
                참가 O
              </button>
            </form>
            <form action={rsvpAction} className="flex-1">
              <input type="hidden" name="round_id" value={round.id} />
              <input type="hidden" name="attending" value="false" />
              <button
                type="submit"
                className={`btn w-full ${
                  myEntry && !myEntry.attending ? "btn-danger" : "btn-secondary"
                }`}
              >
                불참 X
              </button>
            </form>
          </div>

          <ParticipantChecklist
            members={members.filter((m) => !m.is_guest || participantMap.has(m.id))}
            participantMap={participantMap}
            roundId={round.id}
            isAdmin={member.is_admin}
          />

          {member.is_admin && (
            <form action={closeRsvpAction}>
              <input type="hidden" name="round_id" value={round.id} />
              <button type="submit" className="btn btn-primary w-full">
                참가 체크 마감하기 ({attendingMembers.length}명 참가)
              </button>
            </form>
          )}
        </section>
      )}

      {round.status === "조편성중" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">
            {assignment
              ? "조편성 게임 진행중"
              : `팀 편성 대기중 (${attendingMembers.length}명 참가 확정)`}
          </h2>

          {assignment ? (
            <>
              <p className="text-sm text-foreground/70">
                게임방식: {TEAM_MODE_LABEL[assignment.mode]}
              </p>
              <p className="text-sm font-semibold text-foreground/70">
                {Object.values(assignment.teams).flat().length - waitingNames.length} /{" "}
                {Object.values(assignment.teams).flat().length}명 완료
                {waitingNames.length > 0 && (
                  <span className="block font-normal text-foreground/50">
                    대기중: {waitingNames.join(", ")}
                  </span>
                )}
              </p>
              <Link href="/" className="btn btn-primary w-full">
                🎲 홈 화면에서 게임 참여하기
              </Link>
              {member.is_admin && (
                <form action={forceConfirmTeamsAction}>
                  <input type="hidden" name="round_id" value={round.id} />
                  <button type="submit" className="btn btn-secondary w-full">
                    모두 완료된 것으로 처리하고 확정하기
                  </button>
                </form>
              )}
              {member.is_admin && (
                <details className="rounded-xl border-2 border-sand p-3">
                  <summary className="cursor-pointer font-bold">
                    🔁 다른 방식으로 다시 뽑기
                  </summary>
                  <form
                    action={createTeamAssignmentAction}
                    className="mt-3 flex flex-col gap-2"
                  >
                    <input type="hidden" name="round_id" value={round.id} />
                    {MODES.map((mode, idx) => (
                      <label key={mode} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value={mode}
                          defaultChecked={idx === 0}
                        />
                        {TEAM_MODE_LABEL[mode]}
                      </label>
                    ))}
                    <button type="submit" className="btn btn-primary w-full">
                      새로 뽑기 (게임 처음부터 다시 시작)
                    </button>
                  </form>
                  <Link
                    href={`/rounds/${round.id}/teams/edit`}
                    className="btn btn-secondary mt-2 w-full"
                  >
                    ✍️ 수동으로 편성하기
                  </Link>
                </details>
              )}
            </>
          ) : member.is_admin ? (
            <>
              <form action={createTeamAssignmentAction} className="flex flex-col gap-3">
                <input type="hidden" name="round_id" value={round.id} />
                <div className="flex flex-col gap-2">
                  {MODES.map((mode, idx) => (
                    <label
                      key={mode}
                      className="flex cursor-pointer flex-col rounded-xl border-2 border-sand px-4 py-3"
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <input type="radio" name="mode" value={mode} defaultChecked={idx === 0} />
                        {TEAM_MODE_LABEL[mode]}
                      </span>
                      <span className="mt-1 text-sm text-foreground/60">
                        {TEAM_MODE_DESCRIPTION[mode]}
                      </span>
                    </label>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  🏌️ 팀 뽑기 게임 시작하기
                </button>
              </form>
              <Link href={`/rounds/${round.id}/teams/edit`} className="btn btn-secondary w-full">
                ✍️ 수동으로 편성하기
              </Link>
            </>
          ) : (
            <p className="text-foreground/70">관리자가 팀을 편성하고 있어요. 잠시만 기다려주세요!</p>
          )}

          {member.is_admin && !assignment && (
            <form action={reopenRsvpAction}>
              <input type="hidden" name="round_id" value={round.id} />
              <button type="submit" className="btn btn-secondary w-full">
                참가 체크 다시 열기
              </button>
            </form>
          )}

          {member.is_admin && (
            <details className="rounded-xl border-2 border-sand p-3">
              <summary className="cursor-pointer font-bold">👥 참가자 명단 확인/수정</summary>
              <div className="mt-3">
                <ParticipantChecklist
                  members={members.filter((m) => !m.is_guest || participantMap.has(m.id))}
                  participantMap={participantMap}
                  roundId={round.id}
                  isAdmin={member.is_admin}
                />
              </div>
            </details>
          )}
        </section>
      )}

      {(round.status === "확정" || round.status === "완료") && assignment && (
        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">팀 편성 결과</h2>
            <span className="text-sm text-foreground/50">
              {TEAM_MODE_LABEL[assignment.mode]} · {assignment.attempt_no}차
            </span>
          </div>
          <TeamResultsList
            teams={assignment.teams}
            getName={getName}
            memberOrder={members.map((m) => m.id)}
          />
          <Link href={`/rounds/${round.id}/draw`} className="btn btn-secondary w-full">
            🎱 뽑기 화면 다시 보기
          </Link>
          {member.is_admin && (
            <details className="rounded-xl border-2 border-sand p-3">
              <summary className="cursor-pointer font-bold">
                🔁 {round.status === "완료" ? "지난 팀 편성 수정하기" : "다시 팀짜기"}
              </summary>
              <form action={createTeamAssignmentAction} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="round_id" value={round.id} />
                {MODES.map((mode, idx) => (
                  <label key={mode} className="flex items-center gap-2">
                    <input type="radio" name="mode" value={mode} defaultChecked={idx === 0} />
                    {TEAM_MODE_LABEL[mode]}
                  </label>
                ))}
                <button type="submit" className="btn btn-primary w-full">
                  새로 뽑기
                </button>
              </form>
              <Link
                href={`/rounds/${round.id}/teams/edit`}
                className="btn btn-secondary mt-2 w-full"
              >
                ✍️ 수동으로 수정하기
              </Link>
            </details>
          )}
        </section>
      )}

      {round.status === "확정" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">라운딩 진행</h2>
          <Link href={`/rounds/${round.id}/score`} className="btn btn-primary w-full">
            📝 스코어보드 입력하기
          </Link>
        </section>
      )}

      {round.status === "완료" && (
        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold">스코어</h2>
          <ScoreRankedList
            scores={scores}
            averageByMember={averageByMember}
            getName={getName}
            assignedMemberIds={assignment ? Object.values(assignment.teams).flat() : []}
          />
          {member.is_admin && (
            <Link href={`/rounds/${round.id}/score`} className="btn btn-secondary w-full">
              📝 스코어 수정하기
            </Link>
          )}
          <Link href={`/rounds/${round.id}/photos`} className="btn btn-secondary w-full">
            📸 추억사진 {result && result.photos.length > 0 ? `보기 (${result.photos.length})` : "올리기"}
          </Link>
          <Link href="/memories" className="btn btn-secondary w-full">
            📸 추억 페이지에서 보기
          </Link>
        </section>
      )}
    </main>
  );
}
