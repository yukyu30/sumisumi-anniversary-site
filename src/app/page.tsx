import Link from "next/link";
import { SumisumiHero } from "@/components/SumisumiHero";

const steps = [
  {
    no: "01",
    title: "ID を入力",
    body: "VRChat や X の ID を入れるだけ。発行時刻はサーバーが刻印します。",
  },
  {
    no: "02",
    title: "色と写真を選んで生成",
    body: "フレームの色（青／オレンジ）と写真を選ぶと、発行証明つきの記念画像ができます。",
  },
  {
    no: "03",
    title: "いつでも検証",
    body: "画像上部の白黒もようを読み込むと ID と発行時刻が復元され、本物と証明できます。",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* ヒーロー: オレンジのカラーブロック + 傾いたワードマーク + 墨澄 */}
      <section className="relative overflow-hidden bg-brand-orange">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="wordmark -rotate-6 select-none whitespace-nowrap text-[24vw] leading-none text-zinc-900/90 md:text-[16vw]">
            sumisumi
          </span>
        </div>
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pb-14 pt-20 md:flex-row">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-bold tracking-widest text-white">
              SUMISUMI 2ND ANNIVERSARY
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-zinc-900 md:text-5xl">
              墨澄との2年を、
              <br />
              証明できる記念に。
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm font-medium leading-relaxed text-zinc-800 md:mx-0">
              アバター「墨澄 -SumiSumi-」の2周年を、記念画像にして残そう。
              画像の上部には暗号化された発行証明が焼き込まれ、SNS
              で圧縮されてもこのサイトで「本物」を確かめられます。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/generate"
                className="rounded-full bg-zinc-900 px-8 py-3.5 font-bold text-white shadow-lg transition hover:bg-zinc-700"
              >
                記念画像をつくる
              </Link>
              <Link
                href="/verify"
                className="rounded-full bg-white px-8 py-3.5 font-bold text-zinc-900 shadow-lg transition hover:bg-zinc-100"
              >
                画像を検証する
              </Link>
            </div>
          </div>
          <div className="w-full max-w-xs flex-1 md:max-w-sm">
            <SumisumiHero />
          </div>
        </div>
      </section>

      {/* しくみ */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-black md:text-3xl">しくみ</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.no}
              className={`rounded-3xl border-2 p-7 ${
                i === 1
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-zinc-200"
              }`}
            >
              <p
                className={`wordmark text-4xl ${
                  i === 1 ? "text-brand-blue" : "text-brand-orange"
                }`}
              >
                {step.no}
              </p>
              <h3 className="mt-3 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 証明バナー（青ブロック） */}
      <section className="bg-brand-blue">
        <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center text-white">
          <h2 className="text-xl font-black md:text-2xl">
            「システムが発行した本物」を証明
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/90">
            発行証明は AES-256-GCM
            で暗号化され、鍵はサーバーだけが保管します。復号と認証タグの検証に成功した画像だけが「本物」と表示されます。
          </p>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs font-medium text-zinc-400">
          <p>墨澄 -SumiSumi- 2周年記念ジェネレーター</p>
          <a
            href="https://lp.suzuri.jp/3d-t-shirt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-600"
          >
            墨澄について →
          </a>
        </div>
      </footer>
    </main>
  );
}
