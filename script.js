// === YOUTUBE PLAYER =========================================================
(function () {
  // Load YT API
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player, ready = false;

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('video', {
      events: {
        'onReady': function () { ready = true; }
      }
    });
  };

  var cover = document.getElementById('videoCover');
  if (cover) {
    cover.addEventListener('click', function () {
      this.style.display = 'none';
      if (ready && player && player.playVideo) {
        player.playVideo();
      } else {
        // fallback: wait a tick until ready
        var tries = 0;
        var int = setInterval(function () {
          if (ready && player && player.playVideo) {
            player.playVideo();
            clearInterval(int);
          } else if (++tries > 20) { clearInterval(int); }
        }, 100);
      }
    });
  }
})();

// === FAQ ACCORDION ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  const faqs = Array.from(document.querySelectorAll('.container-faq .faq'));
  if (!faqs.length) return;

  faqs.forEach(faq => {
    const answer = faq.querySelector('.answer');
    if (!answer) return;
    faq.setAttribute('role', 'button');
    faq.setAttribute('tabindex', '0');
    faq.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0px';
    answer.setAttribute('aria-hidden', 'true');
  });

  const faqsWrap = document.querySelector('.container-faq .faqs');
  if (faqsWrap) {
    faqsWrap.addEventListener('click', (e) => {
      const faq = e.target.closest('.faq');
      if (faq) toggleFaq(faq);
    });
  }

  faqs.forEach(faq => {
    faq.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleFaq(faq);
      }
    });
  });

  function setOpenHeight(faq) {
    const answer = faq.querySelector('.answer');
    if (!answer) return;
    answer.style.maxHeight = '0px';
    const h = answer.scrollHeight;
    answer.style.maxHeight = h + 'px';
  }

  function toggleFaq(faq) {
    const answer = faq.querySelector('.answer');
    if (!answer) return;
    const isOpen = faq.classList.toggle('open');
    faq.setAttribute('aria-expanded', String(isOpen));
    answer.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) setOpenHeight(faq);
    else answer.style.maxHeight = '0px';
  }

  const recalcOpen = () => {
    faqs.forEach(faq => {
      if (faq.classList.contains('open')) setOpenHeight(faq);
    });
  };
  let rAF;
  const debounced = () => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(recalcOpen);
  };
  window.addEventListener('resize', debounced);
  window.addEventListener('orientationchange', recalcOpen);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(debounced);
    faqs.forEach(faq => {
      const answer = faq.querySelector('.answer');
      if (answer) ro.observe(answer);
    });
  }
});

// === FORM SUBMIT (fetch -> /api/subscribe) ==================================
(function () {
  const form = document.getElementById("lead-form");
  const modal = document.getElementById("lead-modal");
  const titleEl = document.getElementById("lead-modal-title");
  const msgEl = document.getElementById("lead-modal-msg");
  const closeBtn = document.getElementById("lead-modal-close");
  const submitBtn = document.getElementById("mc-embedded-subscribe");

  if (!form || !modal || !titleEl || !msgEl) return;

  function openModal(title, msg, type = "success") {
    titleEl.textContent = title;
    msgEl.textContent = msg;
    modal.classList.remove("success", "error");
    modal.classList.add(type === "error" ? "error" : "success");
    modal.style.display = "flex";
  }
  function closeModal() { modal.style.display = "none"; }

  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  function normalizePhone(raw) {
    if (!raw) return "";
    let phone = String(raw).trim().replace(/\s+/g, "").replace(/[().-]/g, "");
    if (phone.startsWith("00")) phone = "+" + phone.slice(2);
    return phone;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    let phone = normalizePhone(fd.get("PHONE") || "");

    // Enforce E.164 (+ and 6-15 digits)
    if (!phone.startsWith("+") || !/^\+\d{6,15}$/.test(phone)) {
      openModal("Oops…", "Invalid phone number. Use the international E.164 format (e.g., +5511999999999).", "error");
      return;
    }

    const payload = {
      EMAIL: fd.get("EMAIL"),
      FNAME: fd.get("FNAME"),
      PHONE: phone,
      COMPANY: fd.get("COMPANY"),
      PROJECT: fd.get("PROJECT"),
      CITY: fd.get("CITY"),
      BUDGET: fd.get("BUDGET"),
      TIMELINE: fd.get("TIMELINE"),
      NOTES: fd.get("NOTES"),
      TAGS: "Interior Design",
    };

    // disable button to prevent double submit
    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.8"; }

    try {
      const resp = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // In case non-JSON response
      let data = {};
      try { data = await resp.json(); } catch (_) {
        data = { ok: false, message: "Unexpected server response." };
      }

      if (data.ok) {
        openModal("Request received! ✅", data.message || "We’ll contact you shortly.", "success");
        form.reset();
      } else {
        openModal("Oops…", data.message || "Could not send your request. Please try again.", "error");
      }
    } catch (err) {
      openModal("Oops…", "Network error. Please try again in a moment.", "error");
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ""; }
    }
  });
})();

// === SMOOTH SCROLL + HIGHLIGHT ==============================================
(function () {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      // if you have a fixed header, measure it; else set 0
      const header = document.querySelector("header");
      const headerOffset = header ? header.getBoundingClientRect().height : 0;

      const elementPosition = target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReduced ? "auto" : "smooth",
      });

      setTimeout(() => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.classList.add("highlight-section");
        setTimeout(() => target.classList.remove("highlight-section"), 1500);
      }, prefersReduced ? 0 : 500);
    });
  });
})();
