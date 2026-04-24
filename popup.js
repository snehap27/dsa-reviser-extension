// popup.js

/**
 * Enhanced helper to create elements safely.
 * Handles standard properties, style strings, and data-attributes.
 */
function createEl(tag, props = {}, text = "") {
  const el = document.createElement(tag);
  
  for (const [key, value] of Object.entries(props)) {
    if (key === "style") {
      el.style.cssText = value;
    } else if (key.startsWith("data-")) {
      el.setAttribute(key, value);
    } else {
      el[key] = value;
    }
  }
  
  if (text) el.textContent = text;
  return el;
}

function renderList() {
  const list = document.getElementById("list");
  if (!list) return;
  list.textContent = ""; 

  chrome.storage.local.get(["problems"], (res) => {
    const problems = res.problems || [];
    const today = new Date();

    if (problems.length === 0) {
      list.appendChild(createEl("p", { className: "empty", style: "text-align:center; color:#666;" }, "No problems saved yet."));
      return;
    }

    const dueProblems = problems.filter(p => p.nextRevisionDate && new Date(p.nextRevisionDate) <= today);

    // Section: Due
    list.appendChild(createEl("h3", { style: "margin-top:0" }, "📌 Due for Revision"));
    if (dueProblems.length === 0) {
      list.appendChild(createEl("p", { className: "empty" }, "All caught up! 🎉"));
    } else {
      dueProblems.forEach(p => list.appendChild(createProblemCard(p, true, today)));
    }

    // Section: All
    list.appendChild(createEl("h3", { style: "margin-top:20px" }, "📚 Your Library"));
    problems.forEach(p => list.appendChild(createProblemCard(p, false, today)));
  });
}

function createProblemCard(p, isDue, today) {
  const card = createEl("div", { 
    className: "card", 
    style: "border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; background:#fff;" 
  });
  
  const title = createEl("div", { style: "font-weight:bold; color:#333; margin-bottom:4px;" }, p.title);
  
  const daysUntil = calculateDaysUntilRevision(p.nextRevisionDate, today);
  const nextText = daysUntil > 0 ? `Next in ${daysUntil} days` : "Due Today";
  const info = createEl("div", { style: "font-size:11px; color:#888; margin-bottom:8px;" }, `Diff: ${p.difficulty || 'N/A'} • ${nextText}`);

  const btnContainer = createEl("div", { style: "display:flex; gap:8px; align-items:center;" });

  const link = createEl("a", { 
    href: p.url, 
    target: "_blank", 
    style: "font-size:12px; color:#1673d6; text-decoration:none; font-weight:bold;" 
  }, "Open Link");

  const actionBtn = isDue 
    ? createEl("button", { 
        className: "done-btn", 
        style: "background:#28a745; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;" 
      }, "Mark Done")
    : createEl("button", { 
        className: "delete-btn", 
        style: "background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;" 
      }, "Delete");

  // Force the data-url attribute
  actionBtn.setAttribute("data-url", p.url);

  btnContainer.append(link, actionBtn);
  card.append(title, info, btnContainer);
  return card;
}

// Global Click Listener
document.addEventListener("click", (e) => {
  const btn = e.target;
  const url = btn.getAttribute("data-url");

  if (!url) return; 

  if (btn.classList.contains("delete-btn")) {
    chrome.storage.local.get(["problems"], (res) => {
      const updated = (res.problems || []).filter(p => p.url !== url);
      chrome.storage.local.set({ problems: updated }, renderList);
    });
  }

  if (btn.classList.contains("done-btn")) {
    // TRIGGER CONFETTI HERE
    triggerConfetti();

    chrome.storage.local.get(["problems"], (res) => {
      const updated = (res.problems || []).map(p => {
        if (p.url === url) {
          const today = new Date();
          const history = p.revisionHistory || [];
          history.push({ date: today.toISOString() });
          
          const steps = p.revisionConfig?.steps || [2, 7, 10];
          const days = steps[history.length - 1] || 14;
          
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + days);
          
          return { ...p, revisionHistory: history, nextRevisionDate: nextDate.toISOString() };
        }
        return p;
      });
      chrome.storage.local.set({ problems: updated }, () => {
          // Delay reload so confetti is visible
          setTimeout(renderList, 1500);
      });
    });
  }
});

function calculateDaysUntilRevision(nextRevisionDate, today) {
  if (!nextRevisionDate) return 0;
  const diff = new Date(nextRevisionDate) - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function triggerConfetti() {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
  for (let i = 0; i < 35; i++) {
    const confetti = createEl("div", {
      style: `position:fixed; pointer-events:none; z-index:99999; 
              left:${Math.random() * 100}%; top:-10px; 
              background-color:${colors[Math.floor(Math.random() * colors.length)]}; 
              width:8px; height:8px; border-radius:${Math.random() > 0.5 ? '50%' : '0'};
              animation: fall ${2 + Math.random()}s linear forwards;`
    });
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2500);
  }
}

document.addEventListener("DOMContentLoaded", renderList);