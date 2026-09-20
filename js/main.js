/**
 * main.js — small shared behaviours used on every page.
 */

function initMobileMenu() {
  const btn = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function showError(container, key) {
  if (!container) return;
  container.innerHTML = "";
  const block = document.createElement("div");
  block.className = "state-block";
  block.setAttribute("role", "status");
  block.textContent = t(key || "error_generic");
  container.appendChild(block);
}

document.addEventListener("DOMContentLoaded", initMobileMenu);
