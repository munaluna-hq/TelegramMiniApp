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
  // Check if we're in the Telegram WebApp environment
  if (window.Telegram && window.Telegram.WebApp) {
    // Try to get user data from Telegram WebApp
    if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
      const userData = window.Telegram.WebApp.initDataUnsafe.user;
      console.log("Telegram user data found:", userData);
      
      // Ensure we have a valid numeric ID that can be used for notifications
      if (userData.id) {
        return userData as TelegramUser;
      } else {
        console.warn("Telegram user data found but ID is missing, generating unique ID");
        // Generate a unique ID based on current timestamp to avoid data collision
        const uniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
        return {
          ...userData,
          id: uniqueId,
          auth_date: userData.auth_date || Math.floor(Date.now() / 1000),
          hash: userData.hash || "telegram_data_hash"
        } as TelegramUser;
      }
    } else {
      console.log("Telegram WebApp found, but no user data available yet.");
      
      // For development/testing only - return mock user with unique ID
      if (process.env.NODE_ENV === 'development') {
        // Generate a unique ID to ensure data isolation in development
        const devUniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
        console.log("Development mode: Using mock user data with unique ID for data isolation");
        return {
          id: devUniqueId,
          first_name: "Test",
          last_name: "User",
          username: "testuser_" + devUniqueId,
          auth_date: Math.floor(Date.now() / 1000),
          hash: "mock_hash"
        };
      }
      
      // Generate a unique session ID to avoid data collisions
      const sessionUniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
      console.log("Using session-specific unique ID for data isolation");
      return {
        id: sessionUniqueId,
        first_name: "Telegram",
        last_name: "User",
        auth_date: Math.floor(Date.now() / 1000),
        hash: "fallback_hash"
      };
    }
  }
  
  console.warn("Telegram Web App not found, using mock data with unique ID");
  
  // Generate unique ID for browser testing to ensure data isolation
  const browserUniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
  
  // If we're not in a Telegram environment, provide a unique user for testing
  return {
    id: browserUniqueId,
    first_name: "Test",
    last_name: "User",
    username: "testuser_" + browserUniqueId,
    auth_date: Math.floor(Date.now() / 1000),
    hash: "mock_hash"
  };
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
