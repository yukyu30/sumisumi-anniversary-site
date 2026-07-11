import { formatJst } from "@/lib/format";

export type VerifyOutcome =
  | { ok: true; id: string; years: number; issuedAt: number }
  | { ok: false; message: string };

/** 検証結果の表示カード */
export function VerifyResult({ outcome }: { outcome: VerifyOutcome }) {
  if (!outcome.ok) {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6">
        <p role="alert" className="font-bold text-red-700">
          {outcome.message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-4 border-brand-blue bg-white p-8 text-center shadow-xl">
      <p className="wordmark inline-block rounded-full bg-brand-blue px-4 py-1.5 text-sm font-bold tracking-widest text-white">
        ✓ VERIFIED
      </p>
      <p className="mt-4 text-base font-black text-brand-blue">
        本物の記念画像です
      </p>
      <p className="mt-4 text-4xl font-black">{outcome.id}</p>
      <p className="mt-3 text-2xl font-black text-brand-blue">
        祝 {outcome.years}周年
      </p>
      <p className="mt-6 text-sm font-bold text-zinc-500">
        {formatJst(outcome.issuedAt)} 発行（JST）
      </p>
      <p className="mt-1 text-xs font-medium text-zinc-400">
        このデータはサーバーの秘密鍵による復号・認証検証を通過しています
      </p>
    </div>
  );
}
