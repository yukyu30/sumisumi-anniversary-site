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
  title: {
    default: "墨澄2周年記念ジェネレーター",
    template: "%s | 墨澄2周年記念ジェネレーター",
  },
  description:
    "アバター「墨澄 -SumiSumi-」の2周年記念を証明付き画像にして残そう。生成した画像はこのサイトでいつでも本物か検証できます。",
  openGraph: {
    title: "墨澄2周年記念ジェネレーター",
    description:
      "墨澄 -SumiSumi- の2周年を、検証できる記念画像に。発行証明は暗号化されて画像に焼き込まれます。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
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
