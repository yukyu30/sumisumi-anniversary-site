"use client";

import { useState } from "react";
import type { FrameColor } from "@/features/compose";
import { MAX_ID_BYTES } from "@/lib/payload";

/** 墨澄2周年記念で固定（サーバーの ANNIVERSARY_YEARS と一致させる） */
export const ANNIVERSARY_YEARS = 2;

export interface IssuedData {
  /** /api/issue が返した base64 暗号ブロブ */
  payload: string;
  /** サーバーが付与した発行時刻（unix 秒）。暗号化された timestamp と一致 */
  issuedAt: number;
  id: string;
  years: number;
  frameColor: FrameColor;
  file: File;
}

const FRAME_OPTIONS: { value: FrameColor; label: string; swatch: string }[] = [
  { value: "blue", label: "青", swatch: "#2f63e8" },
  { value: "orange", label: "オレンジ", swatch: "#f0971b" },
];

interface Props {
  onIssued: (data: IssuedData) => void;
}

export function GeneratorForm({ onIssued }: Props) {
  const [id, setId] = useState("");
  const [frameColor, setFrameColor] = useState<FrameColor>("blue");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalizedId = id.normalize("NFC").trim();
    if (!normalizedId) {
      setError("ID を入力してください");
      return;
    }
    if (new TextEncoder().encode(normalizedId).length > MAX_ID_BYTES) {
      setError(`ID は UTF-8 で ${MAX_ID_BYTES} バイト以内にしてください`);
      return;
    }
    if (!file) {
      setError("画像を選択してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: normalizedId }),
      });
      const body = (await res.json()) as {
        payload?: string;
        issuedAt?: number;
        error?: string;
      };
      if (!res.ok || !body.payload || body.issuedAt === undefined) {
        setError(body.error ?? "生成に失敗しました。時間をおいて再度お試しください");
        return;
      }
      onIssued({
        payload: body.payload,
        issuedAt: body.issuedAt,
        id: normalizedId,
        years: ANNIVERSARY_YEARS,
        frameColor,
        file,
      });
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="generator-id" className="text-sm font-bold">
          ID（VRChat ID・X の ID など）
        </label>
        <input
          id="generator-id"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="例: sumisumi_fan"
          className="rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 font-medium text-zinc-900 focus:border-brand-blue focus:outline-none"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-bold">フレームの色</legend>
        <div className="mt-1 flex gap-3">
          {FRAME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-full border-2 px-5 py-2 font-bold transition ${
                frameColor === opt.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-700"
              }`}
            >
              <input
                type="radio"
                name="frameColor"
                value={opt.value}
                checked={frameColor === opt.value}
                onChange={() => setFrameColor(opt.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="h-4 w-4 rounded-full ring-2 ring-white"
                style={{ backgroundColor: opt.swatch }}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="generator-image" className="text-sm font-bold">
          画像（記念に使う写真・スクリーンショット）
        </label>
        <input
          id="generator-image"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm font-medium file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:font-bold file:text-white"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-zinc-900 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitting ? "生成中…" : "記念画像を生成"}
      </button>
    </form>
  );
}
