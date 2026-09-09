import { describe, expect, it } from "vitest";
import { sanitizeString } from "../sanitize.middleware";

describe("sanitizeString", () => {
  it("membuang tag <script> beserta isinya", () => {
    expect(sanitizeString('<script>alert(1)</script>Testing')).toBe("Testing");
  });

  it("membuang tag HTML lain namun menyisakan teksnya", () => {
    expect(sanitizeString("<b>Penting</b>: harap hadir")).toBe("Penting: harap hadir");
  });

  it("membuang null byte", () => {
    expect(sanitizeString("data\u0000rusak")).toBe("datarusak");
  });

  it("melakukan trim spasi di awal/akhir", () => {
    expect(sanitizeString("  Ahmad Pratama  ")).toBe("Ahmad Pratama");
  });

  it("tidak mengubah teks biasa tanpa tag", () => {
    expect(sanitizeString("Tidak masuk tanpa keterangan")).toBe("Tidak masuk tanpa keterangan");
  });
});
