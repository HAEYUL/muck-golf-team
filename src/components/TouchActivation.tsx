"use client";

import { useEffect } from "react";

/** iOS Safari는 터치 이벤트 리스너가 하나라도 있어야 :active(눌림) 스타일이 반응한다 */
export function TouchActivation() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
