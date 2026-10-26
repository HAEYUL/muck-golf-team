"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { countPageView, onNavigationStart, startNavigationProgress } from "@/lib/navigation";

/** 다른 화면으로 이동하는 동안 화면 맨 위에 초록색 로딩 막대를 보여준다 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<{ tick?: number; hide?: number; giveUp?: number }>({});

  // 같은 사이트 안의 링크를 누르면 시작. Next.js 링크가 클릭을 가로채기 전에 보도록 캡처 단계에서 듣는다
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname + url.search === window.location.pathname + window.location.search) return;
      startNavigationProgress();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    const t = timers.current;
    return onNavigationStart(() => {
      window.clearTimeout(t.hide);
      window.clearInterval(t.tick);
      window.clearTimeout(t.giveUp);
      setProgress(10);
      // 90%까지 점점 느려지며 차오른다
      t.tick = window.setInterval(() => {
        setProgress((p) => (p === null || p >= 90 ? p : p + (90 - p) * 0.1));
      }, 200);
      t.giveUp = window.setTimeout(() => setProgress(null), 15000);
    });
  }, []);

  // 화면이 바뀌면 끝까지 채우고 사라진다
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [lastRouteKey, setLastRouteKey] = useState(routeKey);
  if (routeKey !== lastRouteKey) {
    setLastRouteKey(routeKey);
    setProgress((p) => (p === null ? p : 100));
  }
  useEffect(() => {
    countPageView();
    const t = timers.current;
    window.clearInterval(t.tick);
    window.clearTimeout(t.giveUp);
    t.hide = window.setTimeout(() => setProgress(null), 300);
  }, [routeKey]);

  if (progress === null) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1"
    >
      <div
        className="h-full bg-fairway shadow-[0_0_8px_var(--fairway)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
