/**
 * contributions.js — public donor/due-month grid + private per-donor dashboard.
 */

(async function initContributionsPage() {
  const data = await loadSiteData();
  const gridRoot = document.querySelector("[data-donor-grid]");
  const form = document.querySelector("[data-lookup-form]");
  const input = document.querySelector("[data-lookup-input]");
  const errorEl = document.querySelector("[data-lookup-error]");
  const dashboard = document.querySelector("[data-dashboard]");
  const clearBtn = document.querySelector("[data-lookup-clear]");

  if (!data) {
    showError(gridRoot, "error_generic");
    if (form) form.style.display = "none";
    return;
  }

  function statusInfo(dueCount) {
    if (dueCount === 0) return { key: "status_up_to_date", vars: null, cls: "status-ok" };
    if (dueCount === 1) return { key: "status_due_one", vars: null, cls: "status-due" };
    return { key: "status_due_many", vars: { n: dueCount }, cls: dueCount >= 3 ? "status-due-strong" : "status-due" };
  }

  function renderGrid() {
    gridRoot.innerHTML = "";
    data.donors.forEach((donor) => {
      const summary = getDonorSummary(donor, data.meta);
      const info = statusInfo(summary.dueCount);

      const card = document.createElement("div");
      card.className = "donor-card";

      const name = document.createElement("span");
      name.className = "donor-name";
      name.textContent = donor.name;

      const pill = document.createElement("span");
      pill.className = `status-pill ${info.cls}`;
      pill.textContent = info.vars ? t(info.key, info.vars) : t(info.key);

      card.appendChild(name);
      card.appendChild(pill);
      gridRoot.appendChild(card);
    });
  }

  function renderDashboard(donor) {
    const summary = getDonorSummary(donor, data.meta);
    const history = getDonorHistory(donor, data.meta);
    const symbol = data.meta.currencySymbol || "৳";

    dashboard.querySelector("[data-dash-name]").textContent = donor.name;
    dashboard.querySelector("[data-dash-total]").textContent = formatCurrency(summary.total, symbol);
    dashboard.querySelector("[data-dash-current]").textContent = summary.currentMonthAmount
      ? formatCurrency(summary.currentMonthAmount, symbol)
      : t("not_yet_started");
    dashboard.querySelector("[data-dash-due]").textContent = summary.dueCount;
    dashboard.querySelector("[data-dash-last]").textContent = summary.lastContribution
      ? formatMonthLabel(summary.lastContribution.month)
      : t("not_yet_started");

    const listEl = dashboard.querySelector("[data-history-list]");
    listEl.innerHTML = "";
    history.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "history-row";

      const monthEl = document.createElement("span");
      monthEl.className = "history-month";
      monthEl.textContent = formatMonthLabel(row.month);

      const right = document.createElement("span");
      right.className = "history-right";

      const amountEl = document.createElement("span");
      amountEl.className = "history-amount";
      amountEl.textContent = row.amount ? formatCurrency(row.amount, symbol) : t("not_yet_started");

      const statusCls = row.status === "paid" ? "status-ok" : row.status === "due" ? "status-due" : "status-ok";
      const pill = document.createElement("span");
      pill.className = `status-pill ${row.status === "upcoming" ? "" : statusCls}`;
      pill.style.opacity = row.status === "upcoming" ? "0.6" : "1";
      pill.textContent = t(row.status);

      right.appendChild(amountEl);
      right.appendChild(pill);
      rowEl.appendChild(monthEl);
      rowEl.appendChild(right);
      listEl.appendChild(rowEl);
    });

    dashboard.classList.add("visible");
    dashboard.setAttribute("aria-hidden", "false");
    dashboard.dataset.activeDonor = donor.id;
    dashboard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideDashboard() {
    dashboard.classList.remove("visible");
    dashboard.setAttribute("aria-hidden", "true");
    delete dashboard.dataset.activeDonor;
  }

  function setError(key) {
    if (!errorEl) return;
    if (!key) {
      errorEl.textContent = "";
      errorEl.classList.remove("visible");
      input.removeAttribute("aria-invalid");
      return;
    }
    errorEl.textContent = t(key);
    errorEl.classList.add("visible");
    input.setAttribute("aria-invalid", "true");
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) {
        setError("lookup_error_empty");
        hideDashboard();
        return;
      }
      const donor = findDonorById(data, value);
      if (!donor) {
        setError("lookup_error_invalid");
        hideDashboard();
        return;
      }
      setError(null);
      renderDashboard(donor);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      hideDashboard();
      input.value = "";
      setError(null);
      input.focus();
    });
  }

  document.addEventListener("langchange", () => {
    renderGrid();
    const activeId = dashboard.dataset.activeDonor;
    if (activeId) {
      const donor = findDonorById(data, activeId);
      if (donor) renderDashboard(donor);
    }
  });

  renderGrid();
})();
