import { describe, expect, it } from "vitest";
import { encodeBarcode, readDataBytes } from "./encode";
import { GRID_COLS, GRID_ROWS } from "./layout";

const BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x00, 0xff]);

describe("barcode encode", () => {
  it("行列サイズは 64×18", () => {
    const matrix = encodeBarcode(BYTES);
    expect(matrix.length).toBe(GRID_ROWS);
    for (const row of matrix) expect(row.length).toBe(GRID_COLS);
  });

  it("encode → readDataBytes でバイト列が往復する", () => {
    const matrix = encodeBarcode(BYTES);
    expect(Array.from(readDataBytes(matrix, BYTES.length))).toEqual(
      Array.from(BYTES),
    );
  });

  it("最大容量 111 バイトも往復する", () => {
    const bytes = new Uint8Array(111);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 37) & 0xff;
    const matrix = encodeBarcode(bytes);
    expect(Array.from(readDataBytes(matrix, bytes.length))).toEqual(
      Array.from(bytes),
    );
  });

  it("固定セル（ファインダー・タイミング・quiet）はデータで上書きされない", () => {
    const allFF = encodeBarcode(new Uint8Array(111).fill(0xff));
    // quiet zone は白のまま
    expect(allFF[0][0]).toBe(false);
    // TL ファインダーは黒
    expect(allFF[1][1]).toBe(true);
    // BR ファインダー中央は白
    expect(allFF[15][61]).toBe(false);
    // 水平タイミングの 2 セル目 (col 5) は白
    expect(allFF[2][5]).toBe(false);
  });

  it("容量超過（112 バイト）で例外", () => {
    expect(() => encodeBarcode(new Uint8Array(112))).toThrow(RangeError);
  });
});
