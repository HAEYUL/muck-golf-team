"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  consumeLoginAutoplay,
  isSongPlaying,
  pauseSong,
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
    // 홈 화면을 벗어나면 노래도 멈춘다 (다른 화면엔 끄기 버튼이 없으므로)
    return () => pauseSong();
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
