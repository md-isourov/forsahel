/**
 * admin.js — password gate + ledger table, built entirely from ../data/data.json.
 *
 * NOTE: this is a convenience gate, not security. The hash below is visible to
 * anyone who views the page source, and data.json itself is public.
 * To change the password, replace PASSWORD_HASH with the SHA-256 hex of the new one
 * (e.g. run:  printf 'newPassword' | sha256sum ).
 */

const PASSWORD_HASH = "507804a50816abaa30b739449b0229e1ceed4dddad06bc2f63a5251ca5f68fe5";
const SESSION_KEY = "adminAuth";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortMonthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${SHORT_MONTHS[m - 1]} ${String(y).slice(2)}`;
}

function fmtNum(n) {
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Pure calculation: builds everything the ledger shows from the data object. */
function computeLedger(data) {
  const meta = data.meta;
  const months = monthRange(meta.startMonth, meta.currentMonth);

  const rows = data.donors.map((donor) => {
    const dueSet = new Set(getDueMonths(donor, meta));
    const start = donor.startMonth && donor.startMonth > meta.startMonth ? donor.startMonth : meta.startMonth;
    const cells = months.map((ym) => {
      const amount = donor.contributions && donor.contributions[ym];
      if (amount > 0) return { type: "paid", amount };
      if (dueSet.has(ym)) return { type: "due" };
      return { type: ym < start ? "before" : "empty" };
    });
    return { name: donor.name, cells, total: getDonorTotal(donor) };
  });

  const totals = months.map((ym) =>
    data.donors.reduce((s, d) => s + ((d.contributions && d.contributions[ym]) || 0), 0));
  const given = months.map((ym) =>
    (data.familyPayments || []).filter((p) => p.date && p.date.startsWith(ym))
      .reduce((s, p) => s + (p.amount || 0), 0));

  const prev = [];
  const balance = [];
  months.forEach((_, i) => {
    prev[i] = i === 0 ? 0 : balance[i - 1];
    balance[i] = prev[i] + totals[i] - given[i];
  });

  // Month indexes grouped by year, in order: [["2025",[0,1]],["2026",[2,3,...]]]
  const yearMap = new Map();
  months.forEach((ym, i) => {
    const y = ym.slice(0, 4);
    if (!yearMap.has(y)) yearMap.set(y, []);
    yearMap.get(y).push(i);
  });
  const years = Array.from(yearMap.entries());

  return { months, rows, totals, given, prev, balance, years };
}

/**
 * Reserve-fund calculation. Entries are sorted by date (ties keep file order).
 * Types: deposit (money collected into the fund), invest (cash -> investment),
 *        return (income from an investment, lands in cash), payout (given out).
 */
const FUND_TYPES = {
  deposit: { label: "Collected", sign: "+" },
  invest: { label: "Invested", sign: "−" },
  return: { label: "Return received", sign: "+" },
  payout: { label: "Paid out", sign: "−" },
};

function computeFund(fund) {
  const raw = fund && Array.isArray(fund.entries) ? fund.entries : [];
  const entries = raw
    .map((e, i) => ({ ...e, _i: i }))
    .filter((e) => e && e.date && FUND_TYPES[e.type] && Number(e.amount) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a._i - b._i));

  let cash = 0;
  let invested = 0;
  let returns = 0;
  const rows = [];
  const warnings = [];
  const assets = new Map();
  const asset = (name) => {
    if (!assets.has(name)) assets.set(name, { name, invested: 0, returns: 0 });
    return assets.get(name);
  };

  entries.forEach((e) => {
    const amount = Number(e.amount);
    if (e.type === "deposit") cash += amount;
    else if (e.type === "invest") { cash -= amount; invested += amount; asset(e.asset || "Unspecified").invested += amount; }
    else if (e.type === "return") { cash += amount; returns += amount; if (e.asset) asset(e.asset).returns += amount; }
    else if (e.type === "payout") cash -= amount;

    if (cash < -0.005) warnings.push(`${e.date}: cash in hand goes below zero after this entry. Please check the amounts.`);
    rows.push({ date: e.date, type: e.type, details: e.details || "", asset: e.asset || "", amount, cash, invested, total: cash + invested });
  });

  return { rows, warnings, assets: Array.from(assets.values()), cash, invested, returns, total: cash + invested };
}

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined && text !== null) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

/** Ledger table. `collapsed` is a Set of year strings shown as a single summary column. */
function renderLedger(ledger, collapsed, onToggle) {
  const { months, rows, totals, given, prev, balance, years } = ledger;
  const table = el("table", null, "ledger");
  const sumOf = (arr, idxs) => idxs.reduce((s, i) => s + arr[i], 0);

  // ---- header (two rows: year buttons, then month labels for expanded years)
  const thead = el("thead");
  const r1 = el("tr");
  const r2 = el("tr");
  const corner = el("th", "Donor", "sticky");
  corner.scope = "col";
  corner.rowSpan = 2;
  r1.appendChild(corner);

  years.forEach(([year, idxs]) => {
    const isCollapsed = collapsed.has(year);
    const th = el("th", null, "year-head");
    th.scope = "colgroup";
    if (isCollapsed) th.rowSpan = 2; else th.colSpan = idxs.length;
    const btn = el("button", `${isCollapsed ? "▸" : "▾"} ${year}`, "year-btn");
    btn.type = "button";
    btn.setAttribute("aria-expanded", String(!isCollapsed));
    btn.setAttribute("aria-label", `${year}, ${isCollapsed ? "show months" : "hide months"}`);
    btn.addEventListener("click", () => onToggle(year));
    th.appendChild(btn);
    r1.appendChild(th);
    if (!isCollapsed) {
      idxs.forEach((i) => { const m = el("th", shortMonthLabel(months[i])); m.scope = "col"; r2.appendChild(m); });
    }
  });
  const totalTh = el("th", "Total", "col-total");
  totalTh.scope = "col";
  totalTh.rowSpan = 2;
  r1.appendChild(totalTh);
  thead.appendChild(r1);
  if (r2.children.length) thead.appendChild(r2);
  table.appendChild(thead);

  // ---- body
  const tbody = el("tbody");
  rows.forEach((r) => {
    const tr = el("tr");
    const name = el("th", r.name, "sticky");
    name.scope = "row";
    tr.appendChild(name);
    years.forEach(([year, idxs]) => {
      if (collapsed.has(year)) {
        const paid = idxs.reduce((s, i) => s + (r.cells[i].type === "paid" ? r.cells[i].amount : 0), 0);
        const due = idxs.filter((i) => r.cells[i].type === "due").length;
        const td = el("td", paid > 0 ? fmtNum(paid) : "–", "year-cell");
        if (due) td.appendChild(el("span", `${due} due`, "year-due"));
        tr.appendChild(td);
      } else {
        idxs.forEach((i) => {
          const c = r.cells[i];
          if (c.type === "paid") tr.appendChild(el("td", fmtNum(c.amount)));
          else if (c.type === "due") tr.appendChild(el("td", "due", "cell-due"));
          else tr.appendChild(el("td", c.type === "before" ? "–" : "", "cell-empty"));
        });
      }
    });
    tr.appendChild(el("td", fmtNum(r.total), "col-total"));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // ---- footer rows (a collapsed year shows: opening balance, sums, closing balance)
  const tfoot = el("tfoot");
  const addRow = (label, cls, perColumn, grand) => {
    const tr = el("tr", null, cls);
    const th = el("th", label, "sticky");
    th.scope = "row";
    tr.appendChild(th);
    years.forEach(([year, idxs]) => {
      if (collapsed.has(year)) {
        const v = perColumn(idxs);
        tr.appendChild(el("td", cls === "row-given" && !v ? "" : fmtNum(v), "year-cell"));
      } else {
        idxs.forEach((i) => {
          const v = perColumn([i]);
          tr.appendChild(el("td", cls === "row-given" && !v ? "" : fmtNum(v)));
        });
      }
    });
    tr.appendChild(el("td", grand === undefined ? "" : fmtNum(grand), "col-total"));
    tfoot.appendChild(tr);
  };
  const all = months.map((_, i) => i);
  addRow("Prev. in hand", "row-prev", (idxs) => prev[idxs[0]]);
  addRow("This month total", "row-total", (idxs) => sumOf(totals, idxs), sumOf(totals, all));
  addRow("Given", "row-given", (idxs) => sumOf(given, idxs), sumOf(given, all));
  addRow("Balance", "row-balance", (idxs) => balance[idxs[idxs.length - 1]], balance[balance.length - 1]);
  table.appendChild(tfoot);

  return table;
}

function renderSummary(container, ledger) {
  container.innerHTML = "";
  const last = ledger.months.length - 1;
  const items = [
    ["Collected so far", fmtNum(ledger.totals.reduce((s, v) => s + v, 0))],
    ["Given so far", fmtNum(ledger.given.reduce((s, v) => s + v, 0))],
    ["In hand now", fmtNum(ledger.balance[last])],
  ];
  items.forEach(([label, value]) => {
    const box = el("div", null, "dash-stat");
    box.appendChild(el("p", label, "dash-stat-label"));
    box.appendChild(el("p", value, "dash-stat-value"));
    container.appendChild(box);
  });
}

function fmtFundDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]} ${y}`;
}

