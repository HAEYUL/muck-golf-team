import type { Member, RoundParticipant } from "@/lib/types";
import { rsvpAction, resetParticipationAction } from "@/app/rounds/actions";

export function ParticipantChecklist({
  members,
  participantMap,
  roundId,
  isAdmin,
}: {
  members: Member[];
  participantMap: Map<string, RoundParticipant>;
  roundId: string;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {members.map((m) => {
        const entry = participantMap.get(m.id);
        const label = entry ? (entry.attending ? "참가" : "불참") : "미응답";
        return (
          <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <span className="font-medium">{m.name}</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-semibold ${
                  entry?.attending
                    ? "text-fairway"
                    : entry
                      ? "text-danger"
                      : "text-foreground/40"
                }`}
              >
                {label}
              </span>
              {isAdmin && (
                <>
                  <form action={rsvpAction}>
                    <input type="hidden" name="round_id" value={roundId} />
                    <input type="hidden" name="member_id" value={m.id} />
                    <input type="hidden" name="attending" value="true" />
                    <button className="btn btn-secondary !px-2 !py-1 !text-xs">O</button>
                  </form>
                  <form action={rsvpAction}>
                    <input type="hidden" name="round_id" value={roundId} />
                    <input type="hidden" name="member_id" value={m.id} />
                    <input type="hidden" name="attending" value="false" />
                    <button className="btn btn-danger !px-2 !py-1 !text-xs">X</button>
                  </form>
                  <form action={resetParticipationAction}>
                    <input type="hidden" name="round_id" value={roundId} />
                    <input type="hidden" name="member_id" value={m.id} />
                    <button
                      className="btn btn-secondary !px-2 !py-1 !text-xs"
                      aria-label="참가체크 초기화"
                    >
                      ↺
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
