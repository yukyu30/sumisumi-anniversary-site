import { encryptBlob } from "@/lib/crypto";
import { encodePayload, MAX_ID_BYTES } from "@/lib/payload";
import { getSecretKey } from "@/lib/server/keys";

export const runtime = "nodejs";

/** 墨澄2周年記念で固定。周年数はユーザーに入力させない */
export const ANNIVERSARY_YEARS = 2;

interface IssueRequest {
  id?: unknown;
}

/**
 * POST /api/issue
 * {id} を受け取り、サーバー時刻と固定の周年数を添えて AES-256-GCM で暗号化したブロブを返す。
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

  const { id } = body;
  if (typeof id !== "string") {
    return Response.json({ error: "id (文字列) が必要です" }, { status: 400 });
  }
  const normalizedId = id.normalize("NFC").trim();
  const idBytes = new TextEncoder().encode(normalizedId);
  if (idBytes.length < 1 || idBytes.length > MAX_ID_BYTES) {
    return Response.json(
      { error: `ID は 1〜${MAX_ID_BYTES} バイト（UTF-8）で入力してください` },
      { status: 400 },
    );
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const plaintext = encodePayload({
    id: normalizedId,
    years: ANNIVERSARY_YEARS,
    timestamp: issuedAt,
  });
  const blob = await encryptBlob(key, plaintext);
  // issuedAt も返し、画像への印字と暗号化された時刻を一致させる
  return Response.json({
    payload: Buffer.from(blob).toString("base64"),
    issuedAt,
  });
}
