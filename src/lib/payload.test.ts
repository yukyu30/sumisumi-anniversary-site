import { describe, expect, it } from "vitest";
import { decodePayload, encodePayload, type Payload } from "./payload";

describe("payload codec", () => {
  it("encode→decode ラウンドトリップ", () => {
    const payload: Payload = {
      years: 1,
      timestamp: 1_752_246_000, // unix 秒
      id: "yukyu30",
    };
    expect(decodePayload(encodePayload(payload))).toEqual(payload);
  });

  it("years 境界: 1 と 255 は往復できる", () => {
    for (const years of [1, 255]) {
      const payload: Payload = { years, timestamp: 0, id: "a" };
      expect(decodePayload(encodePayload(payload)).years).toBe(years);
    }
  });

  it("years 0 / 256 / 非整数は例外", () => {
    for (const years of [0, 256, 1.5]) {
      expect(() =>
        encodePayload({ years, timestamp: 0, id: "a" }),
      ).toThrow(RangeError);
    }
  });

  it("ID 境界: 1 byte / 64 byte は OK", () => {
    for (const id of ["a", "x".repeat(64)]) {
      const payload: Payload = { years: 1, timestamp: 0, id };
      expect(decodePayload(encodePayload(payload)).id).toBe(id);
    }
  });

  it("ID が空 / 65 byte は例外", () => {
    for (const id of ["", "x".repeat(65)]) {
      expect(() =>
        encodePayload({ years: 1, timestamp: 0, id }),
      ).toThrow(RangeError);
    }
  });

  it("マルチバイト UTF-8（日本語・絵文字）の往復", () => {
    for (const id of ["墨澄ちゃん", "sumi🖌️sumi", "ゆっきゅん_VRC"]) {
      const payload: Payload = { years: 3, timestamp: 1_752_246_000, id };
      expect(decodePayload(encodePayload(payload)).id).toBe(id);
    }
  });

  it("UTF-8 で 64 byte を超える日本語 ID は例外", () => {
    // ひらがな 1 文字 = 3 byte → 22 文字 = 66 byte
    expect(() =>
      encodePayload({ years: 1, timestamp: 0, id: "あ".repeat(22) }),
    ).toThrow(RangeError);
  });

  it("不正 version の decode は例外", () => {
    const bytes = encodePayload({ years: 1, timestamp: 0, id: "a" });
    bytes[0] = 0x7f;
    expect(() => decodePayload(bytes)).toThrow(RangeError);
  });
});
