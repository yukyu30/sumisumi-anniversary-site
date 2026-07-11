import { encryptBlob } from "@/lib/crypto";
import { encodePayload, MAX_ID_BYTES } from "@/lib/payload";
import { getSecretKey } from "@/lib/server/keys";

export const runtime = "nodejs";

interface IssueRequest {
  id?: unknown;
  years?: unknown;
}

/**
 * POST /api/issue
 * {id, years} を受け取り、サーバー時刻を添えて AES-256-GCM で暗号化したブロブを返す。
 * timestamp をサーバーで付与することで作成時刻の偽装を防ぐ。
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

  let body: IssueRequest;
  try {
    body = (await request.json()) as IssueRequest;
  } catch {
    return Response.json({ error: "JSON を送信してください" }, { status: 400 });
  }

  const { id, years } = body;
  if (typeof id !== "string" || typeof years !== "number") {
    return Response.json(
      { error: "id (文字列) と years (数値) が必要です" },
      { status: 400 },
    );
  }
  const normalizedId = id.normalize("NFC").trim();
  const idBytes = new TextEncoder().encode(normalizedId);
  if (idBytes.length < 1 || idBytes.length > MAX_ID_BYTES) {
    return Response.json(
      { error: `ID は 1〜${MAX_ID_BYTES} バイト（UTF-8）で入力してください` },
      { status: 400 },
    );
  }
  if (!Number.isInteger(years) || years < 1 || years > 255) {
    return Response.json(
      { error: "周年数は 1〜255 の整数で入力してください" },
      { status: 400 },
    );
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const plaintext = encodePayload({
    id: normalizedId,
    years,
    timestamp: issuedAt,
  });
  const blob = await encryptBlob(key, plaintext);
  // issuedAt も返し、画像への印字と暗号化された時刻を一致させる
  return Response.json({
    payload: Buffer.from(blob).toString("base64"),
    issuedAt,
  });
}
