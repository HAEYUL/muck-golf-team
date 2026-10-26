"use client";

import { useRouter } from "next/navigation";
import { goBack } from "@/lib/navigation";

/** 바로 전 화면으로 돌아가는 버튼. 전 화면이 없으면(링크로 바로 들어온 경우) fallbackHref로 */
export function BackButton({
  fallbackHref,
  className = "text-sm font-semibold text-fairway",
  children = "← 뒤로",
}: {
  fallbackHref: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <a
      href={fallbackHref}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        goBack(router, fallbackHref);
      }}
    >
      {children}
    </a>
  );
}
