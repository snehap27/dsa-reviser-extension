/**
 * DSA Reviser - Content Script
 * Scoped to: https://leetcode.com/problems/*
 */

// --- UTILITY HELPERS ---

// Safely creates elements with styles and text (Anti-XSS approach)
function createStyledElement(tag, styles = {}, text = "") {
  const el = document.createElement(tag);
  Object.assign(el.style, styles);
  if (text) el.textContent = text;
  return el;
}

// Non-blocking notification system (Replaces alert())
function showToast(message, isError = false) {
  const toast = createStyledElement("div", {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: isError ? "#f44336" : "#28a745",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    zIndex: "100000",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "opacity 0.5s ease"
  }, message);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// --- CORE LOGIC ---

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

  chrome.storage.local.get(["problems"], (res) => {
    if (chrome.runtime.lastError) {
      showToast("Extension context error. Please refresh.", true);
      return;
    }

    let problems = res.problems || [];
    const exists = problems.some(p => p.url === url);

    if (exists) {
      showToast("This problem is already saved!", true);
      return;
    }

    problems.push(problem);

    chrome.storage.local.set({ problems }, () => {
      if (chrome.runtime.lastError) {
        showToast("Failed to save. Check storage permissions.", true);
      } else {
        showToast("Problem saved to your revision list!");
      }
    });
  });
}

function showDifficultyModal(title, url) {
  const overlay = createStyledElement("div", {
    position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: "10000",
    display: "flex", justifyContent: "center", alignItems: "center"
  });

  const modal = createStyledElement("div", {
    backgroundColor: "white", padding: "28px", borderRadius: "12px",
    width: "420px", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
    fontFamily: "Arial, sans-serif", boxSizing: "border-box"
  });

  // Header
  const header = createStyledElement("div", { marginBottom: "20px", borderBottom: "2px solid #28a745", paddingBottom: "15px" });
  const h2 = createStyledElement("h2", { margin: "0", color: "#333", fontSize: "18px" }, "Save Problem");
  const pTitle = createStyledElement("p", { margin: "8px 0 0 0", color: "#666", fontSize: "14px" }, title);
  header.append(h2, pTitle);

  // Difficulty Input
  const diffLabel = createStyledElement("label", { display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }, "🎯 Difficulty / Tag");
  const diffInput = createStyledElement("input", { width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: "6px", marginBottom: "15px", boxSizing: "border-box" });
  diffInput.placeholder = "e.g., Medium, DP, Tricky...";

  // Interval Input
  const intLabel = createStyledElement("label", { display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }, "📅 Revision Intervals (Days)");
  const intInput = createStyledElement("input", { width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: "6px", boxSizing: "border-box" });
  intInput.placeholder = "Default: 2, 7, 10";

  // Actions
  const btnContainer = createStyledElement("div", { display: "flex", gap: "12px", marginTop: "25px" });
  const saveBtn = createStyledElement("button", { flex: "1", padding: "14px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }, "Save");
  const cancelBtn = createStyledElement("button", { flex: "1", padding: "14px", background: "#e0e0e0", color: "#333", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }, "Cancel");

  saveBtn.onclick = () => {
    const difficulty = diffInput.value.trim() || "Unspecified";
    let intervals = [2, 7, 10];
    
    if (intInput.value.trim()) {
      const parsed = intInput.value.split(",").map(x => parseInt(x.trim()));
      if (parsed.some(isNaN) || parsed.length < 1) {
        showToast("Invalid interval format. Use: 1, 5, 10", true);
        return;
      }
      intervals = parsed;
    }

    saveProblem(title, url, difficulty, intervals);
    overlay.remove();
  };

  cancelBtn.onclick = () => overlay.remove();

  btnContainer.append(saveBtn, cancelBtn);
  modal.append(header, diffLabel, diffInput, intLabel, intInput, btnContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// --- VISUAL EFFECTS ---

function triggerConfetti() {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
  for (let i = 0; i < 40; i++) {
    const confetti = createStyledElement("div", {
      position: "fixed", pointerEvents: "none", zIndex: "99999",
      left: Math.random() * 100 + "%", top: "-10px",
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      width: "8px", height: "8px",
      animation: `fall ${2 + Math.random()}s linear forwards`
    });
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2500);
  }
}

// Add Animation Styles
const style = document.createElement("style");
style.textContent = `@keyframes fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }`;
document.head.appendChild(style);

// --- INITIALIZATION ---

function addButton() {
  if (document.getElementById("dsa-save-btn")) return;

  const btn = createStyledElement("button", {
    position: "fixed", top: "120px", right: "20px", zIndex: "9999",
    padding: "10px 18px", backgroundColor: "#28a745", color: "white",
    border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  }, "Save");

  btn.id = "dsa-save-btn";
  btn.onclick = () => {
    const title = document.querySelector('div[data-cy="question-title"]')?.innerText || document.title;
    showDifficultyModal(title, window.location.href);
  };

  document.body.appendChild(btn);
}

// Wait for LeetCode's dynamic UI to settle
window.addEventListener("load", () => {
  setTimeout(addButton, 2000);

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Selector for the submission result panel
      const verdict = document.querySelector('[data-testid="result-tab-panel"]');
      if (verdict && verdict.innerText.includes("Accepted")) {
        triggerConfetti();
        observer.disconnect(); 
      }
    }, 1000);
  });

  observer.observe(document.body, { childList: true, subtree: true });
});