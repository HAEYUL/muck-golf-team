import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getRound } from "@/lib/queries";
import { formatCourseLabel } from "@/lib/format";
import { UploadRoundPhotosForm } from "@/components/UploadRoundPhotosForm";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function UploadRoundPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/");

  const round = await getRound(id);
  if (!round) notFound();

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <BackButton fallbackHref={`/rounds/${id}/photos`} />
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">추억사진 올리기</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <UploadRoundPhotosForm roundId={id} />
    </main>
  );
}
