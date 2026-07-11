import Link from "next/link";
import { SumisumiHero } from "@/components/SumisumiHero";

const steps = [
  {
    title: "ID と周年数を入力",
    body: "VRChat や X の ID と、迎えた周年数を入力します。発行時刻はサーバーが刻印します。",
  },
  {
    title: "写真を選んで生成",
    body: "思い出の写真に墨の額縁と、暗号化された発行証明のもようが合成されます。",
  },
  {
    title: "いつでも検証",
    body: "画像上部の白黒もようを読み込むと ID と発行時刻が復元され、本物と証明できます。",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* ヒーロー */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 pb-16 pt-14 md:flex-row md:gap-6">
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm tracking-[0.3em] text-stone-500">
            SUMISUMI ANNIVERSARY
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            墨澄との日々を、
            <br />
            証明できる記念に。
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-stone-600 md:mx-0">
            アバター「墨澄 -SumiSumi-」と迎えた周年を、記念画像にして残しましょう。
            画像の上部には暗号化された発行証明が焼き込まれ、
            SNS で圧縮されてもこのサイトでいつでも「本物」を確かめられます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            <Link
              href="/generate"
              className="rounded-lg bg-stone-900 px-8 py-3 font-bold text-white transition hover:bg-stone-700"
            >
              記念画像をつくる
            </Link>
            <Link
              href="/verify"
              className="rounded-lg border border-stone-400 px-8 py-3 font-bold transition hover:bg-stone-100"
            >
              画像を検証する
            </Link>
          </div>
        </div>
        <div className="w-full max-w-sm flex-1">
          <SumisumiHero />
        </div>
      </section>

      {/* しくみ */}
      <section className="border-t border-stone-200 bg-white/60">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <h2 className="text-center text-2xl font-bold">しくみ</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center md:text-left">
                <p className="text-4xl font-bold text-stone-300">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-stone-400">
            発行証明は AES-256-GCM
            で暗号化され、鍵はサーバーだけが保管します。復号と認証タグの検証に成功した画像だけが「このシステムが発行した本物」と表示されます。
          </p>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-xs text-stone-400">
          <p>墨澄 -SumiSumi- 周年記念ジェネレーター</p>
          <a
            href="https://lp.suzuri.jp/3d-t-shirt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-600"
          >
            墨澄について
          </a>
        </div>
      </footer>
    </main>
  );
}
