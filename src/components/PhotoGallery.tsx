"use client";

import { useState, useTransition } from "react";
import { deleteRoundPhotoAction } from "@/app/rounds/actions";

export function PhotoGallery({
  photos,
  roundId,
  isAdmin = false,
}: {
  photos: string[];
  roundId?: string;
  isAdmin?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = isAdmin && !!roundId;

  function handleDelete(url: string) {
    if (!roundId) return;
    if (!window.confirm("이 추억사진을 삭제할까요? 되돌릴 수 없어요.")) return;

    const formData = new FormData();
    formData.set("round_id", roundId);
    formData.set("photo_url", url);

    setDeletingUrl(url);
    startTransition(async () => {
      await deleteRoundPhotoAction(formData);
      setDeletingUrl(null);
      setSelected((current) => (current === url ? null : current));
    });
  }

  if (photos.length === 0) {
    return (
      <p className="card text-center text-foreground/60">
        아직 올라온 사진이 없어요. 첫 추억사진을 올려보세요!
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((url, idx) => (
          <div key={url} className="relative overflow-hidden rounded-xl border-2 border-sand">
            <button type="button" onClick={() => setSelected(url)} className="block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`추억 사진 ${idx + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(url);
                }}
                disabled={isPending && deletingUrl === url}
                aria-label="사진 삭제"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white disabled:opacity-50"
              >
                {isPending && deletingUrl === url ? "…" : "✕"}
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelected(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected}
            alt="추억 사진 크게 보기"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(selected);
              }}
              disabled={isPending && deletingUrl === selected}
              className="btn btn-danger absolute bottom-6 !px-6 !py-3 disabled:opacity-50"
            >
              {isPending && deletingUrl === selected ? "삭제 중..." : "🗑 이 사진 삭제"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
