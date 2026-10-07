import Link from "next/link";
import { listMembers } from "@/lib/queries";
import { listGolfRecords } from "@/lib/records";
import { requireUnlockedRecordsPage } from "@/lib/records-page";
import { PersonalRoundForm } from "@/components/PersonalRoundForm";

export const dynamic = "force-dynamic";

export default async function NewPersonalRoundPage() {
  const member = await requireUnlockedRecordsPage();
  const [members, records] = await Promise.all([listMembers(), listGolfRecords(member.id)]);

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href="/me/records" className="text-sm font-semibold text-fairway">
          ← 기록장으로
        </Link>
        <h1 className="text-xl font-extrabold text-fairway-dark">🏌️ 개인 라운딩 기록</h1>
      </header>
      <PersonalRoundForm
        members={members
          .filter((m) => m.is_active && !m.is_guest && m.id !== member.id)
          .map((m) => ({ id: m.id, name: m.name }))}
        golfCourseSuggestions={[...new Set(records.map((r) => r.golf_course))]}
      />
    </main>
  );
}
