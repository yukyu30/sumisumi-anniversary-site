import Link from "next/link";
import { VerifyDropzone } from "@/components/VerifyDropzone";

export const metadata = {
  title: "画像を検証する",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="text-sm font-bold text-zinc-400 hover:text-zinc-700"
      >
        ← トップへ
      </Link>
      <h1 className="mt-4 text-3xl font-black">記念写真の認証</h1>
      <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
        記念画像のQRコードから署名を確認します
      </p>
      <div className="mt-8">
        <VerifyDropzone token={t} />
      </div>
    </main>
  );
}
