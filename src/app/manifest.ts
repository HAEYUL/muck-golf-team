import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "먹회골프",
    short_name: "먹회",
    description: "먹회골프 팀 편성 게임 & 라운딩 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ea",
    theme_color: "#2f7a4f",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
