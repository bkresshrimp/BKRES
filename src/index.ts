import cron from "node-cron";
import { configs } from "./config";
import { getEmails, testFptMailConnection } from "./services";
import { logger } from "./logger";
import { FptMailConfig } from "./interfaces";

async function main(): Promise<void> {
  try {
    // Tạo thư mục logs nếu chưa có
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }

    logger.info('🚀 Starting FPT Mail Reader Service...');

    // FPT mail reading job
    const fptMailConfig: FptMailConfig[] = configs.fptMailConfig.filter(
      (config: FptMailConfig) => config.is_active
    );
    
    logger.info(`📧 FPT mail service started with ${fptMailConfig.length} active configs`);

    if (fptMailConfig.length === 0) {
      logger.warn('⚠️ No active FPT mail configurations found!');
      return;
    }

    // Tạo cron job cho mỗi FPT mail config
    for (const fpt of fptMailConfig) {
      logger.info(`⏰ Setting up cron job for [${fpt.tenant}] with schedule: ${fpt.cronTime}`);
      
      cron.schedule(fpt.cronTime, async () => {
        const dateRunning = `FPT - Date running: ${new Date().toISOString()}`;
        logger.info(`🔄 [${fpt.tenant}] ${dateRunning}`);
        
        try {
          // Test connection trước
          const connectionResult = await testFptMailConnection(fpt, dateRunning);
          
          if (connectionResult.success) {
            // Nếu kết nối thành công, đọc emails
            logger.info(`📬 [${fpt.tenant}] Connection successful, reading emails...`);
            const emails = await getEmails(fpt, dateRunning);
            logger.info(`✅ [${fpt.tenant}] Successfully read ${emails.length} emails`);
            
            // Có thể xử lý emails ở đây (lưu vào database, gửi webhook, etc.)
            if (emails.length > 0) {
              logger.info(`📊 [${fpt.tenant}] Email summary:`);
              emails.forEach((email, index) => {
                logger.info(`   ${index + 1}. ${email.subject} - From: ${email.from}`);
              });
            }
          } else {
            logger.error(`❌ [${fpt.tenant}] Connection failed: ${connectionResult.message}`);
          }
        } catch (error: any) {
          logger.error(`💥 [${fpt.tenant}] Error in cron job: ${error.message}`, { error: error.stack });
        }
      }, {
        scheduled: true,
        timezone: process.env.TIMEZONE || "Asia/Ho_Chi_Minh"
      });
      
      logger.info(`✅ [${fpt.tenant}] Cron job scheduled successfully`);
    }

    // Test connection ngay lập tức khi khởi động
    logger.info('🔍 Testing all FPT mail connections on startup...');
    for (const fpt of fptMailConfig) {
      const dateRunning = `Startup test - ${new Date().toISOString()}`;
      try {
        const result = await testFptMailConnection(fpt, dateRunning);
        if (result.success) {
          logger.info(`✅ [${fpt.tenant}] Startup connection test passed`);
        } else {
          logger.error(`❌ [${fpt.tenant}] Startup connection test failed: ${result.message}`);
        }
      } catch (error: any) {
        logger.error(`💥 [${fpt.tenant}] Startup connection test error: ${error.message}`);
      }
    }

    logger.info('🎯 FPT Mail Reader Service is now running. Press Ctrl+C to stop.');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('🛑 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('🛑 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('💥 Fatal error in main function:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Xử lý uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

main();