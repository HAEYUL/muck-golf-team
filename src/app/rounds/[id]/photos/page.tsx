import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getRound, getRoundResult } from "@/lib/queries";
import { formatCourseLabel } from "@/lib/format";
import { PhotoGallery } from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

export default async function RoundPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const round = await getRound(id);
  if (!round) notFound();

  const result = await getRoundResult(id);
  const photos = result?.photos ?? [];

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <Link href={`/rounds/${id}`} className="text-sm font-semibold text-fairway">
          ← 라운딩으로
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">📸 추억사진</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <Link href={`/rounds/${id}/photos/upload`} className="btn btn-primary w-full">
        추억사진 올리기
      </Link>

      <PhotoGallery photos={photos} roundId={id} isAdmin={member.is_admin} />
    </main>
  );
}
