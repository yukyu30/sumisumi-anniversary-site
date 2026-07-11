import type { Metadata } from "next";
import { Shippori_Mincho } from "next/font/google";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "墨澄 周年記念ジェネレーター",
    template: "%s | 墨澄 周年記念ジェネレーター",
  },
  description:
    "アバター「墨澄 -SumiSumi-」との周年記念を証明付き画像にして残そう。生成した画像はこのサイトでいつでも本物か検証できます。",
  openGraph: {
    title: "墨澄 周年記念ジェネレーター",
    description:
      "墨澄 -SumiSumi- との周年を、検証できる記念画像に。発行証明は暗号化されて画像に焼き込まれます。",
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
    <html lang="ja" className={`${shipporiMincho.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#f7f4ec] text-stone-900">
        {children}
      </body>
    </html>
  );
}
