import { describe, expect, it } from "vitest";
import { createStudentSchema } from "../student.schema";

const VALID_MAJOR_ID = "clx0000000000000000000000"; // format cuid, panjang cukup
const VALID_CLASS_ID = "cly0000000000000000000001";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    nis: "24001",
    nisn: "3024000001",
    fullName: "Ahmad Pratama",
    gender: "L",
    birthDate: "2009-05-10",
    majorId: VALID_MAJOR_ID,
    classId: VALID_CLASS_ID,
    ...overrides,
  };
}

describe("createStudentSchema", () => {
  it("menerima input valid minimal", () => {
    const result = createStudentSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("menolak gender selain L/P", () => {
    const result = createStudentSchema.safeParse(baseInput({ gender: "X" }));
    expect(result.success).toBe(false);
  });

  it("menolak NIS kosong", () => {
    const result = createStudentSchema.safeParse(baseInput({ nis: "" }));
    expect(result.success).toBe(false);
  });

  it("menolak majorId yang bukan format cuid", () => {
    const result = createStudentSchema.safeParse(baseInput({ majorId: "not-a-cuid" }));
    expect(result.success).toBe(false);
  });

  it("mengubah birthDate string menjadi objek Date (coerce)", () => {
    const result = createStudentSchema.safeParse(baseInput());
    if (result.success) {
      expect(result.data.birthDate).toBeInstanceOf(Date);
    }
  });

  it("parentId bersifat opsional", () => {
    const result = createStudentSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });
});
