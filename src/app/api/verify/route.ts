import { decodePayload } from "@/lib/payload";
import { getPublicKey } from "@/lib/server/keys";
import { SignatureError, verifyToken } from "@/lib/sign";

export const runtime = "nodejs";

/** base64 トークンの上限（payload ≤75B + 署名 64B ≒ base64 200 文字弱） */
const MAX_PAYLOAD_CHARS = 320;

/**
 * POST /api/verify
 * base64 の署名トークンを公開鍵で検証し、成功すれば
 * {id, years, issuedAt} を返す = このシステムが発行した証明。
 * 失敗理由は意図的に粗くする。
 */
export async function POST(request: Request): Promise<Response> {
  let key: Uint8Array;
  try {
    key = getPublicKey();
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

  const token = Uint8Array.from(Buffer.from(payload, "base64"));
  try {
    const verified = await verifyToken(key, token);
    const decoded = decodePayload(verified);
    return Response.json({
      id: decoded.id,
      years: decoded.years,
      issuedAt: decoded.timestamp,
    });
  } catch (error) {
    if (error instanceof SignatureError || error instanceof RangeError) {
      // 改竄・別システム発行・破損 — 理由は粗くまとめる
      return Response.json(
        { error: "検証に失敗しました。このシステムで発行された画像ではない可能性があります" },
        { status: 422 },
      );
    }
    throw error;
  }
}
