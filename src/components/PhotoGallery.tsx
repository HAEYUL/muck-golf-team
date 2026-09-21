"use client";

import { useState } from "react";

export function PhotoGallery({ photos }: { photos: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);

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
          <button
            key={url}
            type="button"
            onClick={() => setSelected(url)}
            className="overflow-hidden rounded-xl border-2 border-sand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`추억 사진 ${idx + 1}`}
              className="aspect-square w-full object-cover"
            />
          </button>
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
        </div>
      )}
    </>
  );
}
