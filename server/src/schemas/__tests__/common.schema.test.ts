import { describe, expect, it } from "vitest";
import { strongPasswordSchema } from "../common.schema";

describe("strongPasswordSchema", () => {
  it("menerima password valid (huruf + angka, minimal 8 karakter)", () => {
    expect(strongPasswordSchema.safeParse("Admin123!").success).toBe(true);
    expect(strongPasswordSchema.safeParse("guru1234").success).toBe(true);
  });

  it("menolak password kurang dari 8 karakter", () => {
    expect(strongPasswordSchema.safeParse("abc123").success).toBe(false);
  });

  it("menolak password tanpa angka", () => {
    expect(strongPasswordSchema.safeParse("passwordsaja").success).toBe(false);
  });

  it("menolak password tanpa huruf", () => {
    expect(strongPasswordSchema.safeParse("12345678").success).toBe(false);
  });

  it("menolak password lebih dari 72 karakter (batas aman bcrypt)", () => {
    expect(strongPasswordSchema.safeParse("a1".repeat(40)).success).toBe(false);
  });
});
