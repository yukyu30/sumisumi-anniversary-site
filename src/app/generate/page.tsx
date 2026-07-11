"use client";

import Link from "next/link";
import { useState } from "react";
import { AnniversaryCanvas } from "@/components/AnniversaryCanvas";
import { GeneratorForm, type IssuedData } from "@/components/GeneratorForm";

export default function GeneratePage() {
  const [issued, setIssued] = useState<IssuedData | null>(null);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
        ← トップへ
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">
        墨澄2周年記念画像をつくる
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
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
