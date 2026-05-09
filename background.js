// --- 1. NOTIFICATION LOGIC ---
function notifyIfDue() {
  chrome.storage.local.get(["problems"], (res) => {
    const problems = res.problems || [];
    const today = new Date();
    
    const due = problems.filter(p => 
      p.nextRevisionDate && new Date(p.nextRevisionDate) <= today
    );

    if (due.length > 0) {
      // Use a unique ID (timestamp) so the system doesn't "ignore" it 
      // if an old notification with the same ID is still in the tray.
      const notificationId = "dsa-reminder-" + Date.now();

      chrome.notifications.create(notificationId, {
        type: "basic",
        iconUrl: "icon-128.png", 
        title: "DSA Revision Due",
        message: `You have ${due.length} problem(s) ready for revision today!`,
        priority: 2 // Set to High priority
      });
    }
  });
}

// --- 2. STARTUP LOGIC (With Delay) ---
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started: Waiting 5 seconds for system to settle...");
  // Giving the browser a few seconds to fully load before firing the notification
  setTimeout(() => {
    notifyIfDue();
  }, 5000); 
});

// --- 3. INSTALLATION LOGIC ---
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed/updated.");
  
  // Set up the alarm only if it doesn't exist
  chrome.alarms.get("dailyCheck", (alarm) => {
    if (!alarm) {
      chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });
    }
  });
  
  notifyIfDue();
});

// --- 4. ALARM LISTENER ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCheck") {
    notifyIfDue();
  }
});

// --- 5. OPTIONS MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_ALARM") {
    chrome.alarms.clear("dailyCheck", () => {
      chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });
      sendResponse({ status: "success" });
    });
    return true; 
  }
});