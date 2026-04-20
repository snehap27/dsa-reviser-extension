// Load settings
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["settings"], (res) => {
    const settings = res.settings || {};
    document.getElementById("reminderTime").value = settings.reminderTime || "09:00";
  });
});

// Save settings
document.getElementById("saveBtn").onclick = () => {
  const reminderTime = document.getElementById("reminderTime").value;
  
  chrome.storage.local.set({ settings: { reminderTime } }, () => {
    document.getElementById("success").style.display = "block";
    setTimeout(() => {
      document.getElementById("success").style.display = "none";
    }, 3000);
  });
};
