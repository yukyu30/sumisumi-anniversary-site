import { describe, expect, it } from "vitest";
import { formatJst } from "./format";

describe("formatJst", () => {
  it("unix 秒を JST の日時文字列にする", () => {
    // 2026-07-11T13:00:00Z = 2026-07-11 22:00 JST
    expect(formatJst(1_783_774_800)).toBe("2026年7月11日 22:00");
  });

  it("日付をまたぐ UTC→JST 変換（UTC 15:30 → 翌日 0:30 JST）", () => {
    // 2025-12-31T15:30:00Z = 2026-01-01 00:30 JST
    expect(formatJst(1_767_195_000)).toBe("2026年1月1日 0:30");
  });
});
