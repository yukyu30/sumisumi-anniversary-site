import { BitWriter } from "../bits";
import {
  CONTAINER_FORMAT_VERSION,
  ContainerError,
  unframeContainer,
} from "../container";
import {
  classifyCell,
  dataCellPositions,
  fixedCellValue,
  GRID_COLS,
  GRID_ROWS,
} from "./layout";
import { type GraySampler, rotate180 } from "./sampler";

export type DecodeErrorCode =
  | "IMAGE_TOO_SMALL"
  | "PATTERN_NOT_FOUND"
  | "CRC_MISMATCH";

export class BarcodeDecodeError extends Error {
  constructor(
    public readonly code: DecodeErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "BarcodeDecodeError";
  }
}

interface Hypothesis {
  dx: number; // モジュール単位のオフセット
  dy: number;
  scale: number; // ピッチ倍率
}

interface ScoredHypothesis extends Hypothesis {
  score: number;
  threshold: number;
}

/** 仮説の探索グリッド */
const OFFSETS = [-0.3, -0.15, 0, 0.15, 0.3];
const SCALES = [0.98, 0.99, 1.0, 1.01, 1.02];
/** 基準セル一致率がこれ未満の仮説は不採用 */
const MIN_SCORE = 0.9;
/** CRC 検証まで進める仮説の最大数 */
const MAX_ATTEMPTS = 10;
/** 黒白の平均輝度差がこれ未満ならパターンとみなさない */
const MIN_CONTRAST = 16;

/** 期待値が既知の基準セル（quiet / finder / timing）一覧 */
const referenceCells: Array<[row: number, col: number, black: boolean]> = [];
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    if (classifyCell(row, col) !== "data") {
      referenceCells.push([row, col, fixedCellValue(row, col)]);
    }
  }
}

/** セル中心付近 3×3 点の平均輝度 */
function cellGray(
  sampler: GraySampler,
  row: number,
  col: number,
  pitch: number,
  hyp: Hypothesis,
): number {
  const p = pitch * hyp.scale;
  const cx = (col + 0.5 + hyp.dx) * p;
  const cy = (row + 0.5 + hyp.dy) * p;
  const d = p * 0.2;
  let sum = 0;
  for (let iy = -1; iy <= 1; iy++) {
    for (let ix = -1; ix <= 1; ix++) {
      sum += sampler.at(cx + ix * d, cy + iy * d);
    }
  }
  return sum / 9;
}

function scoreHypothesis(
  sampler: GraySampler,
  pitch: number,
  hyp: Hypothesis,
): ScoredHypothesis {
  let blackSum = 0;
  let blackCount = 0;
  let whiteSum = 0;
  let whiteCount = 0;
  const grays: number[] = [];
  for (const [row, col, black] of referenceCells) {
    const gray = cellGray(sampler, row, col, pitch, hyp);
    grays.push(gray);
    if (black) {
      blackSum += gray;
      blackCount++;
    } else {
      whiteSum += gray;
      whiteCount++;
    }
  }
  const blackMean = blackSum / blackCount;
  const whiteMean = whiteSum / whiteCount;
  if (whiteMean - blackMean < MIN_CONTRAST) {
    return { ...hyp, score: 0, threshold: 128 };
  }
  // 実測輝度から適応的にしきい値を決める（固定 128 は使わない）
  const threshold = (blackMean + whiteMean) / 2;
  let matched = 0;
  for (let i = 0; i < referenceCells.length; i++) {
    const black = referenceCells[i][2];
    if (grays[i] < threshold === black) matched++;
  }
  return { ...hyp, score: matched / referenceCells.length, threshold };
}

/** 仮説に基づいてデータセルを読み、コンテナとして検証する */
function tryReadContainer(
  sampler: GraySampler,
  pitch: number,
  hyp: ScoredHypothesis,
): Uint8Array | null {
  const positions = dataCellPositions();
  const readByte = (byteIndex: number): number => {
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
      const [row, col] = positions[byteIndex * 8 + bit];
      const black = cellGray(sampler, row, col, pitch, hyp) < hyp.threshold;
      value = (value << 1) | (black ? 1 : 0);
    }
    return value;
  };

  // 先にヘッダ 2 バイトだけ読んで妥当性を確認する
  const header = readByte(0);
  if (header >> 4 !== CONTAINER_FORMAT_VERSION) return null;
  const blobLength = readByte(1);
  const total = blobLength + 4;
  if (blobLength < 1 || total * 8 > positions.length) return null;

  const writer = new BitWriter();
  for (let i = 0; i < total * 8; i++) {
    const [row, col] = positions[i];
    writer.writeBit(cellGray(sampler, row, col, pitch, hyp) < hyp.threshold);
  }
  try {
    return unframeContainer(writer.toBytes());
  } catch (error) {
    if (error instanceof ContainerError) return null;
    throw error;
  }
}

interface AttemptResult {
  blob: Uint8Array | null;
  bestScore: number;
}

function attemptDecode(sampler: GraySampler): AttemptResult {
  const pitch = sampler.width / GRID_COLS;
  const scored: ScoredHypothesis[] = [];
  for (const scale of SCALES) {
    for (const dy of OFFSETS) {
      for (const dx of OFFSETS) {
        scored.push(scoreHypothesis(sampler, pitch, { dx, dy, scale }));
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const bestScore = scored[0]?.score ?? 0;
  for (const hyp of scored.slice(0, MAX_ATTEMPTS)) {
    if (hyp.score < MIN_SCORE) break;
    const blob = tryReadContainer(sampler, pitch, hyp);
    if (blob) return { blob, bestScore };
  }
  return { blob: null, bestScore };
}

/**
 * グレースケール画像の上部ストリップからコンテナを復元し、blob を返す。
 * 生成画像はストリップが画像全幅を占める前提（ピッチ = 幅/64）。
 * 180° 回転した画像は自動補正して読む。
 */
export function decodeBarcode(sampler: GraySampler): Uint8Array {
  const pitch = sampler.width / GRID_COLS;
  if (sampler.width < GRID_COLS * 2 || sampler.height < pitch * GRID_ROWS - 1) {
    throw new BarcodeDecodeError("IMAGE_TOO_SMALL", "画像が小さすぎます");
  }
  const normal = attemptDecode(sampler);
  if (normal.blob) return normal.blob;
  // 180° 回転（上下逆さの投稿画像）を自動補正
  const rotated = attemptDecode(rotate180(sampler));
  if (rotated.blob) return rotated.blob;

  const bestScore = Math.max(normal.bestScore, rotated.bestScore);
  if (bestScore >= MIN_SCORE) {
    throw new BarcodeDecodeError(
      "CRC_MISMATCH",
      "パターンは見つかりましたがデータが破損しています",
    );
  }
  throw new BarcodeDecodeError(
    "PATTERN_NOT_FOUND",
    "バーコードパターンが見つかりません",
  );
}
