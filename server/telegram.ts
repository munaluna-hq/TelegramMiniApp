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

// Send notification via Telegram Bot API
export async function sendTelegramNotification(telegramId: string, message: string): Promise<boolean> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("Telegram bot token not configured");
      return false;
    }
    
    console.log(`Attempting to send Telegram notification to user ID: ${telegramId}`);
    
    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log(`Using API URL: ${apiUrl}`);
    
    const requestBody = {
      chat_id: telegramId,
      text: message,
      parse_mode: "HTML"
    };
    console.log(`Request payload: ${JSON.stringify(requestBody, null, 2)}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    console.log(`Telegram API response: ${JSON.stringify(data)}`);
    
    if (!data.ok) {
      console.error(`Telegram API error: ${data.description}`);
    }
    
    return data.ok === true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}
