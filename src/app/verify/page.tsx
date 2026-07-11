import Link from "next/link";
import { VerifyDropzone } from "@/components/VerifyDropzone";

export const metadata = {
  title: "画像を検証する",
};

export default function VerifyPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="text-sm font-bold text-zinc-400 hover:text-zinc-700"
      >
        ← トップへ
      </Link>
      <h1 className="mt-4 text-3xl font-black">記念画像を検証する</h1>
      <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
        画像上部の白黒もようを読み取り、サーバーの秘密鍵で復号します。
        復号と認証に成功すれば、このシステムが発行した本物の記念画像です。
      </p>
      <div className="mt-8">
        <VerifyDropzone />
      </div>
    </main>
  );
}
