/** MSB ファーストでビット列をバイト列に書き込む */
export class BitWriter {
  private bytes: number[] = [];
  private bitCount = 0;

  writeBit(bit: boolean): void {
    const byteIndex = this.bitCount >> 3;
    if (byteIndex === this.bytes.length) this.bytes.push(0);
    if (bit) this.bytes[byteIndex] |= 0x80 >> (this.bitCount & 7);
    this.bitCount++;
  }

  /** 端数ビットは 0 パディング */
  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

/** MSB ファーストでバイト列からビットを読み出す */
export class BitReader {
  private bitIndex = 0;

  constructor(private readonly bytes: Uint8Array) {}

  readBit(): boolean {
    const byteIndex = this.bitIndex >> 3;
    if (byteIndex >= this.bytes.length) {
      throw new RangeError("BitReader: 範囲外の読み出し");
    }
    const bit = (this.bytes[byteIndex] >> (7 - (this.bitIndex & 7))) & 1;
    this.bitIndex++;
    return bit === 1;
  }
}
