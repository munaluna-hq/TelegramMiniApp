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
        console.log("Development mode: Using mock user data");
        return {
          id: 12345,
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
    console.log("Development mode: Using mock user data");
    return {
      id: 12345,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
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
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showAlert(message);
  } else {
    alert(message);
  }
}
