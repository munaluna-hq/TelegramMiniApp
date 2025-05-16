// Define Telegram user interface
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Function to get Telegram Web App data
export function getTelegramUser(): TelegramUser | null {
  if (window.Telegram && window.Telegram.WebApp) {
    if (!window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
      console.log("Telegram WebApp found, but no user data available yet. This is normal on initial load.");
      
      // For development/testing only - return mock user if in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Using mock user data with real Telegram ID");
        return {
          id: 262371163, // Using real Telegram ID for notifications
          first_name: "Test",
          last_name: "User",
          username: "testuser",
          auth_date: Math.floor(Date.now() / 1000),
          hash: "mock_hash"
        };
      }
      
      return null;
    }
    
    console.log("Telegram user data found:", window.Telegram.WebApp.initDataUnsafe.user);
    return window.Telegram.WebApp.initDataUnsafe.user as TelegramUser;
  }
  
  console.warn("Telegram Web App not found");
  
  // For development/testing only - return mock user if in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: Using mock user data with real Telegram ID");
    return {
      id: 262371163, // Using real Telegram ID for notifications
      first_name: "Guljan",
      last_name: "",
      username: "iamguljan", // Using real username
      auth_date: Math.floor(Date.now() / 1000),
      hash: "mock_hash"
    };
  }
  
  return null;
}

// Get Telegram initData for validation on the server
export function getTelegramInitData(): string | null {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp.initData;
  }
  return null;
}

// Show native Telegram loading indicator
export function showLoading(): void {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.MainButton.showProgress();
  }
}

// Hide native Telegram loading indicator
export function hideLoading(): void {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.MainButton.hideProgress();
  }
}

// Close the Web App
export function closeWebApp(): void {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
}

// Show an alert via Telegram's native UI
export function showAlert(message: string): void {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      // Try to use the Telegram popup if available
      if (typeof window.Telegram.WebApp.showPopup === 'function') {
        window.Telegram.WebApp.showPopup({
          title: 'Уведомление',
          message: message,
          buttons: [{ type: 'default', text: 'ОК' }]
        });
      } else {
        // Fallback to regular alert for development or if showPopup is not available
        console.log('Telegram notification (simulated):', message);
      }
    } else {
      // Fallback for non-Telegram environments
      console.log('Telegram notification (simulated):', message);
    }
  } catch (error) {
    console.warn('Error showing Telegram alert:', error);
  }
}
