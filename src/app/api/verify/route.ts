import { DecryptError, decryptBlob } from "@/lib/crypto";
import { decodePayload } from "@/lib/payload";
import { getSecretKey } from "@/lib/server/keys";

export const runtime = "nodejs";

/** base64 ブロブの上限（暗号ブロブは最大 103 バイト ≒ base64 140 文字） */
const MAX_PAYLOAD_CHARS = 256;

/**
 * POST /api/verify
 * base64 の暗号ブロブを復号し、GCM 認証タグの検証を通れば
 * {id, years, issuedAt} を返す = このシステムが発行した証明。
 * 失敗理由は意図的に粗くする（オラクル化を避ける）。
 */
export async function POST(request: Request): Promise<Response> {
  let key: Uint8Array;
  try {
    key = getSecretKey();
  } catch {
    return Response.json(
      { error: "サーバーの設定エラーです" },
      { status: 500 },
    );
  }

  let payload: unknown;
  try {
    ({ payload } = (await request.json()) as { payload?: unknown });
  } catch {
    return Response.json({ error: "JSON を送信してください" }, { status: 400 });
  }
  if (
    typeof payload !== "string" ||
    payload.length === 0 ||
    payload.length > MAX_PAYLOAD_CHARS ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)
  ) {
    return Response.json(
      { error: "payload (base64 文字列) が必要です" },
      { status: 400 },
    );
  }

  const blob = Uint8Array.from(Buffer.from(payload, "base64"));
  try {
    const plaintext = await decryptBlob(key, blob);
    const decoded = decodePayload(plaintext);
    return Response.json({
      id: decoded.id,
      years: decoded.years,
      issuedAt: decoded.timestamp,
    });
  } catch (error) {
    if (error instanceof DecryptError || error instanceof RangeError) {
      // 改竄・別システム発行・破損 — 理由は粗くまとめる
      return Response.json(
        { error: "検証に失敗しました。このシステムで発行された画像ではない可能性があります" },
        { status: 422 },
      );
    }
    throw error;
  }
}
