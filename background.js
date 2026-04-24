// background.js

// --- 1. NOTIFICATION LOGIC ---
// This function handles the heavy lifting of checking storage and firing the notification.
function notifyIfDue() {
  chrome.storage.local.get(["problems"], (res) => {
    const problems = res.problems || [];
    const today = new Date();
    
    // Filter problems where the revision date has passed or is today
    const due = problems.filter(p => 
      p.nextRevisionDate && new Date(p.nextRevisionDate) <= today
    );

    if (due.length > 0) {
      chrome.notifications.create("dsa-revision-reminder", {
        type: "basic",
        iconUrl: "icon-128.png", // Ensure this exists in your root folder
        title: "DSA Revision Due",
        message: `You have ${due.length} problem(s) ready for revision today!`,
        priority: 1
      });
    }
  });
}

// --- 2. STARTUP LOGIC (RE-ADDED) ---
// Fires whenever the browser is opened.
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started: Checking for due DSA problems...");
  notifyIfDue();
});

// --- 3. INSTALLATION LOGIC ---
// Sets up the initial alarm when the extension is first added or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed: Setting up daily alarm.");
  // Create an alarm to check once every 24 hours (1440 minutes)
  chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });
  
  // Run an initial check immediately on install
  notifyIfDue();
});

// --- 4. ALARM LISTENER ---
// Wakes up the service worker to check for problems based on the alarm schedule.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCheck") {
    console.log("Daily alarm triggered.");
    notifyIfDue();
  }
});

// --- 5. OPTIONS MESSAGE LISTENER ---
// Listens for updates from options.js to reschedule the daily alarm if needed.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_ALARM") {
    console.log("Rescheduling alarm based on new settings.");
    
    chrome.alarms.clear("dailyCheck", () => {
      chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });
      sendResponse({ status: "success" });
    });
    
    return true; // Keep the message channel open for the async response
  }
});