import { describe, expect, it } from "vitest";
import { ContainerError, frameContainer, unframeContainer } from "./container";

const BLOB = new Uint8Array([1, 2, 3, 4, 5, 250, 251, 252]);

describe("container (ヘッダ + 長さ + CRC)", () => {
  it("frame→unframe ラウンドトリップ", () => {
    const framed = frameContainer(BLOB);
    expect(Array.from(unframeContainer(framed))).toEqual(Array.from(BLOB));
  });

  it("blob 改竄で CRC 不一致を検出", () => {
    const framed = frameContainer(BLOB);
    framed[3] ^= 0x01;
    expect(() => unframeContainer(framed)).toThrow(ContainerError);
  });

  it("CRC 自体の改竄も検出", () => {
    const framed = frameContainer(BLOB);
    framed[framed.length - 1] ^= 0x01;
    expect(() => unframeContainer(framed)).toThrow(ContainerError);
  });

  it("切り詰められたコンテナを検出", () => {
    const framed = frameContainer(BLOB);
    expect(() => unframeContainer(framed.subarray(0, framed.length - 3))).toThrow(
      ContainerError,
    );
  });

  it("不正フォーマット版を検出", () => {
    const framed = frameContainer(BLOB);
    framed[0] = 0x20; // 版 = 2
    expect(() => unframeContainer(framed)).toThrow(ContainerError);
  });

  it("空 blob / 256 バイト blob は frame で例外", () => {
    expect(() => frameContainer(new Uint8Array(0))).toThrow(RangeError);
    expect(() => frameContainer(new Uint8Array(256))).toThrow(RangeError);
  });
});
