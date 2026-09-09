import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startAutoAlfaScheduler } from "./jobs/autoAlfa.job";
import { startEmailWorker } from "./utils/emailQueue";
import { logMailerStatus } from "./config/mailer";

// Jalankan server lokal hanya jika TIDAK berjalan di lingkungan Vercel production
if (process.env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    logger.info(`🚀 SIAP SMKN 2 PADANG API berjalan di http://localhost:${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);

    startAutoAlfaScheduler();
    logger.info("⏰ Auto-alfa scheduler aktif (GitHub JSON)");

    logMailerStatus();
    
    startEmailWorker();
    logger.info("📤 Email worker aktif (queue berbasis email_queue GitHub JSON)");
  });
}

// WAJIB: Export app agar bisa dibaca oleh Vercel Serverless Function
export default app;
