/* Portfolio Meujesse Learning : exemples de modules présentés en cartes. Vanilla JS, sans dépendance. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const html = document.documentElement;
  const capture = location.search.includes('capture');
  if (capture) html.classList.add('capture');

  /* ---------- Préférence « réduire les animations » ---------- */
  const KEY_MOTION = 'ml-portfolio-reduce-motion';
  const motionBtn = $('[data-motion]');
  function setMotion(on) {
    html.classList.toggle('reduce-motion', on);
    motionBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(KEY_MOTION, on ? '1' : '0'); } catch (e) {}
    $$('.hcard video').forEach(v => on ? v.pause() : v.play().catch(() => {}));
  }
  let motionPref = false;
  try { motionPref = localStorage.getItem(KEY_MOTION) === '1'; } catch (e) {}
  if (motionPref || matchMedia('(prefers-reduced-motion: reduce)').matches) setMotion(true);
  motionBtn.addEventListener('click', () => setMotion(!html.classList.contains('reduce-motion')));

  /* ---------- Apparition au scroll ---------- */
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !capture) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
    /* Le hero ne dépend pas de l'observer : tout ce qui est déjà à l'écran apparaît tout de suite. */
    reveals.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Main de cartes du hero : légère inclinaison à la souris ---------- */
  const hand = $('[data-hand]');
  if (hand && matchMedia('(pointer: fine)').matches) {
    hand.addEventListener('mousemove', (e) => {
      if (html.classList.contains('reduce-motion')) return;
      const r = hand.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      $$('.hcard', hand).forEach((c, i) => {
        const k = (i + 1) * 6;
        c.style.setProperty('--mx', (x * k) + 'px');
        c.style.setProperty('--my', (y * k) + 'px');
      });
    });
    hand.addEventListener('mouseleave', () => {
      $$('.hcard', hand).forEach(c => { c.style.removeProperty('--mx'); c.style.removeProperty('--my'); });
    });
  }

  /* ---------- Vignettes de l'éventail : un clic descend au module ---------- */
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => {
    const target = document.querySelector('[data-card][data-id="' + b.dataset.goto + '"]');
    if (!target) return;
    curFam = 'all'; curPub = 'all'; applyFilters();
    target.classList.remove('is-flipped');
    target.scrollIntoView({ behavior: html.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'center' });
    target.classList.add('is-spot');
    setTimeout(() => target.classList.remove('is-spot'), 2600);
  }));

  /* ---------- Cartes : aperçu vidéo au survol ---------- */
  const cards = $$('[data-card]');
  /* Préchargement : dès qu'une carte approche de l'écran, sa vidéo se charge entièrement,
     pour que le survol démarre sans attente. */
  if ('IntersectionObserver' in window) {
    const pre = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const v = $('.card__media video', e.target);
        if (v && v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
        pre.unobserve(e.target);
      });
    }, { rootMargin: '600px 0px' });
    cards.forEach(c => pre.observe(c));
  }
  const noHover = matchMedia('(hover: none)').matches;
  if (noHover && 'IntersectionObserver' in window) {
    const auto = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = $('.card__media video', e.target); if (!v) return;
        if (e.intersectionRatio >= 0.6 && !html.classList.contains('reduce-motion')) { v.play().catch(() => {}); }
        else { v.pause(); }
      });
    }, { threshold: [0, 0.6] });
    cards.forEach(c => auto.observe(c));
  }
  cards.forEach(card => {
    const v = $('.card__media video', card);
    if (!v) return;
    const play = () => {
      if (html.classList.contains('reduce-motion')) return;
      try { v.currentTime = 0; } catch (e) {}
      v.play().catch(() => {});
    };
    const stop = () => { v.pause(); try { v.currentTime = 0; } catch (e) {} };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', play);
    card.addEventListener('focusout', stop);
  });

  /* ---------- Cartes : retourner ---------- */
  $$('[data-flip]').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('[data-card]');
    card.classList.toggle('is-flipped');
  }));

  /* ---------- Filtres (type × public) ---------- */
  const chips = $$('[data-filter]');
  const pchips = $$('[data-public]:not([data-card])');
  const empty = $('[data-empty]');
  const countAll = $('[data-count="all"]');
  if (countAll) countAll.textContent = cards.length;
  let curFam = 'all', curPub = 'all';
  function applyFilters() {
    let n = 0;
    cards.forEach(c => {
      const show = (curFam === 'all' || c.dataset.fam === curFam) && (curPub === 'all' || c.dataset.public === curPub);
      c.classList.toggle('is-hidden', !show);
      if (show) { n++; c.classList.add('is-in'); }
    });
    empty.hidden = n > 0;
    chips.forEach(ch => { const on = ch.dataset.filter === curFam; ch.classList.toggle('is-on', on); ch.setAttribute('aria-selected', on ? 'true' : 'false'); });
    pchips.forEach(ch => { const on = ch.dataset.public === curPub; ch.classList.toggle('is-on', on); ch.setAttribute('aria-selected', on ? 'true' : 'false'); });
  }
  function applyFilter(fam) { curFam = fam; applyFilters(); }
  function applyPublic(pub) { curPub = pub; applyFilters(); }
  chips.forEach(ch => ch.addEventListener('click', () => applyFilter(ch.dataset.filter)));
  pchips.forEach(ch => ch.addEventListener('click', () => applyPublic(ch.dataset.public)));

  /* ---------- Compteur : modules consultés ---------- */
  const KEY_PLAYED = 'ml-portfolio-played';
  let played = [];
  try { played = JSON.parse(localStorage.getItem(KEY_PLAYED) || '[]'); } catch (e) { played = []; }
  const scoreBox = $('[data-score]');
  const scoreN = $('[data-score-n]');
  const scoreTotal = $('[data-score-total]');
  const toast = $('[data-toast]');
  const ctaLinks = $$('[data-cta]');
  const contactTitle = $('[data-contact-title]');
  const contactSub = $('[data-contact-sub]');
  scoreTotal.textContent = cards.length;
  let toastShown = false;
  function renderScore(bump) {
    played = played.filter(id => cards.some(c => c.dataset.id === id));
    scoreN.textContent = played.length;
    cards.forEach(c => c.classList.toggle('is-played', played.includes(c.dataset.id)));
    if (bump) { scoreBox.classList.remove('is-bump'); void scoreBox.offsetWidth; scoreBox.classList.add('is-bump'); }
    if (played.length >= 3) {
      ctaLinks.forEach(a => { a.textContent = 'Prenez un appel'; });
      contactTitle.textContent = 'On fait la même chose pour vous et votre équipe\u00a0?';
      contactSub.textContent = 'Vous savez maintenant ce que nous sommes capables de produire. Prenez un appel pour parler de votre contenu, de votre public et du projet qu\'on pourrait faire ensemble.';
      if (bump && !toastShown && !capture) { toastShown = true; toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 12000); }
    }
    if (played.length === cards.length && bump) {
      $('[data-toast-title]').textContent = 'Vous avez tout vu.';
      $('[data-toast-text]').textContent = 'Il ne reste qu\'un module à consulter : celui qu\'on fabrique pour vous.';
      toast.hidden = false;
    }
  }
  function markPlayed(id) {
    const isNew = !played.includes(id);
    if (isNew) { played.push(id); try { localStorage.setItem(KEY_PLAYED, JSON.stringify(played)); } catch (e) {} }
    renderScore(isNew);
  }
  $('[data-toast-close]').addEventListener('click', () => { toast.hidden = true; });
  renderScore(false);

  /* ---------- Modal ---------- */
  const modal = $('[data-modal]');
  const frame = $('[data-modal-frame]');
  const mTitle = $('[data-modal-title]');
  const mExt = $('[data-modal-ext]');
  let lastFocus = null;
  let openCard = null;
  function openCardModal(card) {
    lastFocus = document.activeElement;
    openCard = card;
    const src = card.dataset.src;
    mTitle.textContent = card.dataset.title;
    mExt.href = src;
    frame.innerHTML = '';
    if (card.dataset.kind === 'video') {
      const v = document.createElement('video');
      v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
      frame.appendChild(v);
    } else {
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'portfolio=1';
      f.allow = 'autoplay; fullscreen; microphone';
      f.title = card.dataset.title;
      frame.appendChild(f);
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $$('.hcard video').forEach(v => v.pause());
    $('.modal__close').focus();
    markPlayed(card.dataset.id);
  }
  function closeModal() {
    modal.hidden = true;
    frame.innerHTML = '';
    document.body.style.overflow = '';
    if (!html.classList.contains('reduce-motion')) $$('.hcard video').forEach(v => v.play().catch(() => {}));
    if (lastFocus) lastFocus.focus();
    openCard = null;
  }
  $$('[data-play]').forEach(btn => btn.addEventListener('click', () => openCardModal(btn.closest('[data-card]'))));
  $$('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Le dé : tire une carte au hasard ---------- */
  const diceBtn = $('[data-dice-btn]');
  if (diceBtn) diceBtn.addEventListener('click', () => {
    diceBtn.classList.remove('is-rolling'); void diceBtn.offsetWidth; diceBtn.classList.add('is-rolling');
    const pool = cards.filter(c => !played.includes(c.dataset.id));
    const pick = (pool.length ? pool : cards)[Math.floor(Math.random() * (pool.length ? pool.length : cards.length))];
    applyFilter('all');
    const delay = html.classList.contains('reduce-motion') ? 0 : 650;
    setTimeout(() => {
      pick.scrollIntoView({ behavior: html.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'center' });
      pick.classList.add('is-in');
      setTimeout(() => openCardModal(pick), html.classList.contains('reduce-motion') ? 0 : 700);
    }, delay);
  });

  /* ---------- Calendly intégré : le domaine d'accueil est ajouté à l'URL ---------- */
  const cal = $('.contact__cal-box iframe[data-src]');
  if (cal) cal.src = cal.dataset.src + '&embed_domain=' + encodeURIComponent(location.hostname || 'localhost');

  /* ---------- Parcours ADDIE interactif (repris du site) ---------- */
  (function () {
    const root = $('[data-addie]'); if (!root) return;
    const nodes = $$('.addie__node', root), cards = $$('.addie__card', root), done = $('.addie__path .done', root);
    let cur = 0;
    const go = (i, scroll) => {
      cur = i;
      nodes.forEach((n, k) => { n.classList.toggle('is-active', k === i); n.classList.toggle('is-done', k < i); n.setAttribute('aria-pressed', String(k === i)); });
      cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
      if (done) done.style.strokeDashoffset = String(100 - (i / (nodes.length - 1)) * 100);
      if (scroll && innerWidth < 760) cards[i].scrollIntoView({ behavior: html.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'nearest' });
    };
    nodes.forEach((n, k) => n.addEventListener('click', () => go(k, true)));
    $$('[data-addie-next]', root).forEach(b => b.addEventListener('click', () => go((cur + 1) % nodes.length, true)));
    root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go((cur + 1) % nodes.length); if (e.key === 'ArrowLeft') go((cur - 1 + nodes.length) % nodes.length); });
    go(0);
  })();

  /* ---------- Hooks de test ---------- */
  const flipParam = new URLSearchParams(location.search).get('flip');
  if (flipParam) cards.filter(c => c.dataset.id === flipParam).forEach(c => c.classList.add('is-flipped'));
  window.__portfolio = { applyFilter, applyPublic, openCardModal, closeModal, markPlayed, played: () => played.slice() };
})();
