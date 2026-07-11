import Link from "next/link";
import { Generator } from "@/components/Generator";

export const metadata = {
  title: "記念画像をつくる",
};

export default function GeneratePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="text-sm font-bold text-zinc-400 hover:text-zinc-700"
      >
        ← トップへ
      </Link>
      <h1 className="mt-4 text-3xl font-black">墨澄2周年記念画像をつくる</h1>
      <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
        ID を入れて、フレームの色とお気に入りの写真を選ぶだけ。
        選んだ内容がその場でプレビューに反映されます。
      </p>
      <div className="mt-8">
        <Generator />
      </div>
    </main>
  );
}
