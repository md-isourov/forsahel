/**
 * contribute.js — shows the bKash number (from data.json → site.payment.bkashNumber)
 * with a copy button.
 */

(async function initContributePage() {
  const data = await loadSiteData();
  const card = document.querySelector("[data-pay-card]");
  const numberEl = document.querySelector("[data-bkash-number]");
  const copyBtn = document.querySelector("[data-copy-btn]");
  const statusEl = document.querySelector("[data-copy-status]");

  const number = data && data.site && data.site.payment && data.site.payment.bkashNumber;
  if (!number) {
    showError(card, "contribute_unavailable");
    return;
  }

  numberEl.textContent = number;
  copyBtn.hidden = false;

  let resetTimer = null;
  function setStatus(key, isError) {
    statusEl.textContent = t(key);
    statusEl.classList.toggle("error", !!isError);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { statusEl.textContent = ""; }, 2500);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // Fallback for older browsers / non-https
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (!ok) throw new Error("copy failed");
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await copyText(number);
      setStatus("contribute_copied", false);
    } catch (err) {
      setStatus("contribute_copy_failed", true);
    }
  });
})();
