import Link from "next/link";
import type { Round, RoundParticipant, TeamAssignment } from "@/lib/types";
import { TEAM_THEMES } from "@/lib/types";
import { formatCourseLabel, formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

/** 상태별로 "나에게 필요한 것"을 한 줄로 알려준다. highlight면 눈에 띄게 표시. */
function getMyLine({
  round,
  participants,
  assignment,
  revealedIds,
  currentMemberId,
}: {
  round: Round;
  participants: RoundParticipant[];
  assignment: TeamAssignment | null;
  revealedIds: string[];
  currentMemberId: string;
}): { text: string; highlight: boolean } {
  const myTeamNo = assignment
    ? Object.entries(assignment.teams).find(([, ids]) => ids.includes(currentMemberId))?.[0]
    : undefined;

  switch (round.status) {
    case "모집중": {
      const myEntry = participants.find((p) => p.member_id === currentMemberId);
      if (!myEntry) return { text: "내 응답: 아직 안 했어요 ⚠️", highlight: true };
      return { text: myEntry.attending ? "내 응답: 참가 O" : "내 응답: 불참 X", highlight: false };
    }
    case "조편성중":
      if (!assignment) return { text: "팀 편성 준비중", highlight: false };
      if (!myTeamNo) return { text: "조편성 게임 진행중", highlight: false };
      return revealedIds.includes(currentMemberId)
        ? { text: "조편성 게임 완료 ✓", highlight: false }
        : { text: "🎲 조편성 게임에 참여해 주세요", highlight: true };
    case "확정":
      if (!myTeamNo) return { text: "팀 확정", highlight: false };
      return {
        text: `내 팀: ${TEAM_THEMES[Number(myTeamNo) - 1]?.name ?? `${myTeamNo}조`}`,
        highlight: false,
      };
    case "완료":
      return { text: "스코어 보기", highlight: false };
  }
}

/** 홈 화면용 짧은 라운딩 카드. 누르면 라운딩 상세 페이지로 이동한다. */
export function RoundSummaryCard(props: {
  round: Round;
  participants: RoundParticipant[];
  assignment: TeamAssignment | null;
  revealedIds: string[];
  currentMemberId: string;
}) {
  const { round, participants } = props;
  const attendingCount = participants.filter((p) => p.attending).length;
  const myLine = getMyLine(props);

  return (
    <Link
      href={`/rounds/${round.id}`}
      className="card flex items-center gap-3 border-2 border-transparent !py-3 transition-colors hover:border-fairway"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={round.status} />
          <span className="text-sm font-semibold text-foreground/70">
            {formatDate(round.date)} · {formatTime(round.time)}
          </span>
        </div>
        <p className="truncate text-lg font-extrabold text-fairway-dark">
          {formatCourseLabel(round)}
        </p>
        <p className="text-sm">
          <span className="text-foreground/60">참가 {attendingCount}명 · </span>
          <span
            className={myLine.highlight ? "font-bold text-accent" : "text-foreground/70"}
          >
            {myLine.text}
          </span>
        </p>
      </div>
      <span aria-hidden="true" className="text-2xl text-foreground/30">
        ›
      </span>
    </Link>
  );
}
