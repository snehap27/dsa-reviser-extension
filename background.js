// Check for due problems and notify
function notifyIfDue() {
  chrome.storage.local.get(["problems"], (res) => {
    const problems = res.problems || [];
    const today = new Date();
    const due = problems.filter(p => 
      p.nextRevisionDate && new Date(p.nextRevisionDate) <= today
    );
    if (due.length > 0) {
      const notifId = "dsa-" + Math.random();
      const opts = {
        type: "basic",
        iconUrl: "icon-128.png",
        title: "DSA Revision",
        message: due.length + "problem(s) to revise!"
      };
      chrome.notifications.create(notifId, opts);
    }
  });
}

// On startup
chrome.runtime.onStartup.addListener(() => {
  setTimeout(() => notifyIfDue(), 1000);
});

// On install
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });
});

// Alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCheck") {
    notifyIfDue();
  }
});
