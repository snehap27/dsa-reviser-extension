chrome.storage.local.get(["problems"], (res) => {
  const list = document.getElementById("list");
  const problems = res.problems || [];

  const today = new Date();

  // Filter due problems safely
  const dueProblems = problems.filter(p => {
    if (!p.nextRevisionDate) return false;
    return new Date(p.nextRevisionDate) <= today;
  });

  // ---------- EMPTY STATE ----------
  if (problems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.innerText = "No problems saved yet.";
    list.appendChild(empty);
    return;
  }

  // ---------- DUE PROBLEMS ----------
  const dueHeader = document.createElement("h3");
  dueHeader.innerText = `📌 ${dueProblems.length} Problem${dueProblems.length !== 1 ? 's' : ''} to Revise Today!`;
  list.appendChild(dueHeader);

  if (dueProblems.length === 0) {
    const noDue = document.createElement("p");
    noDue.className = "empty";
    noDue.innerText = "No revisions due 🎉";
    list.appendChild(noDue);
  } else {
    dueProblems.forEach(p => {
      const nextRevisionDays = calculateDaysUntilRevision(p.nextRevisionDate, today);
      const difficulty = p.difficulty || "Unspecified";
      
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div class="title">${p.title}</div>
        <div style="font-size: 12px; color: #666; margin: 5px 0;">
          Difficulty: <strong>${difficulty}</strong> | Next revision: ${nextRevisionDays > 0 ? nextRevisionDays + ' days' : 'Today'}
        </div>
        <a href="${p.url}" target="_blank">Revise</a><br/>
        <button data-url="${p.url}" class="done-btn">Done</button>
      `;

      list.appendChild(div);
    });
  }

  // ---------- ALL PROBLEMS ----------
  const allHeader = document.createElement("h3");
  allHeader.innerText = "📚 All Problems";
  list.appendChild(allHeader);

  problems.forEach(p => {
    const nextRevisionDays = calculateDaysUntilRevision(p.nextRevisionDate, today);
    const difficulty = p.difficulty || "Unspecified";
    
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="title">${p.title}</div>
      <div style="font-size: 12px; color: #666; margin: 5px 0;">
        Difficulty: <span class="edit-diff" data-url="${p.url}" style="cursor: pointer; color: #007bff;">${difficulty}</span> | 
        Next revision: ${nextRevisionDays > 0 ? nextRevisionDays + ' days' : 'Today'}
      </div>
      <a href="${p.url}" target="_blank">Open</a>
      <button data-url="${p.url}" class="delete-btn" style="margin-left: 10px; background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
    `;

    list.appendChild(div);
  });
});

function calculateDaysUntilRevision(nextRevisionDate, today) {
  const revisionDate = new Date(nextRevisionDate);
  const timeDiff = revisionDate - today;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
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
if (!document.getElementById("confetti-styles")) {
  const style = document.createElement("style");
  style.id = "confetti-styles";
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

// ---------- EDIT DIFFICULTY ----------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-diff")) {
    const url = e.target.getAttribute("data-url");
    const currentDifficulty = e.target.innerText;
    const newDifficulty = prompt("Edit difficulty:", currentDifficulty);
    if (newDifficulty !== null) {
      chrome.storage.local.get(["problems"], (res) => {
        if (chrome.runtime.lastError) return;
        const problems = res.problems || [];
        const problem = problems.find(p => p.url === url);
        if (problem) {
          problem.difficulty = newDifficulty.trim() || "Medium";
          chrome.storage.local.set({ problems }, () => {
            if (chrome.runtime.lastError) return;
            location.reload();
          });
        }
      });
    }
  }
});

// ---------- DELETE BUTTON ----------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const url = e.target.getAttribute("data-url");
    
    chrome.storage.local.get(["problems"], (res) => {
      if (chrome.runtime.lastError) return;
      let problems = res.problems || [];
      problems = problems.filter(p => p.url !== url);
      
      chrome.storage.local.set({ problems }, () => {
        if (chrome.runtime.lastError) return;
        location.reload();
      });
    });
  }
});

// ---------- DONE BUTTON ----------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("done-btn")) {
    const url = e.target.getAttribute("data-url");
    
    triggerConfetti();

    chrome.storage.local.get(["problems"], (res) => {
      if (chrome.runtime.lastError) return;
      let problems = res.problems || [];

      problems = problems.map(p => {
        if (p.url === url) {
          const today = new Date();

          if (!p.revisionHistory) p.revisionHistory = [];
          if (!p.revisionConfig) {
            p.revisionConfig = { type: "custom", steps: [2, 7, 10] };
          }

          // add revision entry
          p.revisionHistory.push({ date: today.toISOString() });

          // next revision
          // const step = p.revisionHistory.length;
          // const days = p.revisionConfig.steps[step] || 14;
          const step = p.revisionHistory.length - 1;
          const days = p.revisionConfig.steps[step] || 14;

          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + days);

          p.nextRevisionDate = nextDate.toISOString();
        }
        return p;
      });

      chrome.storage.local.set({ problems }, () => {        if (chrome.runtime.lastError) return;        setTimeout(() => location.reload(), 1500);
      });
    });
  }
});