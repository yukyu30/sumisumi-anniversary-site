import { describe, expect, it } from "vitest";
import { DecryptError, decryptBlob, encryptBlob, IV_LENGTH, TAG_LENGTH } from "./crypto";

const KEY = new Uint8Array(32).fill(7);
const OTHER_KEY = new Uint8Array(32).fill(8);
const PLAINTEXT = new TextEncoder().encode("hello sumisumi");

describe("crypto (AES-256-GCM)", () => {
  it("encrypt→decrypt ラウンドトリップ", async () => {
    const blob = await encryptBlob(KEY, PLAINTEXT);
    const decrypted = await decryptBlob(KEY, blob);
    expect(Array.from(decrypted)).toEqual(Array.from(PLAINTEXT));
  });

  it("ブロブ長 = 12(IV) + 平文長 + 16(tag)", async () => {
    const blob = await encryptBlob(KEY, PLAINTEXT);
    expect(blob.length).toBe(IV_LENGTH + PLAINTEXT.length + TAG_LENGTH);
  });

  it("IV は毎回異なる（同一平文でも暗号文が異なる）", async () => {
    const blob1 = await encryptBlob(KEY, PLAINTEXT);
    const blob2 = await encryptBlob(KEY, PLAINTEXT);
    expect(Array.from(blob1)).not.toEqual(Array.from(blob2));
    expect(Array.from(blob1.subarray(0, IV_LENGTH))).not.toEqual(
      Array.from(blob2.subarray(0, IV_LENGTH)),
    );
  });

  it("暗号文の 1bit 改竄で DecryptError", async () => {
    const blob = await encryptBlob(KEY, PLAINTEXT);
    blob[IV_LENGTH] ^= 0x01; // ciphertext 先頭を反転
    await expect(decryptBlob(KEY, blob)).rejects.toThrow(DecryptError);
  });

  it("tag 改竄で DecryptError", async () => {
    const blob = await encryptBlob(KEY, PLAINTEXT);
    blob[blob.length - 1] ^= 0x01; // tag 末尾を反転
    await expect(decryptBlob(KEY, blob)).rejects.toThrow(DecryptError);
  });

  it("別鍵で DecryptError", async () => {
    const blob = await encryptBlob(KEY, PLAINTEXT);
    await expect(decryptBlob(OTHER_KEY, blob)).rejects.toThrow(DecryptError);
  });

  it("短すぎるブロブは DecryptError", async () => {
    await expect(decryptBlob(KEY, new Uint8Array(10))).rejects.toThrow(
      DecryptError,
    );
  });

  it("AAD 不一致（別 AAD で作られたブロブ）は DecryptError", async () => {
    // 同じ鍵・同じ形式だが AAD が異なるブロブを Web Crypto 直叩きで作る
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      KEY,
      "AES-GCM",
      false,
      ["encrypt"],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
          additionalData: new TextEncoder().encode("other-system:v1"),
        },
        cryptoKey,
        PLAINTEXT,
      ),
    );
    const blob = new Uint8Array(iv.length + encrypted.length);
    blob.set(iv, 0);
    blob.set(encrypted, iv.length);
    await expect(decryptBlob(KEY, blob)).rejects.toThrow(DecryptError);
  });

  it("32 バイト以外の鍵は RangeError", async () => {
    await expect(encryptBlob(new Uint8Array(16), PLAINTEXT)).rejects.toThrow(
      RangeError,
    );
  });
});
