import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_OWNER: z.string().min(1).default("AlwaysaqiooOfficial"),
  GITHUB_REPO: z.string().min(1).default("siap-smkn2padang"),
  GITHUB_BRANCH: z.string().min(1).default("main"),
  GITHUB_DATA_DIR: z.string().default("."),
  GITHUB_SYNC_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET minimal 32 karakter demi keamanan"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("SIAP SMKN 2 PADANG"),
  ATTENDANCE_START_TIME: z.string().default("05:00"),
  ATTENDANCE_LATE_AFTER: z.string().default("07:30"),
  ATTENDANCE_END_TIME: z.string().default("10:00"),
  AUTO_ALFA_CRON_TIME: z.string().default("10:00"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = JSON.stringify(parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "test") {
    // Di lingkungan test, jangan matikan process secara paksa — lempar error agar test
    // runner (vitest) bisa melaporkan kegagalan dengan jelas alih-alih exit code misterius.
    throw new Error(`Environment variable tidak valid untuk testing: ${details}`);
  }
  console.error("❌ Environment variable tidak valid:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
