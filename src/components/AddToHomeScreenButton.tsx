"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToHomeScreenButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleClick() {
    if (installEvent) {
      installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } else {
      setShowGuide(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="btn btn-secondary col-span-2 flex items-center justify-center gap-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fairway text-sm font-extrabold text-white">
          먹회
        </span>
        홈 화면에 바로가기 추가
      </button>

      {showGuide && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowGuide(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowGuide(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            className="card flex max-w-xs flex-col items-center gap-3 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fairway text-lg font-extrabold text-white">
              먹회
            </span>
            <p className="font-bold">홈 화면에 추가하는 방법</p>
            <p className="text-sm text-foreground/70">
              아이폰(사파리): 하단 공유 버튼 → &quot;홈 화면에 추가&quot;
              <br />
              안드로이드(크롬): 오른쪽 위 메뉴(⋮) → &quot;홈 화면에 추가&quot;
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="btn btn-primary w-full"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
