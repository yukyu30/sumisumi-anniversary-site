import { crc16 } from "./crc16";

/**
 * バーコードコンテナ（秘密情報なし、クライアントで組める）
 *
 * offset size  内容
 * 0      1     ヘッダ: 上位 4bit = フォーマット版 (0x1), 下位 4bit = ECC モード (0x0 = なし; 予約)
 * 1      1     blob length L
 * 2      L     blob
 * 2+L    2     CRC-16/CCITT-FALSE（先頭からここまで全体, big-endian）
 */
export const CONTAINER_FORMAT_VERSION = 0x1;
export const CONTAINER_ECC_NONE = 0x0;
export const CONTAINER_OVERHEAD = 4;
export const MAX_BLOB_LENGTH = 255;

export class ContainerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContainerError";
  }
}

export function frameContainer(blob: Uint8Array): Uint8Array {
  if (blob.length < 1 || blob.length > MAX_BLOB_LENGTH) {
    throw new RangeError(`blob は 1–${MAX_BLOB_LENGTH} バイトが必要: ${blob.length}`);
  }
  const framed = new Uint8Array(CONTAINER_OVERHEAD + blob.length);
  framed[0] = (CONTAINER_FORMAT_VERSION << 4) | CONTAINER_ECC_NONE;
  framed[1] = blob.length;
  framed.set(blob, 2);
  const crc = crc16(framed.subarray(0, 2 + blob.length));
  framed[2 + blob.length] = crc >> 8;
  framed[3 + blob.length] = crc & 0xff;
  return framed;
}

export function unframeContainer(framed: Uint8Array): Uint8Array {
  if (framed.length < CONTAINER_OVERHEAD + 1) {
    throw new ContainerError("コンテナが短すぎます");
  }
  const version = framed[0] >> 4;
  if (version !== CONTAINER_FORMAT_VERSION) {
    throw new ContainerError(`未知のフォーマット版: ${version}`);
  }
  const blobLength = framed[1];
  if (framed.length < CONTAINER_OVERHEAD + blobLength) {
    throw new ContainerError(
      `コンテナ長が不足: 期待 ${CONTAINER_OVERHEAD + blobLength}, 実際 ${framed.length}`,
    );
  }
  const body = framed.subarray(0, 2 + blobLength);
  const expected = (framed[2 + blobLength] << 8) | framed[3 + blobLength];
  if (crc16(body) !== expected) {
    throw new ContainerError("CRC 不一致");
  }
  return framed.slice(2, 2 + blobLength);
}
