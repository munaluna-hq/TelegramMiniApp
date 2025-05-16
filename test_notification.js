import fetch from 'node-fetch';

async function sendTestNotification() {
  try {
    // Get bot token from environment variables
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN is required!');
      process.exit(1);
    }

    // The Telegram ID to send to
    // Replace this with your actual Telegram ID if needed
    const TELEGRAM_ID = "262371163";

    // Create test notification message
    const message = `🔔 <b>Тестовое уведомление</b> 🔔\n\n` +
                   `Это тестовое уведомление от приложения MunaLuna.\n\n` +
                   `<b>Время:</b> ${new Date().toLocaleTimeString()}\n` +
                   `<b>Дата:</b> ${new Date().toLocaleDateString()}\n\n` +
                   `Если вы видите это сообщение и слышите звуковое уведомление, значит система уведомлений работает правильно!`;

    // Prepare the API call
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: TELEGRAM_ID,
      text: message,
      parse_mode: "HTML",
      disable_notification: false  // Ensure notification sound is enabled
    };

    console.log(`Sending test notification to Telegram ID: ${TELEGRAM_ID}`);

    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Test notification sent successfully!');
      console.log('Check your Telegram app to verify you received it with sound notification');
    } else {
      console.error('❌ Failed to send test notification:', result.description);
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Run the function
sendTestNotification();