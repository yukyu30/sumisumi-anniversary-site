import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest の globals を使わないため、RTL の auto-cleanup を手動登録する
afterEach(() => {
  cleanup();
});
