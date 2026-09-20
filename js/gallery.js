/**
 * gallery.js — renders the photo grid and a full-screen lightbox
 * with keyboard, swipe, and focus-trapping support.
 */

(async function initGalleryPage() {
  const data = await loadSiteData();
  const gridRoot = document.querySelector("[data-gallery-grid]");
  const lightbox = document.querySelector("[data-lightbox]");

  if (!data || !Array.isArray(data.gallery) || data.gallery.length === 0) {
    showError(gridRoot, "error_gallery");
    return;
  }

  const photos = data.gallery;
  let currentIndex = 0;
  let lastFocused = null;

  const imgEl = lightbox.querySelector("[data-lightbox-img]");
  const captionEl = lightbox.querySelector("[data-lightbox-caption]");
  const closeBtn = lightbox.querySelector("[data-lightbox-close]");
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox.querySelector("[data-lightbox-next]");

  function captionFor(photo) {
    const lang = getLang();
    return (photo.caption && (photo.caption[lang] || photo.caption.en)) || "";
  }

  function renderGrid() {
    gridRoot.innerHTML = "";
    photos.forEach((photo, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-item";
      btn.setAttribute("aria-label", captionFor(photo) || t("gallery_heading"));

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = captionFor(photo) || "";
      img.loading = "lazy";
      img.decoding = "async";

      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(index));
      gridRoot.appendChild(btn);
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    lastFocused = document.activeElement;
    updateLightboxContent();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function updateLightboxContent() {
    const photo = photos[currentIndex];
    imgEl.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    imgEl.offsetHeight; // restart fade-in
    imgEl.style.animation = "";
    imgEl.src = photo.src;
    imgEl.alt = captionFor(photo) || "";
    captionEl.textContent = captionFor(photo);
    captionEl.style.display = captionFor(photo) ? "" : "none";
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightboxContent();
  }
  function showPrev() {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightboxContent();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") showNext();
    else if (e.key === "ArrowLeft") showPrev();
    else if (e.key === "Tab") {
      const focusables = [prevBtn, nextBtn, closeBtn];
      const idx = focusables.indexOf(document.activeElement);
      e.preventDefault();
      if (e.shiftKey) {
        focusables[(idx - 1 + focusables.length) % focusables.length].focus();
      } else {
        focusables[(idx + 1) % focusables.length].focus();
      }
    }
  }

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Touch swipe support
  let touchStartX = null;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) showNext(); else showPrev();
    }
    touchStartX = null;
  }, { passive: true });

  document.addEventListener("langchange", () => {
    renderGrid();
    if (lightbox.classList.contains("open")) updateLightboxContent();
  });

  renderGrid();
})();
