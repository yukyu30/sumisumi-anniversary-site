/**
 * 平文ペイロードのバイナリフォーマット (v1)
 *
 * offset size  内容
 * 0      1     version (0x01)
 * 1      1     years (1–255)
 * 2      8     timestamp: unix 秒, big-endian uint64
 * 10     1     idLength = N (1–64)
 * 11     N     id: UTF-8 バイト列
 */
export const PAYLOAD_VERSION = 0x01;
export const MAX_ID_BYTES = 64;

export interface Payload {
  years: number;
  /** unix 秒 */
  timestamp: number;
  id: string;
}

export function encodePayload(payload: Payload): Uint8Array {
  const { years, timestamp, id } = payload;
  if (!Number.isInteger(years) || years < 1 || years > 255) {
    throw new RangeError(`years は 1–255 の整数が必要: ${years}`);
  }
  const idBytes = new TextEncoder().encode(id);
  if (idBytes.length < 1 || idBytes.length > MAX_ID_BYTES) {
    throw new RangeError(
      `id は UTF-8 で 1–${MAX_ID_BYTES} バイトが必要: ${idBytes.length} バイト`,
    );
  }

  const bytes = new Uint8Array(11 + idBytes.length);
  const view = new DataView(bytes.buffer);
  bytes[0] = PAYLOAD_VERSION;
  bytes[1] = years;
  view.setBigUint64(2, BigInt(timestamp));
  bytes[10] = idBytes.length;
  bytes.set(idBytes, 11);
  return bytes;
}

export function decodePayload(bytes: Uint8Array): Payload {
  if (bytes.length < 12) {
    throw new RangeError(`ペイロードが短すぎる: ${bytes.length} バイト`);
  }
  if (bytes[0] !== PAYLOAD_VERSION) {
    throw new RangeError(`未知のペイロードバージョン: ${bytes[0]}`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const years = bytes[1];
  const timestamp = Number(view.getBigUint64(2));
  const idLength = bytes[10];
  if (bytes.length !== 11 + idLength) {
    throw new RangeError(
      `ペイロード長が不正: 期待 ${11 + idLength}, 実際 ${bytes.length}`,
    );
  }
  const id = new TextDecoder("utf-8", { fatal: true }).decode(
    bytes.subarray(11, 11 + idLength),
  );
  return { years, timestamp, id };
}
