/*
  GrowthCommerce Masterclass Landing Page Scripts
  - Countdown timer to a deadline
  - Limited slots counter with persistence
  - Smooth scrolling for internal links
  - Dynamic CTA target (WhatsApp or payment URL)
  - Basic robustness for invalid states
*/

(function () {
  const STORAGE_KEYS = {
    deadline: 'gc_deadline',
    slots: 'gc_slots_left',
    cta: 'gc_cta_url'
  };

  const DEFAULTS = {
    // 72 hours from first visit
    countdownHours: 5,
    initialSlots: 8,
    // Example CTA: Replace with WhatsApp or payment link
    ctaUrl: 'https://wa.me/2347044006293?text=I%20want%20to%20secure%20my%20spot%20for%20%235,000'
  };

  const $ = (sel) => document.querySelector(sel);

  function safeParseInt(value, fallback) {
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function getOrInitDeadline() {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.deadline);
      if (existing) {
        const d = new Date(existing);
        if (!isNaN(d.getTime())) return d;
      }
      const now = new Date();
      const deadline = new Date(now.getTime() + DEFAULTS.countdownHours * 60 * 60 * 1000);
      localStorage.setItem(STORAGE_KEYS.deadline, deadline.toISOString());
      return deadline;
    } catch {
      // Fallback: non-persistent
      const now = new Date();
      return new Date(now.getTime() + DEFAULTS.countdownHours * 60 * 60 * 1000);
    }
  }

  function getOrInitSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.slots);
      if (raw !== null) return safeParseInt(raw, DEFAULTS.initialSlots);
      localStorage.setItem(STORAGE_KEYS.slots, String(DEFAULTS.initialSlots));
      return DEFAULTS.initialSlots;
    } catch {
      return DEFAULTS.initialSlots;
    }
  }

  function setSlots(n) {
    try {
      localStorage.setItem(STORAGE_KEYS.slots, String(n));
    } catch {
      // ignore
    }
  }

  function getOrInitCtaUrl() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cta);
      if (raw) return raw;
      localStorage.setItem(STORAGE_KEYS.cta, DEFAULTS.ctaUrl);
      return DEFAULTS.ctaUrl;
    } catch {
      return DEFAULTS.ctaUrl;
    }
  }

  function updateCountdown(deadline) {
    const target = $('#countdown');
    if (!target) return;
    function tick() {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        target.textContent = '00:00:00';
        return;
      }
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      const fmt = (n) => String(n).padStart(2, '0');
      target.textContent = `${fmt(hrs)}:${fmt(mins)}:${fmt(secs)}`;
      requestAnimationFrame(() => setTimeout(tick, 500));
    }
    tick();
  }

  function attachCta(url) {
    // Only apply to elements that explicitly opt in via data-cta and are not in-page anchors
    const links = document.querySelectorAll('[data-cta]');
    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) return; // keep in-page anchors intact
      a.setAttribute('href', url);
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('target', '_blank');
    });
  }

  function updateSlotsUI(n) {
    const el = $('#slots-left');
    if (el) el.textContent = String(Math.max(0, n));
  }

  function maybeDecaySlots(n) {
    // Simple decay: reduce 1 slot every 12-24 page interactions (pseudo‑random)
    const token = 'gc_interactions';
    let count = safeParseInt(sessionStorage.getItem(token), 0) + 1;
    sessionStorage.setItem(token, String(count));
    const threshold = 12 + Math.floor(Math.random() * 12);
    if (count >= threshold && n > 1) {
      sessionStorage.setItem(token, '0');
      return n - 1;
    }
    return n;
  }

  function smoothScrollInit() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;
      const dest = document.querySelector(hash);
      if (!dest) return;
      e.preventDefault();
      dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function init() {
    try {
      const deadline = getOrInitDeadline();
      updateCountdown(deadline);

      let slots = getOrInitSlots();
      slots = maybeDecaySlots(slots);
      setSlots(slots);
      updateSlotsUI(slots);

      const cta = getOrInitCtaUrl();
      attachCta(cta);

      smoothScrollInit();

      // Also update year
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    } catch (err) {
      // As a last resort, do not break the page
      console.error('Initialization error', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


