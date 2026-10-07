import Link from "next/link";
import { notFound } from "next/navigation";
import { listMembers } from "@/lib/queries";
import { getPersonalRound, listGolfRecords } from "@/lib/records";
import { requireUnlockedRecordsPage } from "@/lib/records-page";
import { PersonalRoundForm } from "@/components/PersonalRoundForm";

export const dynamic = "force-dynamic";

export default async function EditPersonalRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireUnlockedRecordsPage();
  const [round, members, records] = await Promise.all([
    getPersonalRound(member.id, id),
    listMembers(),
    listGolfRecords(member.id),
  ]);
  if (!round) notFound();

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/me/records" className="text-sm font-semibold text-fairway">
          ← 기록장으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">✏️ 기록 수정</h1>
      </header>
      <PersonalRoundForm
        round={round}
        members={members
          .filter(
            (m) => ((m.is_active && !m.is_guest) || round.companion_member_ids.includes(m.id)) && m.id !== member.id
          )
          .map((m) => ({ id: m.id, name: m.name }))}
        golfCourseSuggestions={[...new Set(records.map((r) => r.golf_course))]}
      />
    </main>
  );
}
