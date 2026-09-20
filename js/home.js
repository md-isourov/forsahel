/**
 * home.js — populates the memorial hero and the three summary stat cards.
 */

(async function initHomePage() {
  const data = await loadSiteData();
  const statsRoot = document.querySelector("[data-stats]");

  if (!data) {
    showError(statsRoot, "error_generic");
    return;
  }

  const deceased = data.site.deceased;

  const nameEls = document.querySelectorAll("[data-deceased-name]");
  const yearsEl = document.querySelector("[data-deceased-years]");
  const coverEl = document.querySelector("[data-cover-image]");
  if (coverEl && deceased.coverImage) {
    coverEl.src = deceased.coverImage;
    coverEl.alt = deceased.name || "";
  }

  function renderText() {
    const lang = getLang();
    const displayName = lang === "bn" && deceased.nameBn ? deceased.nameBn : deceased.name;
    nameEls.forEach((el) => { el.textContent = displayName; });
    if (yearsEl) {
      const hasYears = deceased.birthDate && deceased.passingDate;
      yearsEl.textContent = hasYears ? `${deceased.birthDate} — ${deceased.passingDate}` : "";
      yearsEl.style.display = hasYears ? "" : "none";
    }
    const msgEl = document.querySelector("[data-memorial-message]");
    if (msgEl) msgEl.textContent = deceased.memorialMessage[lang] || deceased.memorialMessage.en;
    const purposeEl = document.querySelector("[data-purpose-statement]");
    if (purposeEl) purposeEl.textContent = deceased.purposeStatement[lang] || deceased.purposeStatement.en;

    renderStats();
  }

  function renderStats() {
    const stats = getFamilyStats(data);
    const symbol = data.meta.currencySymbol || "৳";

    const givenThisMonthEl = document.querySelector("[data-stat-this-month]");
    if (givenThisMonthEl) {
      givenThisMonthEl.textContent = stats.givenThisMonth > 0
        ? formatCurrency(stats.givenThisMonth, symbol)
        : formatCurrency(0, symbol);
    }

    const lastGivenEl = document.querySelector("[data-stat-last-given]");
    if (lastGivenEl) {
      if (stats.lastGiven) {
        lastGivenEl.textContent = formatFullDate(stats.lastGiven.date);
        lastGivenEl.classList.remove("muted");
      } else {
        lastGivenEl.textContent = t("stat_no_payment_yet");
        lastGivenEl.classList.add("muted");
      }
    }

    const totalGivenEl = document.querySelector("[data-stat-total]");
    if (totalGivenEl) totalGivenEl.textContent = formatCurrency(stats.total, symbol);
  }

  document.addEventListener("langchange", renderText);
  renderText();
})();
