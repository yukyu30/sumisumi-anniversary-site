import "server-only";

/**
 * 環境変数 ANNIV_SECRET_KEY (hex 64 桁 = 32 バイト) を読み出す。
 * 未設定・不正形式は例外（route 側で 500 にする）。
 */
export function getSecretKey(): Uint8Array {
  const hex = process.env.ANNIV_SECRET_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "ANNIV_SECRET_KEY が未設定か不正です（hex 64 桁が必要。生成: openssl rand -hex 32）",
    );
  }
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return key;
}
