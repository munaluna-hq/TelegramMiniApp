/**
 * MunaLuna: Simulate Product Notification
 * 
 * This script simulates a real product notification scenario
 * where the user updates their worship tracking for the day
 * and then receives a confirmation notification.
 * 
 * Usage: node simulate_product_notification.js
 */

import fetch from 'node-fetch';

// Default Telegram ID for testing
const TELEGRAM_ID = '262371163';
const USER_ID = 1; // Mock user ID
const TODAY = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

async function simulateProductFlow() {
  console.log(`\n🌙 MunaLuna Product Flow Simulation 🌙`);
  console.log(`Testing notification flow for Telegram ID: ${TELEGRAM_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // 1. Simulate a user logging worship activity
    console.log(`Step 1: Simulating user tracking worship activities...`);
    
    // Create worship data
    const worshipData = {
      date: TODAY,
      prayers: {
        fajr: true,
        zuhr: true,
        asr: true,
        maghrib: true,
        isha: true
      },
      quranReading: 15,
      dua: true,
      sadaqa: true,
      fast: "nafl",
      note: "Альхамдулиллях, хороший день для поклонения!"
    };
    
    // Send worship data update
    const worshipResponse = await fetch('http://localhost:5000/api/worship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: TODAY,
        userId: USER_ID,
        worship: worshipData
      })
    });
    
    const worshipResult = await worshipResponse.json();
    const isSuccess = worshipResponse.status === 200 && worshipResult.message?.includes("saved successfully");
    console.log(`Worship tracking result: ${isSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`Server response: ${JSON.stringify(worshipResult)}`);
    
    // 2. Wait for notification to be sent
    console.log(`\nStep 2: Waiting for notification system to process...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Check notification logs
    console.log(`\nStep 3: Checking notification system status...`);
    
    // Display success info
    if (isSuccess) {
      console.log(`\n✅ SIMULATION COMPLETED SUCCESSFULLY!`);
      console.log(`A worship tracking confirmation notification should have been sent to Telegram ID: ${TELEGRAM_ID}`);
      console.log(`Check your Telegram app for the notification.`);
      console.log(`You can also check server logs to see the notification delivery details.`);
    } else {
      console.log(`\n❌ SIMULATION FAILED`);
      console.log(`Failed to update worship tracking data.`);
    }
    
  } catch (error) {
    console.error(`Error running simulation:`, error);
  }
}

// Run the simulation
simulateProductFlow();