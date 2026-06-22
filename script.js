// ── Supabase einbinden ────────────────────────────
const SUPABASE_URL = 'https://bfnqrhraixqamzddfmcq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EuBqqbJLu7wbWISwYI08KA_xg6H8zqc';
let supabasePromise;

function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY))
      .catch((error) => {
        supabasePromise = null;
        throw error;
      });
  }
  return supabasePromise;
}

const invite = "https://discord.gg/PXbb5M9Zg";

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
setInterval(() => {
  if (!document.hidden) fetchServerStatus();
}, 60000);

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

const tabContents = [...document.querySelectorAll('.tab-content')];
const tabButtons = [...document.querySelectorAll('.tab-btn')];

function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// Tab switching
function switchTab(tab) {
  const targetTab = document.getElementById(tab + '-tab');
  if (!targetTab) return;

  // Hide all tab contents
  tabContents.forEach(c => c.classList.remove('active'));
  
  // Remove active from ALL tab buttons first
  tabButtons.forEach(b => b.classList.remove('active'));
  
  // Activate content
  targetTab.classList.add('active');
  
  // Activate ONE button per set: desktop and mobile
  document.querySelector('.nav-tabs .tab-btn[data-tab="' + tab + '"]')?.classList.add('active');
  document.querySelector('.mobile-tab-btn[data-tab="' + tab + '"]')?.classList.add('active');
  
  // Update URL hash
  window.history.replaceState(null, null, '#' + tab);
  
  observeReveals(targetTab);
  document.dispatchEvent(new CustomEvent('tabchange', { detail: { tab } }));
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

// Check URL hash on load (activate requested tab if present)
const hash = window.location.hash.slice(1);
if (hash) {
  const el = document.getElementById(hash + '-tab');
  if (el) switchTab(hash);
}

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

/* ===== REVIEWS ===== */
(function () {
  const form     = document.getElementById('review-form');
  const listEl   = document.getElementById('reviews-list');
  const ratingEl = document.getElementById('rating');
  let currentRating = 5;
  let reviewsLoaded = false;
  const OWN_KEY = 'diversion_own_reviews';

  // ── Eigene Review-IDs aus localStorage ──────────────────
  function getOwnIds() {
    try { return JSON.parse(localStorage.getItem(OWN_KEY) || '[]'); }
    catch { return []; }
  }
  function saveOwnId(id) {
    const ids = getOwnIds();
    ids.push(id);
    localStorage.setItem(OWN_KEY, JSON.stringify(ids));
  }
  function removeOwnId(id) {
    localStorage.setItem(OWN_KEY, JSON.stringify(getOwnIds().filter(x => x !== id)));
  }

  // ── Profanity filter ─────────────────────────────────────
  const PROFANITY = [
    'fuck','fucks','fucked','fucking','shit','shits','shithead','bitch','bitches',
    'bastard','asshole','damn','crap','douche','douchebag','nigger','nigga','negga','motherfucker',
    'scheiße','scheisse','arsch','arschloch','hurensohn','wichser','nutte','schlampe',
    'ficker','verdammt','mist','idiot','dummkopf'
  ];
  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  const PROFANITY_PATTERN = new RegExp('\\b(' + PROFANITY.map(escapeRegExp).join('|') + ')\\b', 'i');
  function containsProfanity(text) {
    if (!text) return false;
    return PROFANITY_PATTERN.test(text);
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

  // ── Review löschen ───────────────────────────────────────
  async function deleteReview(id) {
    if (!confirm('Delete your review?')) return;
    const supabase = await getSupabase();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) { alert('Could not delete review. Please try again.'); return; }
    removeOwnId(id);
    loadAndRender({ force: true });
  }

  // ── Reviews laden & anzeigen ─────────────────────────────
  async function loadAndRender({ force = false } = {}) {
    if (!listEl || (reviewsLoaded && !force)) return;
    listEl.innerHTML = '<div style="color:var(--muted);">Loading reviews…</div>';

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .select('id,name,rating,comment,created_at')
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(24);

    if (error || !data) {
      reviewsLoaded = false;
      listEl.innerHTML = '<div style="color:var(--muted);">Could not load reviews.</div>';
      return;
    }
    if (data.length === 0) {
      reviewsLoaded = true;
      listEl.innerHTML = '<div style="color:var(--muted);">No reviews yet — be the first to leave one!</div>';
      return;
    }

    const ownIds = getOwnIds();
    listEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    data.forEach(r => {
      const card = document.createElement('article');
      card.className = 'review-card reveal';
      const date = new Date(r.created_at);
      const isOwn = ownIds.includes(r.id);

      card.innerHTML = `
        <div class="review-meta">
          <div class="review-name">${escapeHtml(r.name || 'Anonymous')}</div>
          <div class="review-date">${date.toLocaleString()}</div>
          ${isOwn ? `
          <button class="review-delete" title="Delete your review" aria-label="Delete review">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>` : ''}
        </div>
        <div class="review-stars">${renderStars(r.rating || 0)}</div>
        <div class="review-body">${escapeHtml(r.comment || '')}</div>
      `;

      if (isOwn) {
        card.querySelector('.review-delete').addEventListener('click', () => deleteReview(r.id));
      }

      fragment.appendChild(card);
      if (typeof observer !== 'undefined') observer.observe(card);
    });
    listEl.appendChild(fragment);
    reviewsLoaded = true;
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

      const supabase = await getSupabase();
      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert({ name, rating: currentRating, comment })
        .select('id')
        .single();

      if (btn) { btn.disabled = false; btn.textContent = 'Submit review'; }

      if (error) {
        if (errorEl) errorEl.textContent = 'Error submitting review. Please try again.';
        return;
      }

      // ID merken damit Mülleimer angezeigt wird
      if (inserted?.id) saveOwnId(inserted.id);

      document.getElementById('review-text').value = '';
      document.getElementById('review-name').value = '';
      currentRating = 5;
      if (ratingEl) ratingEl.querySelectorAll('.star').forEach(s =>
        s.classList.toggle('selected', Number(s.dataset.value) <= currentRating));

      loadAndRender({ force: true });
    });
  }

  // ── Beim Laden starten ───────────────────────────────────
  document.addEventListener('tabchange', (event) => {
    if (event.detail?.tab === 'reviews') loadAndRender();
  });

  if (document.getElementById('reviews-tab')?.classList.contains('active')) {
    loadAndRender();
  }
})();

// ── Footer tab links ─────────────────────────────────────
document.querySelectorAll('[data-tab-link]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tabLink;
    switchTab(tab);
  });
});
