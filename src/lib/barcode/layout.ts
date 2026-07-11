/**
 * バーコードグリッド (v1) のセル分類と固定セル値の単一情報源。
 * encode / decode の双方がここに依存する。
 *
 * グリッド: 横 64 × 縦 18 モジュール
 * - Quiet zone: 外周 1 モジュール（白）
 * - ファインダー: 内部四隅に 3×3 ブロック
 *   - TL/TR/BL = 全黒、BR = 黒枠 + 中央白（向き検出用）
 * - 水平タイミング: row 2（ファインダー中段）、col 4–59、黒始まり交互
 * - 垂直タイミング: col 2（ファインダー中列）、row 4–13、黒始まり交互
 * - 残り = データセル 890 個（ラスタ順に配置）
 */
export const GRID_COLS = 64;
export const GRID_ROWS = 18;
export const DATA_CAPACITY_BITS = 890;
export const DATA_CAPACITY_BYTES = Math.floor(DATA_CAPACITY_BITS / 8); // 111

export type CellKind = "quiet" | "finder" | "timing" | "data";

const FINDER_SIZE = 3;
// 内部領域は row 1–16, col 1–62
const INNER_TOP = 1;
const INNER_LEFT = 1;
const INNER_BOTTOM = GRID_ROWS - 2; // 16
const INNER_RIGHT = GRID_COLS - 2; // 62

const H_TIMING_ROW = INNER_TOP + 1; // 2
const H_TIMING_COL_START = INNER_LEFT + FINDER_SIZE; // 4
const H_TIMING_COL_END = INNER_RIGHT - FINDER_SIZE; // 59
const V_TIMING_COL = INNER_LEFT + 1; // 2
const V_TIMING_ROW_START = INNER_TOP + FINDER_SIZE; // 4
const V_TIMING_ROW_END = INNER_BOTTOM - FINDER_SIZE; // 13

type FinderCorner = "tl" | "tr" | "bl" | "br";

function finderCorner(row: number, col: number): FinderCorner | null {
  const top = row >= INNER_TOP && row < INNER_TOP + FINDER_SIZE;
  const bottom = row <= INNER_BOTTOM && row > INNER_BOTTOM - FINDER_SIZE;
  const left = col >= INNER_LEFT && col < INNER_LEFT + FINDER_SIZE;
  const right = col <= INNER_RIGHT && col > INNER_RIGHT - FINDER_SIZE;
  if (top && left) return "tl";
  if (top && right) return "tr";
  if (bottom && left) return "bl";
  if (bottom && right) return "br";
  return null;
}

export function classifyCell(row: number, col: number): CellKind {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
    throw new RangeError(`グリッド範囲外: (${row}, ${col})`);
  }
  if (
    row < INNER_TOP ||
    row > INNER_BOTTOM ||
    col < INNER_LEFT ||
    col > INNER_RIGHT
  ) {
    return "quiet";
  }
  if (finderCorner(row, col) !== null) return "finder";
  if (
    row === H_TIMING_ROW &&
    col >= H_TIMING_COL_START &&
    col <= H_TIMING_COL_END
  ) {
    return "timing";
  }
  if (
    col === V_TIMING_COL &&
    row >= V_TIMING_ROW_START &&
    row <= V_TIMING_ROW_END
  ) {
    return "timing";
  }
  return "data";
}

/**
 * 固定セル（quiet/finder/timing）の値を返す。true = 黒。
 * データセルに対して呼ぶと例外。
 */
export function fixedCellValue(row: number, col: number): boolean {
  const kind = classifyCell(row, col);
  switch (kind) {
    case "quiet":
      return false;
    case "finder": {
      const corner = finderCorner(row, col)!;
      if (corner === "br") {
        // 黒枠 + 中央白（180°回転・鏡像の検出用）
        const centerRow = INNER_BOTTOM - 1; // 15
        const centerCol = INNER_RIGHT - 1; // 61
        return !(row === centerRow && col === centerCol);
      }
      return true;
    }
    case "timing":
      if (row === H_TIMING_ROW && col >= H_TIMING_COL_START) {
        return (col - H_TIMING_COL_START) % 2 === 0; // 黒始まり交互
      }
      return (row - V_TIMING_ROW_START) % 2 === 0;
    case "data":
      throw new RangeError(`データセルに固定値はない: (${row}, ${col})`);
  }
}

/** データセルの座標をラスタ順（左上→右下）で列挙する */
export function dataCellPositions(): Array<[row: number, col: number]> {
  const positions: Array<[number, number]> = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (classifyCell(row, col) === "data") positions.push([row, col]);
    }
  }
  return positions;
}
