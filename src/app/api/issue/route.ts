import { encodePayload, MAX_ID_BYTES } from "@/lib/payload";
import { getPrivateKey } from "@/lib/server/keys";
import { signPayload } from "@/lib/sign";

export const runtime = "nodejs";

/** 墨澄2周年記念で固定。周年数はユーザーに入力させない */
export const ANNIVERSARY_YEARS = 2;

/** 記念画像の生成受付終了（2026-07-29 23:59:59 JST まで） */
export const GENERATION_DEADLINE = Date.parse("2026-07-29T23:59:59+09:00");

interface IssueRequest {
  id?: unknown;
}

/**
 * POST /api/issue
 * {id} を受け取り、サーバー時刻と固定の周年数を添えて秘密鍵で署名したトークンを返す。
 * timestamp をサーバーで付与することで作成時刻の偽装を防ぐ。
 */
export async function POST(request: Request): Promise<Response> {
  if (Date.now() > GENERATION_DEADLINE) {
    return Response.json(
      { error: "記念画像の生成受付は終了しました。ありがとうございました！" },
      { status: 403 },
    );
  }

  let key: Uint8Array;
  try {
    key = getPrivateKey();
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
  const payload = encodePayload({
    id: normalizedId,
    years: ANNIVERSARY_YEARS,
    timestamp: issuedAt,
  });
  const token = await signPayload(key, payload);
  return Response.json({
    payload: Buffer.from(token).toString("base64"),
    issuedAt,
  });
}
