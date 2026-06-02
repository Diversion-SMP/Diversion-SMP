// ── Supabase einbinden ────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://bfnqrhraixqamzddfmcq.supabase.co',
  'sb_publishable_EuBqqbJLu7wbWISwYI08KA_xg6H8zqc'
)

const invite = "https://discord.gg/R3Pf36DtY";

// Server status
async function fetchServerStatus() {
  const statusEl = document.getElementById("server-status");
  const playersEl = document.getElementById("server-players");
  if (!statusEl || !playersEl) return;
  try {
    const res = await fetch("https://api.mcsrvstat.us/bedrock/3/82.22.145.172:19188");
    const data = await res.json();
    if (data.online) {
      statusEl.textContent = "Online";
      statusEl.className = "info-val status-online";
      playersEl.textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
    } else {
      statusEl.textContent = "Offline";
      statusEl.className = "info-val status-offline";
      playersEl.textContent = "—";
    }
  } catch {
    statusEl.textContent = "Unknown";
    statusEl.className = "info-val";
    playersEl.textContent = "—";
  }
}

fetchServerStatus();
setInterval(fetchServerStatus, 60000);

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Copy buttons (both)
["copyDiscord", "copyDiscord2"].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(invite);
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = oldText), 1400);
    } catch {
      window.prompt("Copy this link:", invite);
    }
  });
});

// Tab switching
function switchTab(tab) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  // Remove active from ALL tab buttons first
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  // Activate content
  document.getElementById(tab + '-tab').classList.add('active');
  
  // Activate ONE button per set: desktop and mobile
  document.querySelector('.nav-tabs .tab-btn[data-tab="' + tab + '"]')?.classList.add('active');
  document.querySelector('.mobile-tab-btn[data-tab="' + tab + '"]')?.classList.add('active');
  
  // Update URL hash
  window.history.replaceState(null, null, '#' + tab);
  
  // Refresh reveals for new content
  setTimeout(() => {
    document.querySelectorAll('.tab-content .reveal').forEach(el => observer.observe(el));
  }, 100);
}


// Desktop tab buttons (.nav-tabs)
document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

// Mobile tab buttons (.mobile-tab-btn)
document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});


// Check URL hash on load (activate requested tab if present)
const hash = window.location.hash.slice(1);
if (hash) {
  const el = document.getElementById(hash + '-tab');
  if (el) switchTab(hash);
}

// Reveal animation (observe all .reveal elements) - optimized with rootMargin
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target); // Stop observing once visible for better perf
      }
    });
  },
  { threshold: 0.1, rootMargin: "-50px" } // Preload 50px before visible
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Mobile menu functionality
(function() {
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-menu-close');
  const mobileTabs = document.querySelectorAll('.mobile-tab-btn');
  const body = document.body;

  if (!mobileBtn || !mobileMenu) return;

  function openMenu() {
    requestAnimationFrame(() => {
      mobileBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      // iOS scroll fix: prevent background scroll
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        body.style.position = 'fixed';
        body.style.width = '100%';
      } else {
        body.style.overflow = 'hidden';
      }
    });
  }

  function closeMenu() {
    requestAnimationFrame(() => {
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      body.style.position = '';
      body.style.width = '';
      body.style.overflow = '';
    });
  }

  // Toggle events
  mobileBtn.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);

  // Close on tab select
  mobileTabs.forEach(btn => {
    btn.addEventListener('click', closeMenu);
  });

  // Close on overlay click (outside inner)
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Keyboard ESC close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      closeMenu();
    }
  });

  // Close on window resize to desktop
  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 800) {
      closeMenu();
    }
  });
})();

