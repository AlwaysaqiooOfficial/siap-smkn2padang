import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { sanitizeInput } from "./middlewares/sanitize.middleware";
import { githubSyncMiddleware } from "./middlewares/githubSync.middleware";
import { loadCollections } from "./services/jsonDatabase";

const app = express();

// Initialize JSON database from GitHub on startup
const collectionsReady = env.GITHUB_SYNC_ENABLED
  ? loadCollections().catch((err) => {
      console.error("❌ Failed to load collections:", err);
      throw err;
    })
  : Promise.resolve();

// Hanya aktifkan jika benar-benar di belakang reverse proxy (lihat catatan TRUST_PROXY di .env.example) —
// diperlukan agar req.ip (dipakai rate limiting & activity_logs) membaca IP klien asli, bukan IP proxy.
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by"); // defense in depth — jangan bocorkan detail framework backend

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Never serve or mutate the in-memory cache while the initial GitHub load is pending.
app.use(async (_req, _res, next) => {
  try {
    await collectionsReady;
    next();
  } catch (error) {
    next(error);
  }
});

app.use(githubSyncMiddleware);

// Sanitasi rekursif body/params (strip tag HTML/script & null byte) SEBELUM masuk ke validasi Zod.
app.use(sanitizeInput);

// Rate limit umum untuk seluruh API.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Terlalu banyak permintaan, coba lagi nanti." },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "SIAP SMKN 2 PADANG API is running", time: new Date() });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
