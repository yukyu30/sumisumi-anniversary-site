"use client";

import { useState } from "react";
import { readImageAsSampler } from "@/features/read-image";
import { BarcodeDecodeError, decodeBarcode } from "@/lib/barcode/decode";
import { VerifyResult, type VerifyOutcome } from "./VerifyResult";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeErrorMessage(error: BarcodeDecodeError): string {
  switch (error.code) {
    case "IMAGE_TOO_SMALL":
      return "画像が小さすぎて読み取れません。できるだけ元のサイズの画像でお試しください";
    case "CRC_MISMATCH":
      return "もようは見つかりましたが、データが壊れています。トリミングや加工のない画像でお試しください";
    case "PATTERN_NOT_FOUND":
      return "バーコードのもようが見つかりません。このサイトで生成した画像を、上部を切り取らずに読み込んでください";
  }
}

/** 画像を読み込んでバーコードを解析し、サーバー検証まで行う */
export function VerifyDropzone() {
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setOutcome(null);
    try {
      const sampler = await readImageAsSampler(file);
      let blob: Uint8Array;
      try {
        blob = decodeBarcode(sampler);
      } catch (error) {
        if (error instanceof BarcodeDecodeError) {
          setOutcome({ ok: false, message: decodeErrorMessage(error) });
          return;
        }
        throw error;
      }
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload: bytesToBase64(blob) }),
      });
      const body = (await res.json()) as {
        id?: string;
        years?: number;
        issuedAt?: number;
        error?: string;
      };
      if (
        !res.ok ||
        body.id === undefined ||
        body.years === undefined ||
        body.issuedAt === undefined
      ) {
        setOutcome({
          ok: false,
          message: body.error ?? "検証に失敗しました",
        });
        return;
      }
      setOutcome({
        ok: true,
        id: body.id,
        years: body.years,
        issuedAt: body.issuedAt,
      });
    } catch {
      setOutcome({
        ok: false,
        message: "画像の読み込みに失敗しました。別の画像でお試しください",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label
        htmlFor="verify-image"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-4 border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center transition hover:border-brand-blue hover:bg-brand-blue/5"
      >
        <span className="text-lg font-black">
          {busy ? "解析中…" : "記念画像を選択"}
        </span>
        <span className="text-sm font-medium text-zinc-500">
          このサイトで生成した画像（SNS 保存版でも OK）
        </span>
        <input
          id="verify-image"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {outcome && <VerifyResult outcome={outcome} />}
    </div>
  );
}