function renderFund(fundData) {
  const summaryEl = document.querySelector("[data-fund-summary]");
  const wrap = document.querySelector("[data-fund-wrap]");
  const assetsWrap = document.querySelector("[data-fund-assets]");
  const warnEl = document.querySelector("[data-fund-warnings]");
  const fund = computeFund(fundData);

  summaryEl.innerHTML = "";
  wrap.innerHTML = "";
  assetsWrap.innerHTML = "";
  warnEl.innerHTML = "";

  if (fund.rows.length === 0) {
    wrap.appendChild(el("div", "No fund records yet. Add entries under “fund” in data.json.", "state-block"));
    return;
  }

  [
    ["Fund total", fmtNum(fund.total)],
    ["Invested now", fmtNum(fund.invested)],
    ["Cash in hand", fmtNum(fund.cash)],
    ["Returns earned", fmtNum(fund.returns)],
  ].forEach(([label, value]) => {
    const box = el("div", null, "dash-stat");
    box.appendChild(el("p", label, "dash-stat-label"));
    box.appendChild(el("p", value, "dash-stat-value"));
    summaryEl.appendChild(box);
  });

  const table = el("table", null, "ledger fund-table");
  const thead = el("thead");
  const hr = el("tr");
  ["Date", "Details", "Type", "Amount", "Cash in hand", "Invested", "Fund total"].forEach((h, i) => {
    const th = el("th", h, i < 3 ? "left" : "");
    th.scope = "col";
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  fund.rows.forEach((r) => {
    const tr = el("tr");
    tr.appendChild(el("td", fmtFundDate(r.date), "left"));
    const details = el("td", null, "left details");
    details.appendChild(document.createTextNode(r.details));
    if (r.asset) details.appendChild(el("span", r.asset, "asset-tag"));
    tr.appendChild(details);
    tr.appendChild(el("td", FUND_TYPES[r.type].label, "left"));
    tr.appendChild(el("td", `${FUND_TYPES[r.type].sign}${fmtNum(r.amount)}`));
    tr.appendChild(el("td", fmtNum(r.cash)));
    tr.appendChild(el("td", fmtNum(r.invested)));
    tr.appendChild(el("td", fmtNum(r.total), "col-total"));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  if (fund.assets.length) {
    const t2 = el("table", null, "ledger fund-table");
    const h2 = el("thead");
    const hr2 = el("tr");
    ["Investment", "Invested", "Returns received"].forEach((h, i) => {
      const th = el("th", h, i === 0 ? "left" : "");
      th.scope = "col";
      hr2.appendChild(th);
    });
    h2.appendChild(hr2);
    t2.appendChild(h2);
    const b2 = el("tbody");
    fund.assets.forEach((a) => {
      const tr = el("tr");
      tr.appendChild(el("td", a.name, "left"));
      tr.appendChild(el("td", fmtNum(a.invested)));
      tr.appendChild(el("td", fmtNum(a.returns)));
      b2.appendChild(tr);
    });
    t2.appendChild(b2);
    assetsWrap.appendChild(el("h3", "By investment", "fund-subheading"));
    const w2 = el("div", null, "ledger-wrap");
    w2.appendChild(t2);
    assetsWrap.appendChild(w2);
  }

  fund.warnings.forEach((w) => warnEl.appendChild(el("p", w, "form-error visible")));
}

async function showAdmin() {
  const loginEl = document.querySelector("[data-login]");
  const viewEl = document.querySelector("[data-admin-view]");
  const logoutBtn = document.querySelector("[data-logout]");
  const wrap = document.querySelector("[data-table-wrap]");

  loginEl.hidden = true;
  viewEl.hidden = false;
  logoutBtn.hidden = false;

  try {
    const res = await fetch("../data/data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    if (!data.meta || !Array.isArray(data.donors)) throw new Error("bad data");
    const ledger = computeLedger(data);
    renderSummary(document.querySelector("[data-summary]"), ledger);

    // Earlier years start collapsed; the latest year starts expanded.
    const collapsed = new Set(ledger.years.slice(0, -1).map(([y]) => y));
    const draw = () => {
      const scroll = wrap.scrollLeft;
      wrap.innerHTML = "";
      wrap.appendChild(renderLedger(ledger, collapsed, (year) => {
        if (collapsed.has(year)) collapsed.delete(year); else collapsed.add(year);
        draw();
      }));
      wrap.scrollLeft = scroll;
    };
    draw();

    renderFund(data.fund);
  } catch (err) {
    console.error(err);
    wrap.innerHTML = "";
    wrap.appendChild(el("div", "We couldn't load the data right now. Please try again later.", "state-block"));
  }
}

function initAdmin() {
  const form = document.querySelector("[data-login-form]");
  const input = document.querySelector("[data-password]");
  const errorEl = document.querySelector("[data-login-error]");
  const logoutBtn = document.querySelector("[data-logout]");

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.remove("visible");
    if (!window.crypto || !crypto.subtle) {
      errorEl.textContent = "Login needs a secure (https) connection.";
      errorEl.classList.add("visible");
      return;
    }
    const hash = await sha256Hex(input.value);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      input.value = "";
      showAdmin();
    } else {
      errorEl.textContent = "That password isn't right. Please try again.";
      errorEl.classList.add("visible");
      input.select();
    }
  });

  if (sessionStorage.getItem(SESSION_KEY) === "1") showAdmin();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initAdmin);
}
