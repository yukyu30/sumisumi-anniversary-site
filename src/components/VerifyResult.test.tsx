import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerifyResult } from "./VerifyResult";

describe("VerifyResult", () => {
  it("成功時に ID・周年・JST の発行時刻を表示する", () => {
    render(
      <VerifyResult
        outcome={{
          ok: true,
          id: "yukyu30",
          years: 3,
          issuedAt: 1_783_774_800, // 2026-07-11 22:00 JST
        }}
      />,
    );
    expect(screen.getByText(/本物/)).toBeInTheDocument();
    expect(screen.getByText("yukyu30")).toBeInTheDocument();
    expect(screen.getByText(/3周年/)).toBeInTheDocument();
    expect(screen.getByText(/2026年7月11日 22:00/)).toBeInTheDocument();
  });

  it("失敗時は理由メッセージを alert で表示し、成功要素を出さない", () => {
    render(
      <VerifyResult
        outcome={{
          ok: false,
          message: "バーコードパターンが見つかりません",
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "バーコードパターンが見つかりません",
    );
    expect(screen.queryByText(/本物/)).not.toBeInTheDocument();
  });
});
