/**
 * data.js — loads data/data.json and derives every number the site shows.
 * Nothing here mutates the source data; the UI always reads through these functions.
 */

let SITE_DATA = null;
let SITE_DATA_ERROR = null;

async function loadSiteData() {
  if (SITE_DATA || SITE_DATA_ERROR) {
    return SITE_DATA;
  }
  try {
    const res = await fetch("data/data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch data.json");
    const json = await res.json();
    if (!json || !json.meta || !Array.isArray(json.donors)) {
      throw new Error("Malformed data.json");
    }
    SITE_DATA = json;
    return SITE_DATA;
  } catch (err) {
    console.error(err);
    SITE_DATA_ERROR = err;
    return null;
  }
}

/** Build an ordered list of "YYYY-MM" strings from start (inclusive) to end (inclusive). */
function monthRange(startYm, endYm) {
  const months = [];
  let [y, m] = startYm.split("-").map(Number);
  const [endY, endM] = endYm.split("-").map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return months;
}

function previousMonth(ym) {
  let [y, m] = ym.split("-").map(Number);
  m -= 1;
  if (m < 1) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/**
 * A donor is "due" for any month from the site's start month up to (but not
 * including) the current month, where no contribution was recorded.
 * The current month and any future month are never counted as due.
 */
function getDueMonths(donor, meta) {
  const lastPastMonth = previousMonth(meta.currentMonth);
  if (lastPastMonth < meta.startMonth) return [];
  const months = monthRange(meta.startMonth, lastPastMonth);
  return months.filter((ym) => !(donor.contributions && donor.contributions[ym] > 0));
}

function getDonorTotal(donor) {
  return Object.values(donor.contributions || {}).reduce((sum, v) => sum + (v || 0), 0);
}

function getDonorLastContribution(donor) {
  const entries = Object.entries(donor.contributions || {}).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => (a[0] < b[0] ? 1 : -1));
  return { month: entries[0][0], amount: entries[0][1] };
}

/** Full monthly history for a donor, from site start to current month, with a status per month. */
function getDonorHistory(donor, meta) {
  const months = monthRange(meta.startMonth, meta.currentMonth);
  const dueSet = new Set(getDueMonths(donor, meta));
  return months.map((ym) => {
    const amount = donor.contributions && donor.contributions[ym];
    let status;
    if (amount > 0) status = "paid";
    else if (dueSet.has(ym)) status = "due";
    else status = "upcoming"; // current month, not yet contributed
    return { month: ym, amount: amount || null, status };
  }).reverse(); // most recent first
}

function getDonorSummary(donor, meta) {
  const due = getDueMonths(donor, meta);
  const last = getDonorLastContribution(donor);
  return {
    id: donor.id,
    name: donor.name,
    total: getDonorTotal(donor),
    currentMonthAmount: (donor.contributions && donor.contributions[meta.currentMonth]) || null,
    dueCount: due.length,
    dueMonths: due,
    lastContribution: last,
  };
}

function findDonorById(data, id) {
  if (!id) return null;
  const normalized = String(id).trim().toUpperCase();
  return data.donors.find((d) => String(d.id).trim().toUpperCase() === normalized) || null;
}

/** Family-payment stats derived straight from the familyPayments array. */
function getFamilyStats(data) {
  const payments = data.familyPayments || [];
  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const currentMonth = data.meta.currentMonth;
  const givenThisMonth = payments
    .filter((p) => p.date && p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const sorted = [...payments].filter((p) => p.date).sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastGiven = sorted.length ? sorted[0] : null;
  return { total, givenThisMonth, lastGiven };
}
