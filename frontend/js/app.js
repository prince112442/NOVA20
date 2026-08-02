// ---------- Icon paths (line icons, no emoji) ----------
const ICONS = {
  users:     '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8.4 5 2.5 5 6"/>',
  bookOpen:  '<path d="M2 5c3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0V5z"/><path d="M22 5c-3-1.5-6-1.5-9 0v14c3-1.5 6-1.5 9 0V5z"/>',
  bookOut:   '<path d="M4 4h9a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><path d="M15 10h6m0 0l-3-3m3 3l-3 3"/>',
  bookIn:    '<path d="M4 4h9a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><path d="M21 10h-6m0 0l3-3m-3 3l3 3"/>',
  bookPlus:  '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M9 9h4M11 7v4"/>',
  userPlus:  '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M19 8v6M22 11h-6"/>',
  arrowUp:   '<circle cx="12" cy="12" r="9"/><path d="M12 16V8M8.5 11.5L12 8l3.5 3.5"/>',
  arrowDown: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8.5 12.5L12 16l3.5-3.5"/>',
  trending:  '<path d="M3 17l6-6 4 4 7-8"/><path d="M14 6h6v6"/>',
  dollar:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2 3 2 3 .6 3 2-1.3 2.5-3 2.5-3-1.1-3-2.5"/>',
  check:     '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/>',
  clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};

function icon(name, extraClass = "") {
  return `<svg viewBox="0 0 24 24" class="icon ${extraClass}">${ICONS[name] || ""}</svg>`;
}

// ---------- Sidebar toggle (mobile) ----------
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("lms_token");
  window.location.href = "login.html";
});

// ---------- Quick actions ----------
const QUICK_ACTIONS = [
  { action: "add-book",     label: "Add Book",     icon: "bookPlus" },
  { action: "add-member",   label: "Add Member",   icon: "userPlus" },
  { action: "issue-book",   label: "Issue Book",   icon: "arrowUp" },
  { action: "return-book",  label: "Return Book",  icon: "arrowDown" },
  { action: "view-reports", label: "View Reports", icon: "trending", wide: true }
];

function renderQuickActions() {
  document.getElementById("quickActions").innerHTML = QUICK_ACTIONS.map(a => `
    <button class="qa-btn ${a.wide ? "wide" : ""}" data-action="${a.action}">
      <span class="qa-icon">${icon(a.icon)}</span>
      ${a.label}
    </button>`).join("");

  document.querySelectorAll(".qa-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Quick action clicked:", btn.dataset.action);
      // e.g. window.location.href = `add-book.html`
    });
  });
}

// ---------- Stat cards ----------
function statCardHTML({ iconName, title, value, delta, prefix = "" }) {
  const hasDelta = typeof delta === "number";
  const up = delta >= 0;
  return `
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon">${icon(iconName)}</div>
        <div>
          <div class="stat-title">${title}</div>
          <div class="stat-value">${prefix}${(value ?? 0).toLocaleString()}</div>
        </div>
      </div>
      ${hasDelta ? `<div class="stat-delta ${up ? "up" : "down"}">${up ? "↑" : "↓"} ${Math.abs(delta)}% from last month</div>` : ""}
    </div>`;
}

async function renderStats() {
  const grid = document.getElementById("statsGrid");
  try {
    const s = await fetchStats();
    grid.innerHTML = [
      statCardHTML({ iconName:"users",    title:"Total Members", value:s.totalMembers, delta:s.membersDelta }),
      statCardHTML({ iconName:"bookOut",  title:"Issued Books",  value:s.issuedBooks,  delta:s.issuedDelta }),
      statCardHTML({ iconName:"bookOpen", title:"Total Books",   value:s.totalBooks,   delta:s.totalBooksDelta }),
      statCardHTML({ iconName:"dollar",   title:"Total Fine",    value:s.totalFine,    delta:s.fineDelta, prefix:"$" }),
    ].join("");
  } catch {
    grid.innerHTML = `<div class="empty-state">Connect the backend to see live stats.</div>`;
  }
}

// ---------- Books overview line chart ----------
let overviewChart;
async function renderBooksOverview(range = "week") {
  const canvas = document.getElementById("booksOverviewChart");
  try {
    const data = await fetchBooksOverview(range);
    if (overviewChart) overviewChart.destroy();
    overviewChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Issued Books",
            data: data.issued,
            borderColor: "#e2833f",
            backgroundColor: "rgba(226,131,63,0.12)",
            tension: 0.4, fill: true, pointRadius: 3
          },
          {
            label: "Returned Books",
            data: data.returned,
            borderColor: "#262b5c",
            backgroundColor: "rgba(38,43,92,0.10)",
            tension: 0.4, fill: true, pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top", align: "start", labels: { boxWidth: 8, usePointStyle: true } } },
        scales: { y: { beginAtZero: true, grid: { color: "#eef1f4" } }, x: { grid: { display: false } } }
      }
    });
  } catch {
    canvas.replaceWith(Object.assign(document.createElement("div"), {
      className: "empty-state",
      textContent: "Connect the backend to see the books overview chart."
    }));
  }
}

