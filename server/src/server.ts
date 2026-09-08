import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startAutoAlfaScheduler } from "./jobs/autoAlfa.job";
import { startEmailWorker } from "./utils/emailQueue";
import { logMailerStatus } from "./config/mailer";

app.listen(env.PORT, () => {
  logger.info(`🚀 SIAP SMKN 2 PADANG API berjalan di http://localhost:${env.PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);

  startAutoAlfaScheduler();
  logger.info("⏰ Auto-alfa scheduler aktif (cek tiap menit, jam mengikuti school_settings)");

  logMailerStatus();
  startEmailWorker();
  logger.info("📤 Email worker aktif (queue berbasis email_logs, diproses di background)");
});
