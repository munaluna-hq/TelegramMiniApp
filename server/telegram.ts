import crypto from "crypto";
import fetch from "node-fetch";

// Verify Telegram WebApp data
export function verifyTelegramData(initData: string, botToken: string): boolean {
  try {
    const data = new URLSearchParams(initData);
    const hash = data.get("hash");
    
    if (!hash) return false;
    
    // Remove hash from the data
    data.delete("hash");
    
    // Sort params alphabetically
    const params: [string, string][] = [];
    data.forEach((value, key) => {
      params.push([key, value]);
    });
    params.sort(([a], [b]) => a.localeCompare(b));
    
    // Recreate the data string
    const dataString = params.map(([key, value]) => `${key}=${value}`).join("\n");
    
    // Create a secret key from the bot token
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();
    
    // Generate the hash
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataString)
      .digest("hex");
    
    return calculatedHash === hash;
  } catch (error) {
    console.error("Error verifying Telegram data:", error);
    return false;
  }
}

// Store for development mode notifications
interface DevNotification {
  message: string;
  timestamp: number;
}

const devModeNotifications: DevNotification[] = [];

// Send notification via Telegram Bot API
export async function sendTelegramNotification(telegramId: string, message: string): Promise<boolean> {
  try {
    // Ensure we're working with a valid telegram ID
    if (!telegramId || telegramId === 'undefined' || telegramId === 'null') {
      console.error("Invalid Telegram ID provided");
      return false;
    }
    
    // First, store the notification for development mode display
    console.log(`Notification to user ${telegramId}: ${message}`);
    
    // Strip HTML tags for cleaner display in dev mode
    const cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Store the notification
    devModeNotifications.push({
      message: cleanMessage,
      timestamp: Date.now()
    });
    
    // Limit the number of stored notifications to prevent memory issues
    if (devModeNotifications.length > 50) {
      devModeNotifications.shift();
    }
    
    // Skip actual delivery in local dev mode if it's the mock user ID
    // This prevents console errors while still allowing us to test the flow
    if (process.env.NODE_ENV === 'development' && telegramId === '12345') {
      console.log("Development mode: Skipping actual delivery for mock user");
      return true;
    }
    
    // Now try to send the actual Telegram notification
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token not configured");
      return false;
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Make the API call to Telegram - don't validate the bot first to reduce latency
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const requestBody = {
      chat_id: telegramId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false  // Ensure notification is sent with sound
    };
    
    console.log(`Sending notification to Telegram user ID: ${telegramId}`);
    
    // Try with a timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Parse response
      const data = await response.json() as any;
      
      if (!data.ok) {
        console.error(`Telegram API error: ${data.description}`);
        
        // Troubleshooting specific errors
        if (data.description?.includes("chat not found")) {
          console.error("Error: The user has not started a conversation with the bot yet");
          console.error("User must send /start to the bot before receiving messages");
          
          // Try to fall back to direct message using TelegramWebhook approach as a last resort
          // if this was a real user (not development mode)
          if (telegramId !== '12345') {
            try {
              const { sendTelegramMessage } = await import('./telegram-webhook');
              await sendTelegramMessage(telegramId, message);
            } catch (fallbackError) {
              console.error("Failed to send fallback message:", fallbackError);
            }
          }
        } else if (data.description?.includes("bot was blocked")) {
          console.error("Error: The user has blocked the bot");
        }
      } else {
        console.log(`✅ Notification successfully sent to Telegram user ${telegramId}`);
      }
      
      return data.ok === true;
    } catch (fetchError) {
      console.error("Error sending notification:", fetchError);
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    console.error("Error in notification process:", error);
    return false;
  }
}

// Function to get development mode notifications
export function getDevModeNotifications(): DevNotification[] {
  return [...devModeNotifications];
}
