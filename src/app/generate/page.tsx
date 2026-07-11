"use client";

import Link from "next/link";
import { useState } from "react";
import { AnniversaryCanvas } from "@/components/AnniversaryCanvas";
import { GeneratorForm, type IssuedData } from "@/components/GeneratorForm";

export default function GeneratePage() {
  const [issued, setIssued] = useState<IssuedData | null>(null);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="text-sm font-bold text-zinc-400 hover:text-zinc-700"
      >
        ← トップへ
      </Link>
      <h1 className="mt-4 text-3xl font-black">墨澄2周年記念画像をつくる</h1>
      <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
        ID を入れてフレームの色と写真を選ぶと、発行証明つきの記念画像ができあがります。
        発行時刻はサーバーが刻印し、暗号化されて画像上部のもように焼き込まれます。
      </p>
      <div className="mt-8">
        {issued ? (
          <AnniversaryCanvas issued={issued} onReset={() => setIssued(null)} />
        ) : (
          <GeneratorForm onIssued={setIssued} />
        )}
      </div>
    </main>
  );
}