document.getElementById("chartRange").addEventListener("change", e => {
  const map = { "This Week":"week", "This Month":"month", "This Year":"year" };
  renderBooksOverview(map[e.target.value]);
});

// ---------- Recent activity ----------
async function renderActivity() {
  const list = document.getElementById("activityList");
  try {
    const items = await fetchRecentActivity();
    if (!items.length) {
      list.innerHTML = `<li class="empty-state">No recent activity yet.</li>`;
      return;
    }
    list.innerHTML = items.map(a => `
      <li>
        <span class="activity-icon">${icon(a.iconName || "check")}</span>
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${a.time}</span>
      </li>`).join("");
  } catch {
    list.innerHTML = `<li class="empty-state">Connect the backend to see recent activity.</li>`;
  }
}

// ---------- Recently issued books table ----------
async function renderIssuedBooks() {
  const body = document.getElementById("issuedBooksBody");
  try {
    const rows = await fetchRecentIssuedBooks();
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="5" class="empty-state">No books issued yet.</td></tr>`;
      return;
    }
    body.innerHTML = rows.map(r => `
      <tr>
        <td>${r.title}</td>
        <td>${r.member}</td>
        <td>${r.issueDate}</td>
        <td>${r.dueDate}</td>
        <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
      </tr>`).join("");
  } catch {
    body.innerHTML = `<tr><td colspan="5" class="empty-state">Connect the backend to see issued books.</td></tr>`;
  }
}

// ---------- Top books donut ----------
async function renderTopBooks() {
  const canvas = document.getElementById("topBooksChart");
  const legendEl = document.getElementById("topBooksLegend");
  const colors = ["#e2833f", "#1b1f45", "#c96f2e", "#363c78", "#f0a868"];

  try {
    const items = await fetchTopBooks();
    if (!items.length) {
      canvas.replaceWith(Object.assign(document.createElement("div"), {
        className: "empty-state", textContent: "No book data yet."
      }));
      legendEl.innerHTML = "";
      return;
    }
    const total = items.reduce((sum, i) => sum + i.value, 0);

    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: items.map(i => i.name),
        datasets: [{ data: items.map(i => i.value), backgroundColor: items.map((i, idx) => i.color || colors[idx % colors.length]), borderWidth: 0 }]
      },
      options: { cutout: "70%", plugins: { legend: { display: false } } },
      plugins: [{
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea: { left, right, top, bottom } } = chart;
          const x = (left + right) / 2, y = (top + bottom) / 2;
          ctx.save();
          ctx.textAlign = "center";
          ctx.fillStyle = "#1b1f45";
          ctx.font = "700 20px Segoe UI";
          ctx.fillText(total.toLocaleString(), x, y - 4);
          ctx.font = "12px Segoe UI";
          ctx.fillStyle = "#6b7086";
          ctx.fillText("Total", x, y + 16);
          ctx.restore();
        }
      }]
    });

    legendEl.innerHTML = items.map((i, idx) => `
      <li>
        <span class="name"><span class="dot" style="background:${i.color || colors[idx % colors.length]}"></span>${i.name}</span>
        <span class="pct">${i.value} (${Math.round((i.value/total)*100)}%)</span>
      </li>`).join("");
  } catch {
    canvas.replaceWith(Object.assign(document.createElement("div"), {
      className: "empty-state", textContent: "Connect the backend to see top books."
    }));
  }
}

// ---------- Recommended books ----------
async function renderRecommendations() {
  const grid = document.getElementById("recoGrid");
  const basisEl = document.getElementById("recoBasis");
  try {
    const items = await fetchPopularRecommendations();
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state">No recommendations yet — issue a few books first.</div>`;
      return;
    }
    basisEl.textContent = "Based on borrowing trends";
    grid.innerHTML = items.map(b => `
      <div class="reco-card">
        <div class="reco-title">${b.title}</div>
        <div class="reco-author">${b.author}</div>
        <div class="reco-meta">
          <span class="reco-category">${b.category || "General"}</span>
          <span class="reco-copies">${b.available_copies} available</span>
        </div>
      </div>`).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state">Connect the backend to see recommendations.</div>`;
  }
}

// ---------- Init ----------
(async function init() {
  renderQuickActions();
  await Promise.all([
    renderStats(),
    renderBooksOverview(),
    renderActivity(),
    renderIssuedBooks(),
    renderTopBooks(),
    renderRecommendations()
  ]);
})();
