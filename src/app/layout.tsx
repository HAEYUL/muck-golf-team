import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SongMiniPlayer } from "@/components/MuckSongButtons";
import { TouchActivation } from "@/components/TouchActivation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "먹회골프",
  description: "먹회골프 팀 편성 게임 & 라운딩 기록",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TouchActivation />
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col px-4 pb-10 pt-6">
          {children}
        </div>
        <SongMiniPlayer />
      </body>
    </html>
  );
}
