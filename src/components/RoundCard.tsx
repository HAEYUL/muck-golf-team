import Link from "next/link";
import type { Round, RoundParticipant } from "@/lib/types";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { RoundProgressSteps } from "./RoundProgressSteps";
import { rsvpAction, closeRsvpAction } from "@/app/rounds/actions";

export function RoundCard({
  round,
  participants,
  currentMemberId,
  isAdmin,
}: {
  round: Round | null;
  participants: RoundParticipant[];
  currentMemberId: string;
  isAdmin: boolean;
}) {
  if (!round) {
    return (
      <section className="card text-center">
        <p className="text-foreground/70">예정된 라운딩이 없어요 ⛳️</p>
        {isAdmin && (
          <Link href="/admin" className="btn btn-primary mt-4 w-full">
            새 라운딩 만들기
          </Link>
        )}
      </section>
    );
  }

  const attendingCount = participants.filter((p) => p.attending).length;
  const myEntry = participants.find((p) => p.member_id === currentMemberId);

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <StatusBadge status={round.status} />
        <span className="text-sm text-foreground/60">
          참가 확정 {attendingCount}명
        </span>
      </div>

      <RoundProgressSteps status={round.status} />

      <div>
        <p className="text-xl font-extrabold text-fairway-dark">
          {formatCourseLabel(round)}
        </p>
        <p className="text-foreground/70">
          {formatDate(round.date)} · {formatTime(round.time)}
        </p>
      </div>

      {round.status === "모집중" && (
        <>
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
          {isAdmin && (
            <form action={closeRsvpAction}>
              <input type="hidden" name="round_id" value={round.id} />
              <button type="submit" className="btn btn-secondary w-full">
                참가 체크 마감하기
              </button>
            </form>
          )}
        </>
      )}

      <Link href={`/rounds/${round.id}`} className="btn btn-secondary w-full">
        라운딩 상세 보기
      </Link>
    </section>
  );
}
