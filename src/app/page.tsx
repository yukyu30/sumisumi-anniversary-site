import Link from "next/link";
import { Hero } from "@/components/hero/Hero";

const steps = [
  {
    no: "01",
    title: "フレームの色を選ぶ",
    body: "青とオレンジ、2周年をお祝いする2色から好きな方を選べます。",
  },
  {
    no: "02",
    title: "写真をアップロード",
    body: "お気に入りの1枚に、2周年記念のフレームが重なります。",
  },
  {
    no: "03",
    title: "ダウンロードして投稿",
    body: "できた記念画像を保存して、SNS でお祝いをシェアしよう。",
  },
];

// 墨澄のスペック（https://lp.suzuri.jp/3d-t-shirt より引用）
const sumisumiSpecs: { term: string; desc: string }[] = [
  {
    term: "3Dモデル情報",
    desc: "ソーシャルVRプラットフォーム用3Dアバター（Humanoid対応FBX / VRM同梱）",
  },
  {
    term: "同梱データ",
    desc: "本体モデルFBX・VRM / Unitypackage / テクスチャPNG / 改変用テクスチャPSD",
  },
  {
    term: "ポリゴン数",
    desc: "下着状態:△27,494 / メイン衣装:△69,256",
  },
  {
    term: "シェイプキー",
    desc: "顔: 242個 / 体: 28個",
  },
];

const sumisumiMembers: { role: string; name: string; handle: string }[] = [
  {
    role: "キャラクターデザイン / 衣装デザイン",
    name: "coalowl（コールアウル）",
    handle: "coalowl",
  },
  {
    role: "3Dモデリング / テクスチャ作成",
    name: "Yossha（ヨッシャ）",
    handle: "yoshino_alice2",
  },
  {
    role: "クリエイティブディレクション",
    name: "きりう（霧生 / KeyLew）",
    handle: "KeyLew_VRC",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* ヒーロー: 紙吹雪・立ち絵・2周年を 3D で立体配置（ドラッグで視差） */}
      <section className="relative overflow-hidden bg-brand-yellow">
        <h1 className="sr-only">墨澄 2周年記念</h1>
        <Hero />

        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-14 text-center">
          <p className="text-lg font-black tracking-wide text-zinc-900 md:text-2xl">
            写真を選んで、<span className="text-brand-red">墨澄2周年</span>
            の記念画像をつくろう。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/generate"
              className="rounded-full bg-zinc-900 px-9 py-4 text-lg font-bold text-white transition hover:bg-zinc-700"
            >
              記念画像をつくる
            </Link>
            <Link
              href="/verify"
              className="rounded-full border-2 border-zinc-900 px-9 py-4 text-lg font-bold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
            >
              記念画像を認証する
            </Link>
          </div>
        </div>
      </section>

      {/* しくみ */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="display text-center text-2xl md:text-3xl">しくみ</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.no}
              className="rounded-3xl bg-brand-blue p-7 text-white"
            >
              <p className="wordmark text-4xl text-white/80">{step.no}</p>
              <h3 className="mt-3 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/85">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 墨澄とは？ */}
      <section className="border-t border-zinc-100 bg-zinc-50">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="display text-center text-2xl md:text-3xl">
            墨澄とは？
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm font-medium leading-relaxed text-zinc-600">
            ソーシャル VR 向けのオリジナル3Dアバター。3Dグッズ作成ツールで作った
            T シャツを手軽に着せられます。
          </p>

          <dl className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
            {sumisumiSpecs.map((spec) => (
              <div
                key={spec.term}
                className="flex flex-col gap-1 py-4 md:flex-row md:gap-6"
              >
                <dt className="font-black text-zinc-900 md:w-40 md:shrink-0">
                  {spec.term}
                </dt>
                <dd className="text-sm font-medium leading-relaxed text-zinc-700">
                  {spec.desc}
                </dd>
              </div>
            ))}
            <div className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
              <dt className="font-black text-zinc-900 md:w-40 md:shrink-0">
                開発メンバー
              </dt>
              <dd className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                {sumisumiMembers.map((m) => (
                  <span key={m.handle}>
                    {m.role}：{m.name}{" "}
                    <a
                      href={`https://x.com/${m.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brand-blue hover:underline"
                    >
                      @{m.handle}
                    </a>
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-right text-xs text-zinc-400">
            出典：
            <a
              href="https://lp.suzuri.jp/3d-t-shirt"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-600"
            >
              https://lp.suzuri.jp/3d-t-shirt
            </a>
            より引用
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://lp.suzuri.jp/3d-t-shirt"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-zinc-900 px-7 py-3 font-bold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
            >
              墨澄について詳しく
            </a>
            <a
              href="https://suzuri.jp/surisurikun/digital_products/53046"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand-orange px-7 py-3 font-bold text-white transition hover:brightness-95"
            >
              墨澄をお迎えする
            </a>
          </div>
        </div>
      </section>

      {/* CTA（青ブロック） */}
      <section className="bg-brand-blue">
        <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center text-white">
          <h2 className="display text-xl md:text-2xl">さっそくお祝いしよう</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/90">
            写真とフレームの色を選ぶだけ。数秒で墨澄2周年の記念画像ができあがります。
          </p>
          <div className="mt-7">
            <Link
              href="/generate"
              className="inline-block rounded-full bg-white px-8 py-3.5 font-bold text-brand-blue transition hover:bg-white/90"
            >
              記念画像をつくる
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs font-medium text-zinc-400">
          これはファンによる非公式サイトです。
        </div>
      </footer>
    </main>
  );
}
