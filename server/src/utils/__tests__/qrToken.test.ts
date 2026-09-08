import { describe, expect, it } from "vitest";
import { generateQrToken } from "../qrToken";

describe("generateQrToken", () => {
  it("mengikuti format SIAP-<hex>-<base36 timestamp>", () => {
    const token = generateQrToken();
    expect(token).toMatch(/^SIAP-[0-9A-F]{12}-[0-9A-Z]+$/);
  });

  it("menghasilkan token berbeda pada setiap pemanggilan", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateQrToken()));
    expect(tokens.size).toBe(50);
  });
});
