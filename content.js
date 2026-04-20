function showDifficultyModal(title, url) {
  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.zIndex = "10000";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  // Create modal dialog
  const modal = document.createElement("div");
  modal.style.backgroundColor = "white";
  modal.style.padding = "28px";
  modal.style.borderRadius = "12px";
  modal.style.minWidth = "420px";
  modal.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
  modal.style.zIndex = "10001";
  modal.style.fontFamily = "Arial, sans-serif";

  modal.innerHTML = `
    <div style="margin-bottom: 20px; border-bottom: 2px solid #28a745; padding-bottom: 15px;">
      <h2 style="margin: 0; color: #333; font-size: 18px;">Save Problem</h2>
      <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">${title}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333; font-size: 14px;">
        🎯 Difficulty Level
      </label>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">e.g., Easy, Medium, Hard, Tricky, Edge Cases, etc.</p>
      <input 
        type="text" 
        id="difficulty" 
        placeholder="Enter difficulty..." 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
      />
    </div>

    <div style="margin-bottom: 25px;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333; font-size: 14px;">
        📅 Spaced Repetition Days (Optional)
      </label>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">3 values separated by commas. Leave blank for default (2, 7, 10)</p>
      <input 
        type="text" 
        id="customIntervals" 
        placeholder="e.g., 1,5,14" 
        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
      />
    </div>

    <div style="display: flex; gap: 12px;">
      <button id="modal-save" style="flex: 1; padding: 14px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s;">Save Problem</button>
      <button id="modal-cancel" style="flex: 1; padding: 14px; background: #e0e0e0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s;">Cancel</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Handle Save
  const saveBtn = document.getElementById("modal-save");
  const cancelBtn = document.getElementById("modal-cancel");
  
  saveBtn.onmouseover = () => { saveBtn.style.background = "#218838"; };
  saveBtn.onmouseout = () => { saveBtn.style.background = "#28a745"; };
  
  cancelBtn.onmouseover = () => { cancelBtn.style.background = "#d0d0d0"; };
  cancelBtn.onmouseout = () => { cancelBtn.style.background = "#e0e0e0"; };

  saveBtn.onclick = () => {
    const difficulty = document.getElementById("difficulty").value.trim() || "Unspecified";
    const customIntervalsInput = document.getElementById("customIntervals").value.trim();
    
    let intervals = [2, 7, 10]; // default
    if (customIntervalsInput) {
      try {
        intervals = customIntervalsInput.split(",").map(x => parseInt(x.trim()));

        if (intervals.some(isNaN)) {
          alert("Invalid interval format. Use numbers like 1,5,14");
          return;
        }
        if (intervals.length < 3) {
          alert("Please provide at least 3 interval values");
          return;
        }
      } catch {
        alert("Invalid interval format. Use comma-separated numbers.");
        return;
      }
    }

    saveProblem(title, url, difficulty, intervals);
    overlay.remove();
  };

  // Handle Cancel
  cancelBtn.onclick = () => {
    overlay.remove();
  };
}

// ---------- CONFETTI ANIMATION ----------
function triggerConfetti() {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    confetti.style.pointerEvents = "none";
    confetti.style.zIndex = "99999";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.top = "-10px";
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = Math.random() * 10 + 5 + "px";
    confetti.style.height = Math.random() * 10 + 5 + "px";
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    confetti.style.animation = `fall ${2 + Math.random()}s linear forwards`;
    
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2500);
  }
}

// Add CSS animation for confetti fall
if (!document.getElementById("confetti-styles-content")) {
  const style = document.createElement("style");
  style.id = "confetti-styles-content";
  style.textContent = `
    @keyframes fall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function saveProblem(title, url, difficulty, intervals) {
  const problem = {
    title,
    url,
    difficulty,
    dateAdded: new Date().toISOString(),
    revisionConfig: { type: "custom", steps: intervals },
    revisionHistory: [],
    nextRevisionDate: new Date().toISOString()
  };

  try {
    chrome.storage.local.get(["problems"], (res) => {
      // Check if chrome context is still valid
      if (chrome.runtime.lastError) {
        console.warn("Extension context invalidated");
        return;
      }

      let problems = res.problems || [];

      // prevent duplicates
      const exists = problems.some(p => p.url === url);
      if (exists) {
        alert("Already saved!");
        return;
      }

      problems.push(problem);

      chrome.storage.local.set({ problems }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Extension context invalidated on save");
          return;
        }
        alert("Saved!");
      });
    });
  } catch (error) {
    console.error("Extension context error:", error);
  }
}

function addButton() {
  // prevent duplicate button
  if (document.getElementById("dsa-save-btn")) return;

  const btn = document.createElement("button");
  btn.id = "dsa-save-btn";
  btn.innerText = "Save";

  // styling
  btn.style.position = "fixed";
  btn.style.top = "120px";
  btn.style.right = "20px";
  btn.style.zIndex = "9999";
  btn.style.padding = "10px";
  btn.style.backgroundColor = "#28a745";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    const title =
      document.querySelector('div[data-cy="question-title"]')?.innerText ||
      document.title;

    const url = window.location.href;

    // Show modal for difficulty and custom intervals
    showDifficultyModal(title, url);
  };

  document.body.appendChild(btn);
}


// 🔥 IMPORTANT: wait for page to load properly
window.addEventListener("load", () => {
  setTimeout(addButton, 1500);
  
  // Monitor for AC (Accepted) verdict on LeetCode with debouncing to avoid freezing
  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const verdict = document.querySelector('[data-testid="result-tab-panel"]');
      if (verdict && verdict.innerText.includes("Accepted")) {
        triggerConfetti();
        observer.disconnect(); // Stop observing after confetti
      }
    }, 500); // Only check every 500ms
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false
  });
});