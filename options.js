// options.js

// Load saved settings on startup
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["settings"], (res) => {
    const settings = res.settings || {};
    // Fallback to 09:00 if no setting exists
    document.getElementById("reminderTime").value = settings.reminderTime || "09:00";
  });
});

// Save settings and update alarms
document.getElementById("saveBtn").onclick = () => {
  const reminderTime = document.getElementById("reminderTime").value;

  chrome.storage.local.set({ settings: { reminderTime } }, () => {
    // Show success message
    const successEl = document.getElementById("success");
    successEl.style.display = "block";
    
    // Optional: Notify the background script to update the alarm immediately
    chrome.runtime.sendMessage({ type: "UPDATE_ALARM", time: reminderTime });

    setTimeout(() => {
      successEl.style.display = "none";
    }, 3000);
  });
};