"use client";

import { useEffect, useState } from "react";
import type { IssuedData } from "./GeneratorForm";
import { composeAnniversaryImage } from "@/features/compose";

interface Props {
  issued: IssuedData;
  onReset: () => void;
}

/** 発行データから記念画像を合成し、プレビューとダウンロードを提供する */
export function AnniversaryCanvas({ issued, onReset }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    composeAnniversaryImage(issued)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("画像の合成に失敗しました");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [issued]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-red-600">
          {error}
        </p>
        <button
          onClick={onReset}
          className="rounded-lg border border-stone-400 px-6 py-2"
        >
          やり直す
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {url ? (
        <>
          {/* 生成画像のプレビュー（next/image 不使用: データ URL のため） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`祝 ${issued.years}周年 ${issued.id} の記念画像`}
            className="w-full max-w-md rounded-lg shadow-xl"
          />
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={url}
              download={`sumisumi-${issued.years}th-${issued.id}.png`}
              className="rounded-lg bg-stone-900 px-6 py-3 font-bold text-white transition hover:bg-stone-700"
            >
              画像をダウンロード
            </a>
            <button
              onClick={onReset}
              className="rounded-lg border border-stone-400 px-6 py-3 transition hover:bg-stone-100"
            >
              もう一度つくる
            </button>
          </div>
          <p className="max-w-md text-center text-sm text-stone-500">
            画像上部の白黒もようは発行証明です。切り取らずに投稿すると、
            このサイトの「検証」でいつでも本物であることを確認できます。
          </p>
        </>
      ) : (
        <p className="animate-pulse text-stone-500">記念画像を合成中…</p>
      )}
    </div>
  );
}
