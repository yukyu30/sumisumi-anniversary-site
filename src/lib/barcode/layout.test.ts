import { describe, expect, it } from "vitest";
import {
  classifyCell,
  DATA_CAPACITY_BITS,
  fixedCellValue,
  GRID_COLS,
  GRID_ROWS,
} from "./layout";

describe("barcode layout (64×18 グリッドの単一情報源)", () => {
  it("データ容量は 890 bit", () => {
    let dataCells = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (classifyCell(row, col) === "data") dataCells++;
      }
    }
    expect(dataCells).toBe(DATA_CAPACITY_BITS);
    expect(DATA_CAPACITY_BITS).toBe(890);
  });

  it("外周 1 モジュールは quiet zone（白）", () => {
    for (let col = 0; col < GRID_COLS; col++) {
      expect(classifyCell(0, col)).toBe("quiet");
      expect(classifyCell(GRID_ROWS - 1, col)).toBe("quiet");
      expect(fixedCellValue(0, col)).toBe(false);
    }
    for (let row = 0; row < GRID_ROWS; row++) {
      expect(classifyCell(row, 0)).toBe("quiet");
      expect(classifyCell(row, GRID_COLS - 1)).toBe("quiet");
    }
  });

  it("内部四隅は 3×3 ファインダー", () => {
    const corners = [
      [1, 1],
      [1, 62],
      [16, 1],
      [16, 62],
    ] as const;
    for (const [row, col] of corners) {
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const r = row === 1 ? row + dr : row - dr;
          const c = col === 1 ? col + dc : col - dc;
          expect(classifyCell(r, c)).toBe("finder");
        }
      }
    }
  });

  it("TL/TR/BL ファインダーは全黒、BR は中央のみ白", () => {
    // TL 全黒
    for (let r = 1; r <= 3; r++)
      for (let c = 1; c <= 3; c++) expect(fixedCellValue(r, c)).toBe(true);
    // BR: 中央 (15, 61) だけ白、枠は黒
    expect(fixedCellValue(15, 61)).toBe(false);
    for (let r = 14; r <= 16; r++) {
      for (let c = 60; c <= 62; c++) {
        if (r === 15 && c === 61) continue;
        expect(fixedCellValue(r, c)).toBe(true);
      }
    }
  });

  it("水平タイミング（row 2, col 4–59）は黒始まりの交互", () => {
    for (let col = 4; col <= 59; col++) {
      expect(classifyCell(2, col)).toBe("timing");
      expect(fixedCellValue(2, col)).toBe((col - 4) % 2 === 0);
    }
  });

  it("垂直タイミング（col 2, row 4–13）は黒始まりの交互", () => {
    for (let row = 4; row <= 13; row++) {
      expect(classifyCell(row, 2)).toBe("timing");
      expect(fixedCellValue(row, 2)).toBe((row - 4) % 2 === 0);
    }
  });

  it("全セルが排他的に分類され、合計が 64×18 になる（全数チェック）", () => {
    const counts = { quiet: 0, finder: 0, timing: 0, data: 0 };
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        counts[classifyCell(row, col)]++;
      }
    }
    expect(counts.quiet).toBe(64 * 18 - 62 * 16); // 外周
    expect(counts.finder).toBe(36);
    expect(counts.timing).toBe(56 + 10);
    expect(counts.data).toBe(890);
    expect(counts.quiet + counts.finder + counts.timing + counts.data).toBe(
      GRID_COLS * GRID_ROWS,
    );
  });

  it("データセルに fixedCellValue を呼ぶと例外", () => {
    const [row, col] = [5, 10];
    expect(classifyCell(row, col)).toBe("data");
    expect(() => fixedCellValue(row, col)).toThrow(RangeError);
  });
});
