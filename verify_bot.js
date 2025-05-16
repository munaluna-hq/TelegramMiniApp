/**
 * MunaLuna: Telegram Bot Verification
 * 
 * This script performs a complete verification of the Telegram bot configuration
 * and checks if the bot can send messages to a specific chat ID.
 */

// Get the Telegram Bot Token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const testChatId = '262371163';  // The chat ID to test with

async function verifyBot() {
  console.log('🔍 Starting Telegram Bot Verification');
  console.log('======================================');
  
  // Check if token exists
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is not set!');
    return false;
  }
  
  console.log(`✅ TELEGRAM_BOT_TOKEN is set (length: ${token.length})`);
  
  try {
    // 1. Get Bot Info
    console.log('\n📊 Getting bot information...');
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const botInfo = await botInfoResponse.json();
    
    if (!botInfo.ok) {
      console.error(`❌ Failed to get bot info: ${botInfo.description}`);
      return false;
    }
    
    console.log(`✅ Bot connected successfully!`);
    console.log(`🤖 Bot Username: @${botInfo.result.username}`);
    console.log(`🆔 Bot ID: ${botInfo.result.id}`);
    console.log(`📛 Bot Name: ${botInfo.result.first_name}`);
    
    // 2. Get Webhook Info
    console.log('\n🔗 Checking webhook configuration...');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();
    
    if (!webhookInfo.ok) {
      console.error(`❌ Failed to get webhook info: ${webhookInfo.description}`);
    } else {
      console.log(`✅ Webhook information retrieved!`);
      
      const webhook = webhookInfo.result;
      console.log(`🌐 URL: ${webhook.url || 'Not set'}`);
      console.log(`🚦 Has Custom Certificate: ${webhook.has_custom_certificate}`);
      console.log(`⚠️ Pending Update Count: ${webhook.pending_update_count}`);
      
      if (webhook.last_error_date) {
        const errorDate = new Date(webhook.last_error_date * 1000);
        console.log(`❌ Last Error: ${webhook.last_error_message} (${errorDate.toLocaleString()})`);
      }
    }
    
    // 3. Send Test Message
    console.log('\n📨 Sending test message...');
    const messageText = `
🛠️ MunaLuna Bot Verification

This is a verification message from the MunaLuna bot.
Time: ${new Date().toLocaleString()}
This message confirms that the bot can successfully send messages.

Bot Username: @${botInfo.result.username}
Bot ID: ${botInfo.result.id}
    `;
    
    const sendMessageResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: testChatId,
          text: messageText,
          disable_notification: false
        })
      }
    );
    
    const sendResult = await sendMessageResponse.json();
    
    if (!sendResult.ok) {
      console.error(`❌ Failed to send message: ${sendResult.description}`);
      return false;
    }
    
    console.log(`✅ Test message sent successfully to chat ID ${testChatId}!`);
    console.log(`🆔 Message ID: ${sendResult.result.message_id}`);
    
    // 4. Verification Complete
    console.log('\n🎉 Bot verification completed successfully!');
    console.log('The bot is properly configured and can send messages.');
    return true;
    
  } catch (error) {
    console.error(`❌ Error during verification: ${error.message}`);
    return false;
  }
}

// Run the verification
verifyBot().then(success => {
  if (!success) {
    console.log('\n❌ Bot verification failed. Please check the errors above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});