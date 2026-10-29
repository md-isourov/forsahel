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

/** Pure calculation: builds everything the table shows from the data object. */
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

  return { months, rows, totals, given, prev, balance };
}

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined && text !== null) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function renderLedger(ledger) {
  const { months, rows, totals, given, prev, balance } = ledger;
  const table = el("table", null, "ledger");

  const thead = el("thead");
  const hr = el("tr");
  const corner = el("th", "Donor", "sticky");
  corner.scope = "col";
  hr.appendChild(corner);
  months.forEach((ym) => { const th = el("th", shortMonthLabel(ym)); th.scope = "col"; hr.appendChild(th); });
  const totalTh = el("th", "Total", "col-total"); totalTh.scope = "col"; hr.appendChild(totalTh);
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach((r) => {
    const tr = el("tr");
    const name = el("th", r.name, "sticky"); name.scope = "row"; tr.appendChild(name);
    r.cells.forEach((c) => {
      if (c.type === "paid") tr.appendChild(el("td", fmtNum(c.amount)));
      else if (c.type === "due") tr.appendChild(el("td", "due", "cell-due"));
      else tr.appendChild(el("td", c.type === "before" ? "–" : "", "cell-empty"));
    });
    tr.appendChild(el("td", fmtNum(r.total), "col-total"));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const tfoot = el("tfoot");
  const addRow = (label, values, cls, sum) => {
    const tr = el("tr", null, cls);
    const th = el("th", label, "sticky"); th.scope = "row"; tr.appendChild(th);
    values.forEach((v, i) => tr.appendChild(el("td", cls === "row-given" && !v ? "" : fmtNum(v))));
    tr.appendChild(el("td", sum === undefined ? "" : fmtNum(sum), "col-total"));
    tfoot.appendChild(tr);
  };
  const sumOf = (a) => a.reduce((s, v) => s + v, 0);
  addRow("Prev. in hand", prev, "row-prev");
  addRow("This month total", totals, "row-total", sumOf(totals));
  addRow("Given", given, "row-given", sumOf(given));
  addRow("Balance", balance, "row-balance", balance[balance.length - 1]);
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
    wrap.innerHTML = "";
    wrap.appendChild(renderLedger(ledger));
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
