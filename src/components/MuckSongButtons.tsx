"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  consumeLoginAutoplay,
  isSongPlaying,
  playSong,
  stopSong,
  subscribeSong,
} from "@/lib/muck-song";

function useSongPlaying() {
  return useSyncExternalStore(subscribeSong, isSongPlaying, () => false);
}

/** 홈 화면 이름 아래: 재생 중이면 "음악 끄기", 멈춰 있으면 "먹회골프송" */
export function SongToggleButton() {
  const playing = useSongPlaying();

  useEffect(() => {
    consumeLoginAutoplay();
  }, []);

  return (
    <button
      type="button"
      onClick={playing ? stopSong : playSong}
      className={`mt-1 rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors ${
        playing
          ? "border-sand bg-white text-foreground/70"
          : "border-fairway bg-fairway/10 text-fairway-dark"
      }`}
    >
      {playing ? "🔇 음악 끄기" : "🎵 먹회골프송"}
    </button>
  );
}

/** 먹회골프 문구 아래: 처음부터 다시 듣기 */
export function SongReplayButton() {
  const playing = useSongPlaying();

  return (
    <button type="button" onClick={playSong} className="btn btn-secondary col-span-2">
      {playing ? "🎶 먹회골프송 재생 중 · 처음부터" : "🎵 먹회골프송 다시 듣기"}
    </button>
  );
}

/** 모든 화면 하단에 떠 있는 미니 플레이어. 재생 중일 때만 보여서 어느 화면에서든 끌 수 있다 */
export function SongMiniPlayer() {
  const playing = useSongPlaying();
  if (!playing) return null;

  return (
    <>
      {/* 막대가 페이지 맨 아래 내용을 가리지 않도록 같은 높이만큼 자리를 비워둔다 */}
      <div aria-hidden="true" className="h-16 shrink-0" />
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border-2 border-fairway bg-white px-4 py-2 shadow-lg">
          <span className="text-sm font-bold text-fairway-dark">
            <span className="mr-1 inline-block animate-pulse">🎵</span>먹회골프송 재생 중
          </span>
          <button
            type="button"
            onClick={stopSong}
            className="rounded-full border-2 border-sand bg-white px-3 py-1 text-xs font-bold text-foreground/70"
          >
            🔇 끄기
          </button>
        </div>
      </div>
    </>
  );
}
