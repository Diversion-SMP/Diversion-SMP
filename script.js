// ── Supabase einbinden ────────────────────────────
import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://bfnqrhraixqamzddfmcq.supabase.co',
  'sb_publishable_EuBqqbJLu7wbWISwYI08KA_xg6H8zqc'
)

// ── Reviews laden ────────────────────────────────
async function loadReviews() {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  renderReviews(data ?? [])
}

// ── Review speichern ─────────────────────────────
async function submitReview(name, rating, comment) {
  const { error } = await supabase
    .from('reviews')
    .insert({ name, rating, comment })
  if (!error) loadReviews()
}

document.addEventListener('DOMContentLoaded', loadReviews)

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

/* ===== REVIEWS: localStorage-backed reviews list ===== */
(function() {
  const STORAGE_KEY = 'diversion_reviews';
  const form = document.getElementById('review-form');
  const listEl = document.getElementById('reviews-list');
  const ratingEl = document.getElementById('rating');
  let currentRating = 5;
  const IP_STORAGE_KEY = 'diversion_reviews_ip';

  async function getClientIp() {
    const cachedIp = localStorage.getItem(IP_STORAGE_KEY);
    if (cachedIp) return cachedIp;

    return new Promise((resolve) => {
      const ipRegex = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/;
      const pc = new RTCPeerConnection({ iceServers: [] });
      let ipFound = null;
      const timeout = setTimeout(() => {
        pc.close();
        resolve(ipFound || 'unknown');
      }, 3000);

      function maybeResolve(candidate) {
        const match = ipRegex.exec(candidate);
        if (match) {
          ipFound = match[1];
          localStorage.setItem(IP_STORAGE_KEY, ipFound);
          clearTimeout(timeout);
          pc.close();
          resolve(ipFound);
        }
      }

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) return;
        maybeResolve(event.candidate.candidate);
      };

      pc.createDataChannel('ip-check');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {
        clearTimeout(timeout);
        pc.close();
        resolve('unknown');
      });
    });
  }

  const clientIpPromise = getClientIp();

  // Profanity filter (English + German common words)
  const PROFANITY = [
    // English
    'fuck','fucks','fucked','fucking','shit','shits','shithead','bitch','bitches','bastard','asshole','damn','crap','douche','douchebag','nigger','nigga' ,'negga','motherfucker',
    // German
    'scheiße','scheisse','arsch','arschloch','hurensohn','wichser','nutte','schlampe','ficker','verdammt','mist','idiot','dummkopf'
  ];

  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function containsProfanity(text) {
    if (!text) return false;
    for (const w of PROFANITY) {
      const re = new RegExp('\\b' + escapeRegExp(w) + '\\b', 'i');
      if (re.test(text)) return true;
    }
    return false;
  }

  // error element below the form
  let errorEl = null;
  if (form) {
    errorEl = document.createElement('div');
    errorEl.className = 'reviews-error';
    form.after(errorEl);
  }

  function loadReviews() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveReviews(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function renderStars(num) {
    let out = '';
    for (let i=0;i<5;i++) out += (i < num) ? '★' : '☆';
    return out;
  }

  function render() {
    if (!listEl) return;
    const reviews = loadReviews().slice().sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    listEl.innerHTML = '';
    if (reviews.length === 0) {
      listEl.innerHTML = '<div style="color:var(--muted);">No reviews yet — be the first to leave one!</div>';
      return;
    }

    reviews.forEach(r => {
      const card = document.createElement('article');
      card.className = 'review-card reveal';
      const date = new Date(r.ts || 0);
      card.innerHTML = `\n        <div class="review-meta">\n          <div class="review-name">${escapeHtml(r.name || 'Anonymous')}</div>\n          <div class="review-date">${date.toLocaleString()}</div>\n        </div>\n        <div class="review-stars">${renderStars(r.rating || 0)}</div>\n        <div class="review-body">${escapeHtml(r.message || '')}</div>\n        <button class="review-delete" data-ts="${r.ts}" aria-label="Löschen" title="Löschen">\n          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n            <polyline points="3 6 5 6 21 6"></polyline>\n            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>\n            <path d="M10 11v6"></path>\n            <path d="M14 11v6"></path>\n            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>\n          </svg>\n        </button>\n      `;
      listEl.appendChild(card);
      observer.observe(card);
      // attach delete handler
      const del = card.querySelector('.review-delete');
      if (del) {
        del.addEventListener('click', (ev) => {
          ev.preventDefault();
          const ts = Number(del.dataset.ts);
          if (!ts) return;
          if (!confirm('Möchtest du diese Bewertung wirklich löschen?')) return;
          deleteReview(ts);
        });
      }
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]; }); }

  // rating UI
  if (ratingEl) {
    ratingEl.querySelectorAll('.star').forEach(btn => {
      const v = Number(btn.dataset.value);
      function setHover(n) {
        ratingEl.querySelectorAll('.star').forEach(b => b.classList.toggle('selected', Number(b.dataset.value) <= n));
      }
      btn.addEventListener('mouseenter', () => setHover(v));
      btn.addEventListener('mouseleave', () => setHover(currentRating));
      btn.addEventListener('click', () => { currentRating = v; setHover(currentRating); });
    });
    // initialize
    ratingEl.querySelectorAll('.star').forEach(s => s.classList.toggle('selected', Number(s.dataset.value) <= currentRating));
  }

  // handle submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('review-name')?.value || 'Anonymous').trim();
      const message = (document.getElementById('review-text')?.value || '').trim();
      if (!message) {
        if (errorEl) errorEl.textContent = '';
        return alert('Please enter a review message.');
      }

      // Profanity check (name + message)
      if (containsProfanity(name) || containsProfanity(message)) {
        if (errorEl) errorEl.textContent = 'Your review contains inappropriate language. Please revise it.';
        return;
      }

      const clientIp = await clientIpPromise;
      const reviews = loadReviews();
      const existingByIp = reviews.filter(r => String(r.ip || 'unknown').trim().toLowerCase() === clientIp.trim().toLowerCase()).length;
      if (existingByIp >= 3) {
        if (errorEl) errorEl.textContent = 'You can only submit up to 3 reviews per Person.';
        return;
      }

      if (errorEl) errorEl.textContent = '';
      reviews.push({ name, message, rating: currentRating, ts: Date.now(), ip: clientIp });
      saveReviews(reviews);
      (document.getElementById('review-text')).value = '';
      (document.getElementById('review-name')).value = '';
      currentRating = 5;
      if (ratingEl) ratingEl.querySelectorAll('.star').forEach(s => s.classList.toggle('selected', Number(s.dataset.value) <= currentRating));
      render();
    });
  }

  function deleteReview(ts) {
    const arr = loadReviews().filter(x => Number(x.ts) !== Number(ts));
    saveReviews(arr);
    render();
  }

  // initial render
  render();
})();
