import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

const NAV_START_EVENT = "muck:nav-start";

/** 화면 맨 위 로딩 막대를 시작한다 (NavigationProgress가 듣고 있음) */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(NAV_START_EVENT));
}

export function onNavigationStart(listener: () => void) {
  window.addEventListener(NAV_START_EVENT, listener);
  return () => window.removeEventListener(NAV_START_EVENT, listener);
}

let pageViews = 0;

/** NavigationProgress가 화면이 바뀔 때마다 호출한다 */
export function countPageView() {
  pageViews += 1;
}

/** 이 앱 안에서 바로 전 화면이 있는지 (카톡 링크 등으로 바로 들어왔으면 false) */
function canGoBackInApp(): boolean {
  const nav = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  if (typeof nav?.canGoBack === "boolean") return nav.canGoBack;
  return pageViews > 1;
}

/** 바로 전 화면으로 돌아간다. 전 화면이 없으면 fallbackHref로 이동 */
export function goBack(router: Router, fallbackHref: string) {
  startNavigationProgress();
  if (canGoBackInApp()) router.back();
  else router.replace(fallbackHref);
}
