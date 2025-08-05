const { testFptMailConnection } = require('./dist/services');

// Demo config (không sử dụng .env)
const demoConfig = {
  tenant: 'DEMO',
  user: 'demo@fpt.com',
  password: 'demo_password',
  host: 'mail.fpt.com',
  port: 993,
  cronTime: '*/5 * * * *',
  is_active: true,
  maxEmails: 5,
  folders: ['INBOX']
};

async function demo() {
  console.log('🔍 FPT Mail Connection Demo');
  console.log('=====================================');
  console.log('Config:', {
    tenant: demoConfig.tenant,
    host: demoConfig.host,
    port: demoConfig.port,
    user: demoConfig.user,
    password: '***hidden***'
  });
  console.log('');
  
  try {
    const dateRunning = `Demo - ${new Date().toISOString()}`;
    console.log('⏳ Testing connection...');
    
    const result = await testFptMailConnection(demoConfig, dateRunning);
    
    console.log('📋 Result:', {
      success: result.success,
      message: result.message,
      tenant: result.tenant,
      timestamp: result.timestamp
    });
    
    if (result.success) {
      console.log('✅ Demo completed successfully!');
    } else {
      console.log('❌ Demo failed - this is expected with demo credentials');
    }
    
  } catch (error) {
    console.log('💥 Demo error (expected with demo credentials):', error.message);
  }
  
  console.log('');
  console.log('💡 To use with real credentials:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Update with your FPT Mail credentials');
  console.log('   3. Run: npm run test');
}

demo();