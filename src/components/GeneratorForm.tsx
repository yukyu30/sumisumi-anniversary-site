"use client";

import { useState } from "react";
import type { FrameColor } from "@/features/compose";
import { MAX_ID_BYTES } from "@/lib/payload";

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
  const [years, setYears] = useState("");
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
    const yearsNumber = Number(years);
    if (!Number.isInteger(yearsNumber) || yearsNumber < 1 || yearsNumber > 255) {
      setError("周年数は 1〜255 の整数で入力してください");
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
        body: JSON.stringify({ id: normalizedId, years: yearsNumber }),
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
        years: yearsNumber,
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
        <label htmlFor="generator-id" className="text-sm font-medium">
          ID（VRChat ID・X の ID など）
        </label>
        <input
          id="generator-id"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="例: sumisumi_fan"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-stone-800 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="generator-years" className="text-sm font-medium">
          周年数
        </label>
        <input
          id="generator-years"
          type="number"
          min={1}
          max={255}
          value={years}
          onChange={(e) => setYears(e.target.value)}
          placeholder="例: 1"
          className="w-32 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-stone-800 focus:outline-none"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">フレームの色</legend>
        <div className="mt-1 flex gap-3">
          {FRAME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition ${
                frameColor === opt.value
                  ? "border-stone-800 bg-stone-100"
                  : "border-stone-300"
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
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: opt.swatch }}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="generator-image" className="text-sm font-medium">
          画像（記念に使う写真・スクリーンショット）
        </label>
        <input
          id="generator-image"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-white"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-stone-900 px-6 py-3 font-bold text-white transition hover:bg-stone-700 disabled:opacity-50"
      >
        {submitting ? "生成中…" : "記念画像を生成"}
      </button>
    </form>
  );
}
