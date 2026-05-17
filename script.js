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


// Check URL hash on load
const hash = window.location.hash.slice(1);
if (hash === 'rules') {
  switchTab('rules');
}

// Events: Details toggle
(function initEventDetailsToggle() {
  const btn = document.getElementById('event-details');
  const panel = document.getElementById('event-details-panel');
  if (!btn || !panel) return;

  const update = (expanded) => {
    btn.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  };

  btn.addEventListener('click', () => {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    update(!isExpanded);
  });
})();

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
    // Apply state immediately (prevents transition timing issues)
    mobileBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');

    // Lock scroll while menu is open
    body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');

    // Restore scroll after slide-out finishes (prevents “transition doesn’t match”)
    window.setTimeout(() => {
      if (mobileMenu.getAttribute('aria-hidden') === 'true') {
        body.style.overflow = '';
      }
    }, 360);
  }


  // Toggle events
  mobileBtn.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);

  // Close on tab select
  mobileTabs.forEach(btn => {
    btn.addEventListener('click', closeMenu);
  });

  // Close on overlay click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Keyboard ESC close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
      closeMenu();
    }
  });
})();