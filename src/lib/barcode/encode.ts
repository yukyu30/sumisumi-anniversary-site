import { BitReader, BitWriter } from "../bits";
import {
  classifyCell,
  DATA_CAPACITY_BYTES,
  dataCellPositions,
  fixedCellValue,
  GRID_COLS,
  GRID_ROWS,
} from "./layout";

/** true = 黒 */
export type BitMatrix = boolean[][];

/**
 * コンテナバイト列を 64×18 の BitMatrix に配置する。
 * データビットは MSB ファーストでラスタ順のデータセルへ。余りは白 (0) パディング。
 */
export function encodeBarcode(bytes: Uint8Array): BitMatrix {
  if (bytes.length > DATA_CAPACITY_BYTES) {
    throw new RangeError(
      `容量超過: ${bytes.length} バイト（最大 ${DATA_CAPACITY_BYTES} バイト）`,
    );
  }
  const matrix: BitMatrix = Array.from({ length: GRID_ROWS }, () =>
    new Array<boolean>(GRID_COLS).fill(false),
  );
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (classifyCell(row, col) !== "data") {
        matrix[row][col] = fixedCellValue(row, col);
      }
    }
  }
  const reader = new BitReader(bytes);
  const totalBits = bytes.length * 8;
  const positions = dataCellPositions();
  for (let i = 0; i < totalBits; i++) {
    const [row, col] = positions[i];
    matrix[row][col] = reader.readBit();
  }
  return matrix;
}

/**
 * BitMatrix のデータセルから先頭 length バイトを読み出す（encode の逆操作）。
 * デコーダとテストが共用する。
 */
export function readDataBytes(matrix: BitMatrix, length: number): Uint8Array {
  if (length > DATA_CAPACITY_BYTES) {
    throw new RangeError(`容量超過: ${length} バイト`);
  }
  const writer = new BitWriter();
  const positions = dataCellPositions();
  for (let i = 0; i < length * 8; i++) {
    const [row, col] = positions[i];
    writer.writeBit(matrix[row][col]);
  }
  return writer.toBytes();
}
