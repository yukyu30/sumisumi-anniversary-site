import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeneratorForm } from "./GeneratorForm";

const PNG_FILE = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "me.png", {
  type: "image/png",
});

describe("GeneratorForm", () => {
  const fetchMock = vi.fn();
  const onIssued = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ payload: "QUJDRA==", issuedAt: 1_752_246_000 }), {
        status: 200,
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, id: string) {
    if (id) await user.type(screen.getByLabelText(/ID/), id);
    await user.type(screen.getByLabelText(/周年/), "3");
    await user.upload(screen.getByLabelText(/画像/), PNG_FILE);
    await user.click(screen.getByRole("button", { name: /生成/ }));
  }

  it("送信時に /api/issue へ正しい body で fetch する", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onIssued={onIssued} />);
    await fillAndSubmit(user, "yukyu30");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/issue");
    expect(JSON.parse(init.body as string)).toEqual({ id: "yukyu30", years: 3 });
    await waitFor(() =>
      expect(onIssued).toHaveBeenCalledWith({
        payload: "QUJDRA==",
        issuedAt: 1_752_246_000,
        id: "yukyu30",
        years: 3,
        frameColor: "blue",
        file: PNG_FILE,
      }),
    );
  });

  it("フレーム色をオレンジに切り替えると onIssued に反映される", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onIssued={onIssued} />);
    await user.click(screen.getByRole("radio", { name: /オレンジ/ }));
    await fillAndSubmit(user, "yukyu30");

    await waitFor(() =>
      expect(onIssued).toHaveBeenCalledWith(
        expect.objectContaining({ frameColor: "orange" }),
      ),
    );
  });

  it("ID が空だと検証メッセージを表示し fetch しない", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onIssued={onIssued} />);
    await fillAndSubmit(user, "");

    expect(await screen.findByText(/ID を入力してください/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ID が UTF-8 で 64 バイトを超えると検証メッセージ", async () => {
    const user = userEvent.setup();
    render(<GeneratorForm onIssued={onIssued} />);
    await fillAndSubmit(user, "あ".repeat(22)); // 66 バイト

    expect(await screen.findByText(/64 バイト以内/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("API がエラーを返したらメッセージを表示する", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "周年数は 1〜255 の整数で入力してください" }), {
        status: 400,
      }),
    );
    const user = userEvent.setup();
    render(<GeneratorForm onIssued={onIssued} />);
    await fillAndSubmit(user, "yukyu30");

    expect(
      await screen.findByText(/周年数は 1〜255 の整数で入力してください/),
    ).toBeInTheDocument();
    expect(onIssued).not.toHaveBeenCalled();
  });
});
