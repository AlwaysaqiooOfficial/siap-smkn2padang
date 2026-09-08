import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startAutoAlfaScheduler } from "./jobs/autoAlfa.job";
import { startEmailWorker } from "./utils/emailQueue";
import { logMailerStatus } from "./config/mailer";

const isPrismaAvailable = () => {
  return !!env.DATABASE_URL && env.DATABASE_URL.length > 0;
};

app.listen(env.PORT, () => {
  logger.info(`🚀 SIAP SMKN 2 PADANG API berjalan di http://localhost:${env.PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);

  if (isPrismaAvailable()) {
    startAutoAlfaScheduler();
    logger.info("⏰ Auto-alfa scheduler aktif (cek tiap menit, jam mengikuti school_settings)");
  } else {
    logger.info("⏭️  Auto-alfa scheduler skipped (DATABASE_URL tidak tersedia)");
  }

  logMailerStatus();
  
  if (isPrismaAvailable()) {
    startEmailWorker();
    logger.info("📤 Email worker aktif (queue berbasis email_logs, diproses di background)");
  } else {
    logger.info("⏭️  Email worker skipped (DATABASE_URL tidak tersedia)");
  }
});
