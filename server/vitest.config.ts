import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Test di sini SENGAJA hanya menguji logika murni (tidak menyentuh DB/network) agar bisa
    // dijalankan siapa pun tanpa perlu MySQL menyala — lihat catatan di README bagian Testing.
    // Env dummy di bawah HANYA untuk lolos validasi src/config/env.ts saat modul di-import;
    // tidak ada satu pun test yang benar-benar membuka koneksi ke DATABASE_URL ini.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "mysql://test:test@localhost:3306/siap_test_dummy",
      JWT_SECRET: "dummy_test_secret_minimal_32_karakter_tidak_dipakai_asli",
    },
  },
});
