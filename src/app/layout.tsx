import type { Metadata } from "next";
import { Dela_Gothic_One, Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 英字ワードマーク・見出し用
const notoSans = Noto_Sans({
  variable: "--font-wordmark",
  weight: ["700", "800", "900"],
  subsets: ["latin"],
});

// 日本語ゴシック（本文・見出し）
const notoSansJp = Noto_Sans_JP({
  variable: "--font-sans",
  weight: ["400", "500", "700", "900"],
  preload: false,
});

// 極太ディスプレイゴシック（大見出し「2周年」など）
const delaGothic = Dela_Gothic_One({
  variable: "--font-display",
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sumisumi-anniversary.lolipop-now.app"),
  title: {
    default: "墨澄2周年記念ジェネレーター",
    template: "%s | 墨澄2周年記念ジェネレーター",
  },
  description:
    "アバター「墨澄 -SumiSumi-」の2周年をお祝い。お気に入りの写真に記念フレームを重ねて、記念画像をつくろう。",
  openGraph: {
    title: "墨澄2周年記念ジェネレーター",
    description:
      "墨澄 -SumiSumi- の2周年をお祝い。写真を選ぶだけで、記念画像ができあがります。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSans.variable} ${notoSansJp.variable} ${delaGothic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
