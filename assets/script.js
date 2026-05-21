/*
 * why.fibe.gg — minimal interactions.
 *
 * 1. Stamp the current year in the footer.
 * 2. Reveal eligible blocks (eyebrows, headlines, lists, tiles, cards) as they
 *    enter the viewport. Respects prefers-reduced-motion via CSS.
 * 3. Tilt the persona visuals slightly on pointer move — pointer-fine only.
 */

(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ── Move each persona's slider into its visual area, hidden until "See it in action".
  document.querySelectorAll(".persona").forEach((persona) => {
    const visual = persona.querySelector(".persona__visual");
    const action = persona.querySelector(".persona__action");
    if (!visual || !action) return;

    const gallery = document.createElement("div");
    gallery.className = "persona__gallery";
    gallery.hidden = true;
    while (action.firstChild) gallery.appendChild(action.firstChild);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "persona__gallery-close";
    close.setAttribute("aria-label", "Hide gallery, show illustration");
    close.textContent = "×";
    gallery.appendChild(close);

    visual.appendChild(gallery);
    action.remove();

    const art = visual.querySelector("[data-art]");
    const chip = visual.querySelector(".persona__chip");
    const toggle = persona.querySelector("[data-toggle-gallery]");

    const setOpen = (open) => {
      gallery.hidden = !open;
      if (art) art.style.display = open ? "none" : "";
      if (chip) chip.style.display = open ? "none" : "";
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
      visual.classList.toggle("is-showing-gallery", open);
    };

    close.addEventListener("click", () => setOpen(false));
    if (toggle) toggle.addEventListener("click", () => setOpen(gallery.hidden));
  });

  // ── Reveal-on-scroll ────────────────────────────────────────────────
  const revealTargets = document.querySelectorAll(
    [
      ".hero__inner > *",
      ".matrix-section .section-head > *",
      ".tile",
      ".persona__visual",
      ".persona__body > *",
      ".persona__action-head > *",
      ".slide",
      ".solutions .section-head > *",
      ".solution",
      ".how .section-head > *",
      ".how__card",
      ".close__inner > *",
    ].join(",")
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // ── Sliders (granular paths) ────────────────────────────────────────
  document.querySelectorAll("[data-slider]").forEach((track) => {
    const shell = track.closest(".slider-shell");
    if (!shell) return;
    const prev = shell.querySelector("[data-slider-prev]");
    const next = shell.querySelector("[data-slider-next]");

    const stepBy = () => {
      const slide = track.querySelector(".slide");
      if (!slide) return track.clientWidth * 0.9;
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      return slide.getBoundingClientRect().width + gap;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const noOverflow = max <= 1;
      [prev, next].forEach((btn) => {
        if (!btn) return;
        btn.style.display = noOverflow ? "none" : "";
      });
      if (noOverflow) return;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      if (prev) prev.setAttribute("aria-disabled", String(atStart));
      if (next) next.setAttribute("aria-disabled", String(atEnd));
    };

    if (prev) {
      prev.addEventListener("click", () =>
        track.scrollBy({ left: -stepBy(), behavior: "smooth" })
      );
    }
    if (next) {
      next.addEventListener("click", () =>
        track.scrollBy({ left: stepBy(), behavior: "smooth" })
      );
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Keyboard support when the slider itself has focus.
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        track.scrollBy({ left: stepBy(), behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: -stepBy(), behavior: "smooth" });
      }
    });
    update();
  });

  // ── Sticky path-nav: highlight active section as you scroll ─────────
  const pathLinks = document.querySelectorAll("[data-paths] [data-path]");
  if (pathLinks.length) {
    const linkByTarget = new Map();
    const sections = [];
    pathLinks.forEach((link) => {
      linkByTarget.set(link.dataset.path, link);
      const el = document.getElementById(link.dataset.path);
      if (el) sections.push({ id: link.dataset.path, el });
    });

    let lastActive = null;
    const setActive = (id) => {
      if (id === lastActive) return;
      lastActive = id;
      pathLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.path === id));
      // Keep the active chip in view inside the horizontal path strip.
      const active = linkByTarget.get(id);
      if (!active) return;
      const strip = active.closest("[data-paths]");
      if (!strip) return;
      const lRect = active.getBoundingClientRect();
      const sRect = strip.getBoundingClientRect();
      if (lRect.left < sRect.left + 12) {
        strip.scrollBy({ left: lRect.left - sRect.left - 24, behavior: "smooth" });
      } else if (lRect.right > sRect.right - 12) {
        strip.scrollBy({ left: lRect.right - sRect.right + 24, behavior: "smooth" });
      }
    };

    const navOffsetPx = () => {
      const nav = document.querySelector(".nav");
      return nav ? nav.getBoundingClientRect().height + 16 : 140;
    };

    const updateActive = () => {
      const offset = navOffsetPx();
      let current = null;
      for (const { id, el } of sections) {
        if (el.getBoundingClientRect().top - offset <= 1) current = id;
      }
      if (current) setActive(current);
      else if (lastActive) {
        // Before the first section — clear active state.
        lastActive = null;
        pathLinks.forEach((l) => l.classList.remove("is-active"));
      }
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updateActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActive();
  }

  // ── Inline video preview embed for slider slides ────────────────────
  document.querySelectorAll(".slide__action").forEach((action) => {
    action.addEventListener("click", (e) => {
      const slide = action.closest(".slide");
      if (!slide || slide.classList.contains("is-playing")) return;
      const src = action.dataset.embedSrc || "";
      const titleEl = action.querySelector(".slide__title");
      const title = titleEl ? titleEl.textContent.trim() : "Preview";

      if (!src) {
        // No embed URL yet — flash a "Preview coming soon" hint.
        let hint = action.querySelector(".slide__hint");
        if (!hint) {
          hint = document.createElement("span");
          hint.className = "slide__hint";
          hint.textContent = "Preview coming soon";
          const poster = action.querySelector(".slide__poster");
          if (poster) poster.appendChild(hint);
        }
        requestAnimationFrame(() => hint.classList.add("is-visible"));
        clearTimeout(action._hintTimer);
        action._hintTimer = setTimeout(() => hint.classList.remove("is-visible"), 1800);
        return;
      }

      e.preventDefault();
      slide.classList.add("is-playing");
      const poster = action.querySelector(".slide__poster");
      if (!poster) return;
      const wrap = document.createElement("div");
      wrap.className = "slide__iframe-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = title;
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      wrap.appendChild(iframe);

      const close = document.createElement("button");
      close.type = "button";
      close.className = "slide__close";
      close.setAttribute("aria-label", "Close preview");
      close.textContent = "×";
      close.addEventListener("click", (ev) => {
        ev.stopPropagation();
        wrap.replaceWith(poster);
        slide.classList.remove("is-playing");
      });
      wrap.appendChild(close);

      poster.replaceWith(wrap);
    });
  });

  // ── Subtle pointer tilt on persona visuals (fine pointers only) ─────
  const fine =
    window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (fine && !reduce) {
    const visuals = document.querySelectorAll(".persona__visual");
    visuals.forEach((card) => {
      card.style.willChange = "transform";
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-y * 4).toFixed(2);
        const ry = (x * 4).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }
})();
