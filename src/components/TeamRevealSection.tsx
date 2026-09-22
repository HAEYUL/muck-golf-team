import { TEAM_MODE_LABEL, TEAM_THEMES } from "@/lib/types";
import type { TeamMode } from "@/lib/types";
import { TeamRouletteButton } from "./TeamRouletteButton";

type Participant = { id: string; name: string };

export function TeamRevealSection({
  roundId,
  participants,
  mode,
  teamByMember,
  revealedIds,
  currentMemberId,
  revealAction,
}: {
  roundId: string;
  participants: Participant[];
  mode: TeamMode | null;
  teamByMember: Record<string, number>;
  revealedIds: string[];
  currentMemberId: string;
  revealAction: (formData: FormData) => void;
}) {
  const revealedSet = new Set(revealedIds);
  const waitingNames = participants
    .filter((p) => !revealedSet.has(p.id))
    .map((p) => p.name);

  const wheelTeams = Array.from(new Set(Object.values(teamByMember)))
    .sort((a, b) => a - b)
    .map((no) => {
      const theme = TEAM_THEMES[no - 1] ?? TEAM_THEMES[0];
      return { no, name: theme.name, color: theme.color };
    });

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-lg font-bold">참가자 명단</h2>

      {mode && (
        <div className="rounded-xl bg-fairway/10 px-4 py-3 text-center">
          <p className="text-sm font-bold text-fairway-dark">
            🎲 이번엔 <span className="text-fairway">{TEAM_MODE_LABEL[mode]}</span> 방식으로
            조를 편성해요!
          </p>
        </div>
      )}

      {mode && (
        <p className="text-center text-sm text-foreground/70">
          참가자는 이름을 눌러 조편성 게임에 참가해 주세요.
          <br />
          모든 참가자의 게임이 끝나면 팀 확정이 완료됩니다.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {participants.map((p) => {
          const isRevealed = revealedSet.has(p.id);
          const isMe = p.id === currentMemberId;
          const teamNo = teamByMember[p.id];
          const theme = teamNo ? TEAM_THEMES[teamNo - 1] ?? TEAM_THEMES[0] : null;

          if (isRevealed && theme) {
            return (
              <div
                key={p.id}
                className="name-box flex-col gap-1"
                style={{ background: theme.color, borderColor: theme.color, color: "white" }}
              >
                <span>{p.name}</span>
                <span className="text-xs font-semibold opacity-90">{theme.name}</span>
              </div>
            );
          }

          if (mode && isMe && teamNo && wheelTeams.length > 0) {
            return (
              <TeamRouletteButton
                key={p.id}
                roundId={roundId}
                name={p.name}
                wheelTeams={wheelTeams}
                myTeamNo={teamNo}
                revealAction={revealAction}
              />
            );
          }

          return (
            <div key={p.id} className="name-box opacity-60">
              {p.name}
            </div>
          );
        })}
      </div>

      {mode && (
        <p className="text-center text-sm font-semibold text-foreground/70">
          {participants.length - waitingNames.length} / {participants.length}명 완료
          {waitingNames.length > 0 && (
            <>
              <br />
              <span className="text-foreground/50">대기중: {waitingNames.join(", ")}</span>
            </>
          )}
        </p>
      )}
    </section>
  );
}
