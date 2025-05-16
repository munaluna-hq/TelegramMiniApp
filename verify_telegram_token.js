/**
 * Telegram Token Verification Script
 * This script verifies that your Telegram bot token is valid and working
 */

import fetch from 'node-fetch';

// Get information about the bot itself
async function getBotInfo() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("❌ TELEGRAM_BOT_TOKEN is not set in environment variables!");
      return null;
    }
    
    console.log("🔍 Verifying bot token...");
    
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Bot token is valid!");
      console.log("📊 Bot Information:");
      console.log(`   Name: ${result.result.first_name}`);
      console.log(`   Username: @${result.result.username}`);
      console.log(`   Bot ID: ${result.result.id}`);
      return result.result;
    } else {
      console.error("❌ Bot token is invalid:", result.description);
      return null;
    }
  } catch (error) {
    console.error("❌ Error checking bot token:", error);
    return null;
  }
}

// Get current webhook information
async function getWebhookInfo() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    
    console.log("\n🔍 Checking webhook configuration...");
    
    const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const result = await response.json();
    
    if (result.ok) {
      if (result.result.url) {
        console.log(`✅ Webhook is set to: ${result.result.url}`);
        console.log(`   Pending updates: ${result.result.pending_update_count}`);
        if (result.result.last_error_date) {
          const errorDate = new Date(result.result.last_error_date * 1000);
          console.log(`❌ Last error: ${result.result.last_error_message} at ${errorDate.toLocaleString()}`);
        } else {
          console.log("✅ No webhook errors reported");
        }
      } else {
        console.log("❌ No webhook URL is set!");
      }
      return result.result;
    } else {
      console.error("❌ Error getting webhook info:", result.description);
      return null;
    }
  } catch (error) {
    console.error("❌ Error checking webhook:", error);
    return null;
  }
}

// Send a test message to verify the Telegram API is working
async function sendTestMessage(chatId) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;
    
    console.log(`\n🔍 Attempting to send test message to chat ID: ${chatId}...`);
    
    // Prepare a test message with the current timestamp
    const testMessage = 
      `🧪 TEST MESSAGE 🧪\n\n` +
      `This is a test message sent at: ${new Date().toLocaleString()}\n\n` +
      `If you can see this message, your Telegram bot is configured correctly! ✅`;
    
    // Send the message
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        disable_notification: false
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ Test message sent successfully!");
      return true;
    } else {
      console.error("❌ Failed to send test message:", result.description);
      
      if (result.description.includes("chat not found")) {
        console.log("\nℹ️ The chat ID may be incorrect or the user hasn't started the bot.");
        console.log("   Make sure the user has sent a /start command to the bot first.");
      }
      
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending test message:", error);
    return false;
  }
}

// Main verification function
async function verifyTelegramSetup() {
  console.log("🤖 TELEGRAM BOT VERIFICATION\n");
  
  // Check for token
  const botInfo = await getBotInfo();
  if (!botInfo) {
    console.log("\n❌ Bot verification failed! Please check your TELEGRAM_BOT_TOKEN.");
    return;
  }
  
  // Check webhook
  const webhookInfo = await getWebhookInfo();
  
  // Attempt to send a test message to the chat ID
  console.log("\n🔍 Testing message delivery...");
  const chatId = "262371163"; // Your chat ID
  const messageSent = await sendTestMessage(chatId);
  
  if (messageSent) {
    console.log("\n✅ VERIFICATION COMPLETE: Your Telegram bot is working correctly!");
    console.log("   You should have received a test message in your Telegram app.");
  } else {
    console.log("\n❌ VERIFICATION INCOMPLETE: Could not send test message.");
    console.log("   Please check the error messages above for more information.");
    
    // Provide troubleshooting advice
    console.log("\n🔧 TROUBLESHOOTING STEPS:");
    console.log("1. Confirm that your TELEGRAM_BOT_TOKEN is correct");
    console.log("2. Make sure you have started a chat with your bot by sending /start");
    console.log("3. Verify that your chat ID (262371163) is correct");
    console.log("4. Check if your bot is blocked by privacy settings");
  }
}

// Run the verification
verifyTelegramSetup();