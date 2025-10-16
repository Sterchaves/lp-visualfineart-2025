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

  // Modal
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

  // Helpers
  function fieldEl(name) { return form.querySelector(`[name="${name}"]`); }
  function clearFieldErrors() {
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  }
  function markInvalid(name) {
    const el = fieldEl(name);
    if (el) el.classList.add("is-invalid"); // <<< só cor, sem texto
  }
  function normalizePhone(raw) {
    if (!raw) return "";
    let phone = String(raw).trim().replace(/\s+/g, "").replace(/[().-]/g, "");
    if (phone.startsWith("00")) phone = "+" + phone.slice(2);
    return phone;
  }

  // Validação leve (sem mensagens inline)
  function validate() {
    clearFieldErrors();
    let ok = true;

    const email = fieldEl("EMAIL")?.value.trim() || "";
    const name  = fieldEl("FNAME")?.value.trim() || "";
    const phone = normalizePhone(fieldEl("PHONE")?.value || "");
    const projectType = fieldEl("PROJECT")?.value || "";
    const budget = fieldEl("BUDGET")?.value || "";
    const timeline = fieldEl("TIMELINE")?.value || "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ok = false; markInvalid("EMAIL"); }
    if (!name) { ok = false; markInvalid("FNAME"); }
    if (!phone || !phone.startsWith("+") || !/^\+\d{6,15}$/.test(phone)) { ok = false; markInvalid("PHONE"); }
    if (!projectType) { ok = false; markInvalid("PROJECT"); }
    if (!budget) { ok = false; markInvalid("BUDGET"); }
    if (!timeline) { ok = false; markInvalid("TIMELINE"); }

    return ok;
  }

  // Mapeia erros do Mailchimp para mensagem do modal
  function mapMailchimpError(raw) {
    const text = String(raw || "").toLowerCase();
    if (text.includes("permanently deleted") || text.includes("cannot be re-imported") || text.includes("gdpr")) {
      return "This email was permanently removed in the past. To join again, please confirm the resubscription link sent to your inbox.";
    }
    if (text.includes("member exists") || text.includes("already a list member")) {
      return "You are already on our list. Please check your inbox and spam folder.";
    }
    if (text.includes("compliance state")) {
      return "Your address is paused for compliance. Check your inbox for a confirmation email to reactivate.";
    }
    if (text.includes("merge fields were invalid") || text.includes("invalid resource")) {
      return "Please review the required fields and try again.";
    }
    if (text.includes("too many requests")) {
      return "Too many attempts right now. Please try again in a moment.";
    }
    if (text.includes("cleaned")) {
      return "This address was marked as undeliverable. Please use another email.";
    }
    return "Could not send your request. Please try again.";
  }

  function parseBackend(data, resp) {
    if (data?.ok === true) return { ok: true, message: data.message || "We will contact you shortly." };
    if (data?.ok === false) return { ok: false, message: mapMailchimpError(data.message || data.detail || data.error || "") };
    if (data?.status === "error") return { ok: false, message: mapMailchimpError(data.detail || data.title || "") };
    if (resp && !resp.ok) return { ok: false, message: "Server error. Please try again later." };
    return { ok: false, message: mapMailchimpError("") };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) {
      openModal("Please review the form", "Some fields need your attention.", "error");
      return;
    }

    const fd = new FormData(form);
    const payload = {
      EMAIL: fd.get("EMAIL"),
      FNAME: fd.get("FNAME"),
      PHONE: normalizePhone(fd.get("PHONE") || ""),
      COMPANY: fd.get("COMPANY"),
      PROJECT: fd.get("PROJECT"),
      CITY: fd.get("CITY"),
      BUDGET: fd.get("BUDGET"),
      TIMELINE: fd.get("TIMELINE"),
      NOTES: fd.get("NOTES"),
      TAGS: "Interior Design"
    };

    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.8"; }

    try {
      const resp = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await resp.json(); } catch(_) {}

      const result = parseBackend(data, resp);

      if (result.ok) {
        openModal("Request received! ✅", result.message, "success");
        form.reset();
        clearFieldErrors();
      } else {
        openModal("Oops…", result.message, "error");
      }
    } catch {
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
