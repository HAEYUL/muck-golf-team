"use client";

import { useState, useTransition } from "react";
import { uploadRoundPhotosAction } from "@/app/rounds/actions";

/** 캔버스로 리사이즈 + 재압축해서 용량이 큰 원본 사진도 안전하게 올라가게 한다 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const maxDimension = 1920;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const targetBytes = 1_000_000;
  let quality = 0.82;
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  while (blob && blob.size > targetBytes && quality > 0.35) {
    quality -= 0.15;
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  }
  if (!blob) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: file.lastModified });
}

export function UploadRoundPhotosForm({ roundId }: { roundId: string }) {
  const [status, setStatus] = useState<"idle" | "compressing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("photos") as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) return;

    setError(null);
    setStatus("compressing");
    try {
      const compressed = await Promise.all(files.map(compressImage));
      const formData = new FormData();
      formData.set("round_id", roundId);
      compressed.forEach((file) => formData.append("photos", file));

      setStatus("idle");
      startTransition(() => {
        uploadRoundPhotosAction(formData);
      });
    } catch {
      setStatus("idle");
      setError("사진 처리 중 문제가 생겼어요. 다시 시도해주세요.");
    }
  }

  const busy = status === "compressing" || isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="file"
        name="photos"
        accept="image/*"
        multiple
        required
        disabled={busy}
        className="rounded-lg border-2 border-dashed border-sand p-4"
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {status === "compressing" ? "사진 압축 중..." : isPending ? "업로드 중..." : "업로드하기"}
      </button>
    </form>
  );
}
