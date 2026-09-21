import type { Member } from "@/lib/types";

export function MemberLineup({
  members,
  currentMemberId,
}: {
  members: Member[];
  currentMemberId?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {members.map((m) => {
        const isMe = m.id === currentMemberId;
        return (
          <div
            key={m.id}
            className="name-box flex-col gap-0.5"
            style={{
              borderColor: isMe ? "var(--fairway)" : undefined,
              background: isMe ? "rgba(47,122,79,0.08)" : undefined,
            }}
          >
            <span>{m.name}</span>
          </div>
        );
      })}
    </div>
  );
}
