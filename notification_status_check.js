/**
 * MunaLuna Notification System Status Check
 * 
 * This script checks the status of various notification components
 * and sends a status update to a specified Telegram ID.
 * 
 * It can be run periodically to ensure all notification systems 
 * are working properly.
 * 
 * Usage: node notification_status_check.js [telegram_id]
 */

import { sendReliableNotification } from './server/better-notify.js';
import { getWebhookInfo } from './server/telegram-webhook.js';
import fetch from 'node-fetch';

// Target Telegram ID (default is admin ID)
const targetId = process.argv[2] || '262371163';

// Check notification system status
async function checkNotificationStatus() {
  console.log(`\n🔍 Checking MunaLuna notification system status...\n`);
  
  const statusReport = {
    botToken: false,
    webhook: {
      status: false,
      url: null,
      lastError: null
    },
    botInfo: {
      status: false,
      name: null,
      username: null
    },
    sendMessage: false
  };
  
  try {
    // Get bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      statusReport.botToken = true;
      console.log('✅ Bot token is available');
    } else {
      console.log('❌ Bot token is missing');
    }
    
    // Check webhook status
    try {
      const webhookInfo = await getWebhookInfo();
      if (webhookInfo && webhookInfo.ok) {
        statusReport.webhook.status = true;
        statusReport.webhook.url = webhookInfo.result.url;
        
        if (webhookInfo.result.last_error_message) {
          statusReport.webhook.lastError = webhookInfo.result.last_error_message;
        }
        
        console.log(`✅ Webhook status: ${webhookInfo.result.url ? 'Set' : 'Not set'}`);
        if (webhookInfo.result.url) {
          console.log(`   URL: ${webhookInfo.result.url}`);
        }
      } else {
        console.log('❌ Could not retrieve webhook information');
      }
    } catch (error) {
      console.error('Error checking webhook status:', error);
    }
    
    // Check bot info
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfo = await response.json();
      
      if (botInfo && botInfo.ok) {
        statusReport.botInfo.status = true;
        statusReport.botInfo.name = botInfo.result.first_name;
        statusReport.botInfo.username = botInfo.result.username;
        
        console.log(`✅ Bot info retrieved successfully`);
        console.log(`   Name: ${botInfo.result.first_name}`);
        console.log(`   Username: @${botInfo.result.username}`);
      } else {
        console.log('❌ Could not retrieve bot information');
      }
    } catch (error) {
      console.error('Error checking bot information:', error);
    }
    
    // Send a test message
    const testResult = await sendReliableNotification(
      targetId, 
      `🔍 <b>Проверка системы уведомлений</b>\n\n` + 
      `Это автоматическая проверка системы уведомлений MunaLuna.\n\n` +
      `✅ <b>Статус:</b> Система уведомлений работает нормально\n` +
      `⏱️ <b>Время проверки:</b> ${new Date().toLocaleString()}`,
      {
        useHTML: true,
        enableSound: false,
        priority: "normal",
        retryCount: 1
      }
    );
    
    if (testResult) {
      statusReport.sendMessage = true;
      console.log('✅ Test message sent successfully');
    } else {
      console.log('❌ Failed to send test message');
    }
    
    // Generate overall status
    const allSystemsGo = statusReport.botToken && 
                          statusReport.webhook.status &&
                          statusReport.botInfo.status &&
                          statusReport.sendMessage;
    
    console.log(`\n📊 Overall Status: ${allSystemsGo ? '✅ All systems operational' : '⚠️ Some systems not working'}`);
    
    return statusReport;
  } catch (error) {
    console.error('Error running notification status check:', error);
    return null;
  }
}

// Run the check
checkNotificationStatus().catch(error => {
  console.error('Unhandled error during status check:', error);
});