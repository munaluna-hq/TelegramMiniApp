import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

// Wait for the Telegram WebApp to be ready
document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
