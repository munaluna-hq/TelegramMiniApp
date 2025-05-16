/**
 * MunaLuna: Test Cycle Notification
 * 
 * This script tests the cycle update notification functionality,
 * which is a key feature of the MunaLuna app.
 * 
 * Usage: node test_cycle_notification.js
 */

import fetch from 'node-fetch';

// Default Telegram ID for testing
const TELEGRAM_ID = '262371163';
const USER_ID = 1; // Mock user ID

async function testCycleNotification() {
  console.log(`\n🌙 MunaLuna Cycle Notification Test 🌙`);
  console.log(`Testing cycle notification for Telegram ID: ${TELEGRAM_ID}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Generate a new cycle start date (today)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    console.log(`Starting new cycle with date: ${startDate}`);
    
    // Send cycle start request
    const response = await fetch('http://localhost:5000/api/cycles/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        startDate
      })
    });
    
    const result = await response.json();
    const isSuccess = response.status === 200 && result.message?.includes("successfully");
    
    console.log(`Cycle start result: ${isSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`Server response: ${JSON.stringify(result)}`);
    
    // Wait for notification processing
    console.log(`\nWaiting for notification processing...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Display results
    if (isSuccess) {
      console.log(`\n✅ CYCLE NOTIFICATION TEST COMPLETED SUCCESSFULLY!`);
      console.log(`A cycle update notification should have been sent to Telegram ID: ${TELEGRAM_ID}`);
      console.log(`Check your Telegram app for the notification.`);
      console.log(`You can also check server logs to see the notification delivery details.`);
    } else {
      console.log(`\n❌ CYCLE NOTIFICATION TEST FAILED`);
      console.log(`Failed to start new cycle.`);
    }
    
  } catch (error) {
    console.error(`Error in cycle notification test:`, error);
  }
}

// Run the test
testCycleNotification();