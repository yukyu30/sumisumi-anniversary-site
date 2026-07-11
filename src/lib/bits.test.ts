import { describe, expect, it } from "vitest";
import { BitReader, BitWriter } from "./bits";

describe("BitWriter / BitReader", () => {
  it("書いたビット列がそのまま読める（往復）", () => {
    const writer = new BitWriter();
    const bits = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1] as const;
    for (const bit of bits) writer.writeBit(bit === 1);
    const reader = new BitReader(writer.toBytes());
    for (const bit of bits) expect(reader.readBit()).toBe(bit === 1);
  });

  it("バイト境界を跨いで往復できる（24 bit）", () => {
    const writer = new BitWriter();
    const bits: boolean[] = [];
    for (let i = 0; i < 24; i++) {
      const bit = i % 3 === 0;
      bits.push(bit);
      writer.writeBit(bit);
    }
    expect(writer.toBytes().length).toBe(3);
    const reader = new BitReader(writer.toBytes());
    for (const bit of bits) expect(reader.readBit()).toBe(bit);
  });

  it("端数ビットは 0 パディングされてバイト列化される", () => {
    const writer = new BitWriter();
    // 1 を 3 ビット → 0b11100000 = 0xE0
    writer.writeBit(true);
    writer.writeBit(true);
    writer.writeBit(true);
    expect(Array.from(writer.toBytes())).toEqual([0xe0]);
  });

  it("範囲外読み出しで例外", () => {
    const reader = new BitReader(new Uint8Array([0xff]));
    for (let i = 0; i < 8; i++) reader.readBit();
    expect(() => reader.readBit()).toThrow(RangeError);
  });
});
