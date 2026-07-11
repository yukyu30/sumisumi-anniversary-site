import { formatJst } from "@/lib/format";

export type VerifyOutcome =
  | { ok: true; id: string; years: number; issuedAt: number }
  | { ok: false; message: string };

/** 検証結果の表示カード */
export function VerifyResult({ outcome }: { outcome: VerifyOutcome }) {
  if (!outcome.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p role="alert" className="font-medium text-red-700">
          {outcome.message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-stone-900 bg-white p-8 text-center shadow-lg">
      <p className="text-sm font-bold tracking-widest text-[#b03a2e]">
        ✓ 本物の周年記念証です
      </p>
      <p className="mt-6 text-4xl font-bold">{outcome.id}</p>
      <p className="mt-3 text-2xl">祝 {outcome.years}周年</p>
      <p className="mt-6 text-sm text-stone-500">
        {formatJst(outcome.issuedAt)} 発行（JST）
      </p>
      <p className="mt-1 text-xs text-stone-400">
        このデータはサーバーの秘密鍵による復号・認証検証を通過しています
      </p>
    </div>
  );
}
