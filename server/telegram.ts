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
    // First, store the notification for development mode display
    // (this will work in both dev and production, providing a backup log)
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
    
    // Now try to send the actual Telegram notification
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token not configured");
      return false;
    }
    
    // Make the API call to Telegram
    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const requestBody = {
      chat_id: telegramId,
      text: message,
      parse_mode: "HTML"
    };
    
    console.log(`Sending Telegram API request to: ${apiUrl}`);
    console.log(`With payload: ${JSON.stringify(requestBody)}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json() as any;
    
    if (!data.ok) {
      console.error(`Telegram API error: ${data.description}`);
    } else {
      console.log(`Telegram notification successfully sent to user ${telegramId}`);
    }
    
    return data.ok === true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}

// Function to get development mode notifications
export function getDevModeNotifications(): DevNotification[] {
  return [...devModeNotifications];
}
