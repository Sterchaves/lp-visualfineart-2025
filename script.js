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

  // Helpers de campo
  const field = (name) => form.querySelector(`[name="${name}"]`);
  function clearFieldErrors() {
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  }
  function markInvalid(name) {
    const el = field(name);
    if (el) el.classList.add("is-invalid"); // só cor, sem textos
  }

  // Normaliza telefone: aceita E.164 (+dddd) OU só dígitos, e envia sempre com +
  function normalizePhoneFlexible(raw) {
    if (!raw) return "";
    let s = String(raw).trim();
    // deixa apenas + e dígitos
    s = s.replace(/[^\d+]/g, "");
    // remove + duplicados no meio
    if (s.indexOf("+") > 0) s = s.replace(/\+/g, "");
    // se começa com +, mantém
    if (s.startsWith("+")) {
      const digits = s.slice(1).replace(/\D/g, "");
      return "+" + digits;
    }
    // se for apenas dígitos, aceita e prefixa +
    const digitsOnly = s.replace(/\D/g, "");
    return digitsOnly ? "+" + digitsOnly : "";
  }

  // Validação em duas fases:
  // Fase 1: obrigatórios preenchidos? (sem checar formato de telefone ainda)
  // Fase 2: tudo ok? então checa formato de telefone; se falhar, mostra erro específico
  function validatePhase1() {
    clearFieldErrors();

    const email = field("EMAIL")?.value.trim() || "";
    const name  = field("FNAME")?.value.trim() || "";
    const phoneRaw = field("PHONE")?.value || "";
    const company = field("COMPANY")?.value?.trim() || "";
    const projectType = field("PROJECT")?.value || "";
    const city = field("CITY")?.value?.trim() || "";
    const budget = field("BUDGET")?.value || "";
    const timeline = field("TIMELINE")?.value || "";
    const consent = document.getElementById("consent");

    let ok = true;

    // Obrigatórios presentes
    if (!name) { ok = false; markInvalid("FNAME"); }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { ok = false; markInvalid("EMAIL"); }
    if (!phoneRaw) { ok = false; markInvalid("PHONE"); }
    if (!company) { ok = false; markInvalid("COMPANY"); }
    if (!projectType) { ok = false; markInvalid("PROJECT"); }
    if (!city) { ok = false; markInvalid("CITY"); }
    if (!budget) { ok = false; markInvalid("BUDGET"); }
    if (!timeline) { ok = false; markInvalid("TIMELINE"); }
    if (consent && !consent.checked) { ok = false; consent.classList.add("is-invalid"); }

    return ok;
  }

  function validatePhase2Phone() {
    const phoneRaw = field("PHONE")?.value || "";
    const normalized = normalizePhoneFlexible(phoneRaw);

    // Aceita +dddddd (6-15) OU dígitos 10-15 (já normalizados para +)
    const ok = /^\+\d{6,15}$/.test(normalized);
    if (!ok) {
      markInvalid("PHONE");
      return { ok: false, normalized: null };
    }
    // grava de volta o valor normalizado (visual e envio)
    field("PHONE").value = normalized;
    return { ok: true, normalized };
  }

  // Mapeia erros do Mailchimp para mensagem amigável
  function mapMailchimpError(raw) {
    const text = String(raw || "").toLowerCase();
    if (text.includes("permanently deleted") || text.includes("cannot be re-imported") || text.includes("gdpr")) {
      return "This email was permanently removed previously. To join again, please confirm the resubscription link sent to your inbox.";
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

    // Fase 1: checa obrigatórios preenchidos
    const basicOk = validatePhase1();
    if (!basicOk) {
      openModal("Please review the form", "Some fields need your attention.", "error");
      return;
    }

    // Fase 2: agora sim checa formato do telefone
    const phoneCheck = validatePhase2Phone();
    if (!phoneCheck.ok) {
      openModal("Oops…", "Invalid phone number. Use international format, e.g., +5511999999999.", "error");
      return;
    }

    const fd = new FormData(form);
    const payload = {
      EMAIL: fd.get("EMAIL"),
      FNAME: fd.get("FNAME"),
      PHONE: field("PHONE").value, // já normalizado com +
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
        const consent = document.getElementById("consent");
        if (consent) consent.classList.remove("is-invalid");
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
