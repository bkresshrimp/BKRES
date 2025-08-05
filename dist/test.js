"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const services_1 = require("./services");
const logger_1 = require("./logger");
async function testFptMail() {
    console.log('🔍 Testing FPT Mail Connections...\n');
    const fptMailConfig = config_1.configs.fptMailConfig.filter((config) => config.is_active);
    if (fptMailConfig.length === 0) {
        console.log('❌ No active FPT mail configurations found!');
        return;
    }
    for (const config of fptMailConfig) {
        console.log(`\n📧 Testing [${config.tenant}]:`);
        console.log(`   Host: ${config.host}:${config.port}`);
        console.log(`   User: ${config.user}`);
        console.log(`   Folders: ${config.folders?.join(', ') || 'INBOX'}`);
        const dateRunning = `Test - ${new Date().toISOString()}`;
        try {
            // Test connection
            console.log('   🔄 Testing connection...');
            const connectionResult = await (0, services_1.testFptMailConnection)(config, dateRunning);
            if (connectionResult.success) {
                console.log(`   ✅ Connection successful!`);
                // Test reading emails
                console.log('   📬 Testing email reading...');
                const emails = await (0, services_1.getEmails)(config, dateRunning);
                console.log(`   ✅ Successfully read ${emails.length} emails`);
                if (emails.length > 0) {
                    console.log(`   📊 Sample emails:`);
                    emails.slice(0, 3).forEach((email, index) => {
                        console.log(`      ${index + 1}. "${email.subject}" from ${email.from}`);
                    });
                }
            }
            else {
                console.log(`   ❌ Connection failed: ${connectionResult.message}`);
            }
        }
        catch (error) {
            console.log(`   💥 Error: ${error.message}`);
            logger_1.logger.error(`Test error for [${config.tenant}]:`, error);
        }
        console.log('   ' + '-'.repeat(50));
    }
    console.log('\n🎯 Test completed!');
}
// Chạy test
testFptMail().catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test.js.map