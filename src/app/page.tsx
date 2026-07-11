import Link from "next/link";
import { Confetti } from "@/components/confetti/Confetti";
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
      {/* ヒーロー: 紙吹雪の祝福バナー */}
      <section className="relative overflow-hidden bg-brand-yellow">
        <Confetti />

        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-14 pt-14 text-center">
          <span className="anniv-word inline-block rounded-full bg-zinc-900 px-6 py-2 text-[0.65rem] text-white shadow-md md:text-xs">
            墨澄 SUMISUMI ・ 2nd ANNIVERSARY
          </span>

          {/* 立ち絵の背後に大きな「2周年」 */}
          <div className="relative mt-6 flex w-full items-end justify-center">
            <h1
              aria-label="祝 2周年"
              className="anniv-number pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[42vw] md:text-[20rem]"
            >
              2周年
            </h1>
            <div className="relative z-10 w-full max-w-sm">
              <SumisumiHero />
            </div>
          </div>

          <p className="mt-6 text-lg font-black tracking-wide text-zinc-900 md:text-2xl">
            墨澄との2年を、<span className="text-brand-red">証明できる記念</span>に。
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-zinc-800">
            ID を入れて写真を選ぶだけ。画像の上部には暗号化された発行証明が焼き込まれ、
            SNS で圧縮されてもこのサイトで「本物」を確かめられます。
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
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
      </section>

      {/* しくみ */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="display text-center text-2xl md:text-3xl">しくみ</h2>
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
          <h2 className="display text-xl md:text-2xl">
            「システムが発行した本物」を証明
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/90">
            発行証明は AES-256-GCM
            で暗号化され、鍵はサーバーだけが保管します。復号と認証タグの検証に成功した画像だけが「本物」と表示されます。
          </p>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end px-6 py-6 text-xs font-medium text-zinc-400">
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
