"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("./config");
const services_1 = require("./services");
const logger_1 = require("./logger");
async function main() {
    try {
        // Tạo thư mục logs nếu chưa có
        const fs = require('fs');
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
        logger_1.logger.info('🚀 Starting FPT Mail Reader Service...');
        // FPT mail reading job
        const fptMailConfig = config_1.configs.fptMailConfig.filter((config) => config.is_active);
        logger_1.logger.info(`📧 FPT mail service started with ${fptMailConfig.length} active configs`);
        if (fptMailConfig.length === 0) {
            logger_1.logger.warn('⚠️ No active FPT mail configurations found!');
            return;
        }
        // Tạo cron job cho mỗi FPT mail config
        for (const fpt of fptMailConfig) {
            logger_1.logger.info(`⏰ Setting up cron job for [${fpt.tenant}] with schedule: ${fpt.cronTime}`);
            node_cron_1.default.schedule(fpt.cronTime, async () => {
                const dateRunning = `FPT - Date running: ${new Date().toISOString()}`;
                logger_1.logger.info(`🔄 [${fpt.tenant}] ${dateRunning}`);
                try {
                    // Test connection trước
                    const connectionResult = await (0, services_1.testFptMailConnection)(fpt, dateRunning);
                    if (connectionResult.success) {
                        // Nếu kết nối thành công, đọc emails
                        logger_1.logger.info(`📬 [${fpt.tenant}] Connection successful, reading emails...`);
                        const emails = await (0, services_1.getEmails)(fpt, dateRunning);
                        logger_1.logger.info(`✅ [${fpt.tenant}] Successfully read ${emails.length} emails`);
                        // Có thể xử lý emails ở đây (lưu vào database, gửi webhook, etc.)
                        if (emails.length > 0) {
                            logger_1.logger.info(`📊 [${fpt.tenant}] Email summary:`);
                            emails.forEach((email, index) => {
                                logger_1.logger.info(`   ${index + 1}. ${email.subject} - From: ${email.from}`);
                            });
                        }
                    }
                    else {
                        logger_1.logger.error(`❌ [${fpt.tenant}] Connection failed: ${connectionResult.message}`);
                    }
                }
                catch (error) {
                    logger_1.logger.error(`💥 [${fpt.tenant}] Error in cron job: ${error.message}`, { error: error.stack });
                }
            }, {
                scheduled: true,
                timezone: process.env.TIMEZONE || "Asia/Ho_Chi_Minh"
            });
            logger_1.logger.info(`✅ [${fpt.tenant}] Cron job scheduled successfully`);
        }
        // Test connection ngay lập tức khi khởi động
        logger_1.logger.info('🔍 Testing all FPT mail connections on startup...');
        for (const fpt of fptMailConfig) {
            const dateRunning = `Startup test - ${new Date().toISOString()}`;
            try {
                const result = await (0, services_1.testFptMailConnection)(fpt, dateRunning);
                if (result.success) {
                    logger_1.logger.info(`✅ [${fpt.tenant}] Startup connection test passed`);
                }
                else {
                    logger_1.logger.error(`❌ [${fpt.tenant}] Startup connection test failed: ${result.message}`);
                }
            }
            catch (error) {
                logger_1.logger.error(`💥 [${fpt.tenant}] Startup connection test error: ${error.message}`);
            }
        }
        logger_1.logger.info('🎯 FPT Mail Reader Service is now running. Press Ctrl+C to stop.');
        // Graceful shutdown
        process.on('SIGINT', () => {
            logger_1.logger.info('🛑 Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info('🛑 Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('💥 Fatal error in main function:', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}
// Xử lý uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('💥 Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('💥 Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
main();
//# sourceMappingURL=index.js.map