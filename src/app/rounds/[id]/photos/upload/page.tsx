import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { getRound } from "@/lib/queries";
import { formatCourseLabel } from "@/lib/format";
import { uploadRoundPhotosAction } from "../../../actions";

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
        <Link href={`/rounds/${id}/photos`} className="text-sm font-semibold text-fairway">
          ← 추억사진으로
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-extrabold text-fairway-dark">추억사진 올리기</h1>
        <p className="text-foreground/70">{formatCourseLabel(round)}</p>
      </div>

      <form action={uploadRoundPhotosAction} className="flex flex-col gap-3">
        <input type="hidden" name="round_id" value={id} />
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          required
          className="rounded-lg border-2 border-dashed border-sand p-4"
        />
        <button type="submit" className="btn btn-primary w-full">
          업로드하기
        </button>
      </form>
    </main>
  );
}
