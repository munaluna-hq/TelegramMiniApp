/**
 * MunaLuna Telegram Bot Diagnostic Tool
 * 
 * This tool runs a complete diagnosis of the Telegram bot setup
 * and tries multiple methods to send notifications.
 */

import fetch from 'node-fetch';

// Get bot token from environment
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Default chat ID to test with (can be overridden by command line argument)
let testChatId = '262371163';
if (process.argv.length > 2) {
  testChatId = process.argv[2];
}

// For ES module support
const __filename = new URL(import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;

// Run full diagnostics
async function runDiagnostics() {
  console.log('\n🤖 MUNALUNA TELEGRAM BOT DIAGNOSTICS\n');
  
  // Step 1: Check bot token
  console.log('🔍 Step 1: Checking bot token...');
  if (!botToken) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN environment variable is not set!');
    console.log('   Please make sure you have set the TELEGRAM_BOT_TOKEN environment variable.');
    return;
  } else {
    console.log('✅ Bot token is available');
  }
  
  // Step 2: Get bot information
  console.log('\n🔍 Step 2: Retrieving bot information...');
  try {
    const botInfo = await getBotInfo();
    if (botInfo.ok) {
      console.log(`✅ Bot information retrieved successfully!`);
      console.log(`   Name: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Bot ID: ${botInfo.result.id}`);
    } else {
      console.error(`❌ ERROR: Failed to get bot information: ${botInfo.description}`);
      console.log('   The bot token may be invalid. Please check your token.');
      return;
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while getting bot information: ${error.message}`);
    return;
  }
  
  // Step 3: Check webhook configuration
  console.log('\n🔍 Step 3: Checking webhook configuration...');
  try {
    const webhookInfo = await getWebhookInfo();
    if (webhookInfo.ok) {
      if (webhookInfo.result.url) {
        console.log(`✅ Webhook is set to: ${webhookInfo.result.url}`);
        console.log(`   Pending updates: ${webhookInfo.result.pending_update_count}`);
        if (webhookInfo.result.last_error_date) {
          const errorDate = new Date(webhookInfo.result.last_error_date * 1000);
          console.log(`⚠️ Last webhook error: ${webhookInfo.result.last_error_message}`);
          console.log(`   Error time: ${errorDate.toLocaleString()}`);
        } else {
          console.log('✅ No webhook errors reported');
        }
      } else {
        console.log('⚠️ No webhook URL is set! The bot is not receiving updates via webhook.');
      }
    } else {
      console.error(`❌ ERROR: Failed to get webhook info: ${webhookInfo.description}`);
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while checking webhook: ${error.message}`);
  }
  
  // Step 4: Test basic message sending
  console.log('\n🔍 Step 4: Testing basic message sending...');
  console.log(`   Target chat ID: ${testChatId}`);
  
  try {
    const basicResult = await sendBasicMessage(testChatId);
    if (basicResult.ok) {
      console.log('✅ Basic message sent successfully!');
      console.log(`   Message ID: ${basicResult.result.message_id}`);
    } else {
      console.error(`❌ ERROR: Failed to send basic message: ${basicResult.description}`);
      
      if (basicResult.description?.includes('chat not found')) {
        console.log('   Possible reasons:');
        console.log('   1. The user has not started a conversation with the bot');
        console.log('   2. The chat ID is incorrect');
        console.log('   3. The user has blocked the bot');
      }
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while sending basic message: ${error.message}`);
  }
  
  // Step 5: Test formatted message
  console.log('\n🔍 Step 5: Testing formatted message with HTML...');
  try {
    const formattedResult = await sendFormattedMessage(testChatId);
    if (formattedResult.ok) {
      console.log('✅ Formatted HTML message sent successfully!');
      console.log(`   Message ID: ${formattedResult.result.message_id}`);
    } else {
      console.error(`❌ ERROR: Failed to send formatted message: ${formattedResult.description}`);
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while sending formatted message: ${error.message}`);
  }
  
  // Step 6: Test silent message
  console.log('\n🔍 Step 6: Testing silent notification (no sound)...');
  try {
    const silentResult = await sendSilentMessage(testChatId);
    if (silentResult.ok) {
      console.log('✅ Silent message sent successfully!');
      console.log(`   Message ID: ${silentResult.result.message_id}`);
    } else {
      console.error(`❌ ERROR: Failed to send silent message: ${silentResult.description}`);
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while sending silent message: ${error.message}`);
  }
  
  // Step 7: Test loud notification
  console.log('\n🔍 Step 7: Testing loud notification (with sound)...');
  try {
    const loudResult = await sendLoudMessage(testChatId);
    if (loudResult.ok) {
      console.log('✅ Loud notification sent successfully!');
      console.log(`   Message ID: ${loudResult.result.message_id}`);
    } else {
      console.error(`❌ ERROR: Failed to send loud notification: ${loudResult.description}`);
    }
  } catch (error) {
    console.error(`❌ ERROR: Exception while sending loud notification: ${error.message}`);
  }
  
  // Summary
  console.log('\n✨ DIAGNOSIS COMPLETE ✨');
  console.log('If any of the test messages were successful, you should have received them in Telegram.');
  console.log('Please check your Telegram app for messages from the bot.');
}

// Utility functions
async function getBotInfo() {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const response = await fetch(url);
  return await response.json();
}

async function getWebhookInfo() {
  const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  const response = await fetch(url);
  return await response.json();
}

async function sendBasicMessage(chatId) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🔧 Basic Message Test: This is a simple test message from MunaLuna diagnostic tool.',
    }),
  });
  return await response.json();
}

async function sendFormattedMessage(chatId) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const text = `
<b>🔧 Formatted Message Test</b>

This message tests <i>HTML formatting</i> in Telegram.

✅ <b>Bold text</b>
✅ <i>Italic text</i>
✅ <code>Monospace text</code>
✅ <a href="https://telegram.org">Hyperlink</a>

<b>Time:</b> ${new Date().toLocaleTimeString()}
  `;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  return await response.json();
}

async function sendSilentMessage(chatId) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🔕 Silent Message Test: This notification should arrive silently (no sound).',
      disable_notification: true,
    }),
  });
  return await response.json();
}

async function sendLoudMessage(chatId) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🔔 LOUD MESSAGE TEST: This notification should make a sound!',
      disable_notification: false,
    }),
  });
  return await response.json();
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Unhandled error during diagnostics:', error);
});