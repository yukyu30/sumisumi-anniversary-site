import { describe, expect, it } from "vitest";
import { crc16 } from "./crc16";

describe("crc16 (CRC-16/CCITT-FALSE)", () => {
  it('既知ベクタ "123456789" は 0x29B1', () => {
    const input = new TextEncoder().encode("123456789");
    expect(crc16(input)).toBe(0x29b1);
  });

  it("空バイト列は初期値 0xFFFF", () => {
    expect(crc16(new Uint8Array(0))).toBe(0xffff);
  });

  it("1 バイト入力 (0x00) は 0xE1F0", () => {
    // CRC-16/CCITT-FALSE の既知値
    expect(crc16(new Uint8Array([0x00]))).toBe(0xe1f0);
  });
});