//* ===== REVIEWS: Supabase-backed (global, persistent) ===== */
(function () {
  const form     = document.getElementById('review-form');
  const listEl   = document.getElementById('reviews-list');
  const ratingEl = document.getElementById('rating');
  let currentRating = 5;

  // ── Profanity filter ─────────────────────────────────────
  const PROFANITY = [
    'fuck','fucks','fucked','fucking','shit','shits','shithead','bitch','bitches',
    'bastard','asshole','damn','crap','douche','douchebag','nigger','nigga','negga','motherfucker',
    'scheiße','scheisse','arsch','arschloch','hurensohn','wichser','nutte','schlampe',
    'ficker','verdammt','mist','idiot','dummkopf'
  ];
  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function containsProfanity(text) {
    if (!text) return false;
    for (const w of PROFANITY) {
      if (new RegExp('\\b' + escapeRegExp(w) + '\\b', 'i').test(text)) return true;
    }
    return false;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function renderStars(n) {
    return Array.from({length: 5}, (_, i) => i < n ? '★' : '☆').join('');
  }

  // ── Error element ────────────────────────────────────────
  let errorEl = null;
  if (form) {
    errorEl = document.createElement('div');
    errorEl.className = 'reviews-error';
    form.after(errorEl);
  }

  // ── Reviews von Supabase laden & anzeigen ────────────────
  async function loadAndRender() {
    if (!listEl) return;
    listEl.innerHTML = '<div style="color:var(--muted);">Loading reviews…</div>';

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      listEl.innerHTML = '<div style="color:var(--muted);">Could not load reviews.</div>';
      return;
    }
    if (data.length === 0) {
      listEl.innerHTML = '<div style="color:var(--muted);">No reviews yet — be the first to leave one!</div>';
      return;
    }

    listEl.innerHTML = '';
    data.forEach(r => {
      const card = document.createElement('article');
      card.className = 'review-card reveal';
      const date = new Date(r.created_at);
      card.innerHTML = `
        <div class="review-meta">
          <div class="review-name">${escapeHtml(r.name || 'Anonymous')}</div>
          <div class="review-date">${date.toLocaleString()}</div>
        </div>
        <div class="review-stars">${renderStars(r.rating || 0)}</div>
        <div class="review-body">${escapeHtml(r.comment || '')}</div>
      `;
      listEl.appendChild(card);
      if (typeof observer !== 'undefined') observer.observe(card);
    });
  }

  // ── Stern-Bewertung UI ───────────────────────────────────
  if (ratingEl) {
    const stars = ratingEl.querySelectorAll('.star');
    function setStars(n) {
      stars.forEach(b => b.classList.toggle('selected', Number(b.dataset.value) <= n));
    }
    stars.forEach(btn => {
      const v = Number(btn.dataset.value);
      btn.addEventListener('mouseenter', () => setStars(v));
      btn.addEventListener('mouseleave', () => setStars(currentRating));
      btn.addEventListener('click',      () => { currentRating = v; setStars(v); });
    });
    setStars(currentRating);
  }

  // ── Formular absenden ────────────────────────────────────
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name    = (document.getElementById('review-name')?.value || 'Anonymous').trim();
      const comment = (document.getElementById('review-text')?.value || '').trim();

      if (!comment) return alert('Please enter a review message.');

      if (containsProfanity(name) || containsProfanity(comment)) {
        if (errorEl) errorEl.textContent = 'Your review contains inappropriate language. Please revise it.';
        return;
      }
      if (errorEl) errorEl.textContent = '';

      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

      const { error } = await supabase
        .from('reviews')
        .insert({ name, rating: currentRating, comment });

      if (btn) { btn.disabled = false; btn.textContent = 'Submit review'; }

      if (error) {
        if (errorEl) errorEl.textContent = 'Error submitting review. Please try again.';
        return;
      }

      document.getElementById('review-text').value = '';
      document.getElementById('review-name').value = '';
      currentRating = 5;
      if (ratingEl) ratingEl.querySelectorAll('.star').forEach(s =>
        s.classList.toggle('selected', Number(s.dataset.value) <= currentRating));

      loadAndRender();
    });
  }

  // ── Beim Laden starten ───────────────────────────────────
  document.addEventListener('DOMContentLoaded', loadAndRender);
})();
