/**
 * 먹회골프송 재생기 (브라우저 전용).
 * 페이지 이동(소프트 내비게이션)에도 같은 Audio를 쓰도록 모듈 단위 싱글턴으로 둔다.
 *
 * 모바일 브라우저는 사용자가 화면을 누르기 전에는 소리 있는 자동재생을 막는다.
 * 그래서 로그인 버튼을 누르는 순간 unlockForLogin()으로 오디오를 "잠금 해제"해 두고,
 * 홈 화면이 뜨면 consumeLoginAutoplay()가 실제 재생을 시작한다.
 */

const SRC = "/audio/muck-golf-song.mp3";
/** "음악 끄기"를 누른 사람은 다음 로그인부터 자동재생하지 않는다 */
const MUTED_KEY = "muck-song-muted";
/** 로그인 직후 한 번만 자동재생하기 위한 표시 */
const AUTOPLAY_KEY = "muck-song-autoplay";

let audio: HTMLAudioElement | null = null;
let unlocking = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SRC);
    audio.preload = "auto";
    audio.addEventListener("play", notify);
    audio.addEventListener("pause", notify);
    audio.addEventListener("ended", notify);
  }
  return audio;
}

function readStorage(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: "local" | "session", key: string, value: string | null) {
  try {
    const s = storage === "local" ? localStorage : sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // 사생활 보호 모드 등에서 저장소를 못 써도 재생 자체는 동작해야 한다
  }
}

export function subscribeSong(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isSongPlaying(): boolean {
  return !!audio && !audio.paused && !unlocking;
}

export function playSong() {
  writeStorage("local", MUTED_KEY, null);
  const a = getAudio();
  unlocking = false;
  a.muted = false;
  a.currentTime = 0;
  a.play().catch(notify);
}

export function stopSong() {
  writeStorage("local", MUTED_KEY, "1");
  pauseSong();
}

/** 끄기 기록 없이 멈춘다 (홈 화면을 벗어날 때) */
export function pauseSong() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/** 로그인 버튼을 누르는 순간(사용자 동작 안에서) 호출한다 */
export function unlockForLogin() {
  if (readStorage("local", MUTED_KEY)) return;
  writeStorage("session", AUTOPLAY_KEY, "1");
  const a = getAudio();
  if (!a.paused) return;
  unlocking = true;
  a.muted = true;
  a.play()
    .then(() => {
      if (!unlocking) return;
      a.pause();
      a.currentTime = 0;
    })
    .catch(() => {})
    .finally(() => {
      if (unlocking) {
        unlocking = false;
        a.muted = false;
      }
      notify();
    });
}

/** 홈 화면이 뜰 때 호출한다. 로그인 직후라면 한 번 재생한다 */
export function consumeLoginAutoplay() {
  if (!readStorage("session", AUTOPLAY_KEY)) return;
  writeStorage("session", AUTOPLAY_KEY, null);
  if (readStorage("local", MUTED_KEY)) return;
  playSong();
}
