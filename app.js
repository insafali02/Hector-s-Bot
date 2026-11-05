(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
  const validDiscord = (value) => {
    if (!value) return null;
    try {
      const u = new URL(String(value));
      if (u.protocol !== 'https:' || !['discord.com', 'www.discord.com', 'discord.gg', 'www.discord.gg'].includes(u.hostname)) return null;
      return u.toString();
    } catch { return null; }
  };
  const id = String(config.botClientId || '').trim();
  const generatedBotUrl = /^\d{15,22}$/.test(id)
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(id)}&permissions=84992&integration_type=0&scope=bot%20applications.commands`
    : null;
  const links = { bot: validDiscord(config.botInviteUrl) || generatedBotUrl, support: validDiscord(config.supportServerUrl) };
  const dialog = $('#link-dialog');
  const openMissing = (type) => {
    const msg = $('#dialog-message');
    if (msg) msg.textContent = type === 'bot'
      ? 'The bot owner needs to set botClientId or botInviteUrl in site-config.js to enable the install button.'
      : 'The bot owner needs to set supportServerUrl in site-config.js to enable this Discord community link.';
    if (dialog?.showModal) dialog.showModal();
    else alert(msg?.textContent || 'This link has not been configured yet.');
  };
  $$('[data-link]').forEach((a) => {
    const type = a.dataset.link;
    const href = links[type];
    if (href) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.removeAttribute('aria-disabled');
    } else {
      a.href = '#';
      a.classList.add('needs-config');
      a.setAttribute('title', 'Configure Discord URL in site-config.js');
      a.addEventListener('click', (event) => { event.preventDefault(); openMissing(type); });
    }
  });
  $$('[data-brand]').forEach(el => { if (config.brand) el.textContent = String(config.brand).slice(0, 55); });
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  $$('[data-contact]').forEach(el => {
    const email = String(config.contactEmail || '').trim();
    if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
      const link = document.createElement('a');
      link.href = `mailto:${email}`; link.textContent = email;
      el.replaceChildren(link);
    } else if (links.support) {
      const link = document.createElement('a');
      link.href = links.support; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = 'Contact us through the Discord community';
      el.replaceChildren(link);
    } else {
      el.textContent = 'Contact information pending project setup';
    }
  });
  $('[data-close-dialog]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  const toggle = $('.mobile-menu-toggle');
  const nav = $('#nav-links');
  const closeMenu = () => { toggle?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open'); };
  toggle?.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(next));
    nav?.classList.toggle('open', next);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => { if (nav?.classList.contains('open') && !e.target.closest('.site-header')) closeMenu(); });

  const search = $('#faq-search');
  if (search) {
    let category = 'All';
    const entries = $$('.faq-item');
    const filters = $$('.category-btn');
    function update() {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      entries.forEach(item => {
        const match = (category === 'All' || item.dataset.category === category)
          && (!query || item.textContent.toLowerCase().includes(query));
        item.hidden = !match;
        if (match) visible++;
      });
      $('#faq-count').textContent = String(visible);
      $('#faq-empty').hidden = visible !== 0;
    }
    search.addEventListener('input', update);
    filters.forEach(btn => btn.addEventListener('click', () => {
      category = btn.dataset.categoryFilter;
      filters.forEach(b => b.classList.toggle('selected', b === btn));
      update();
    }));
    $('#faq-reset')?.addEventListener('click', () => {
      search.value = '';
      filters.find(b => b.dataset.categoryFilter === 'All')?.click();
      search.focus();
    });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); search.focus();
      }
    });
  }

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((records) => {
      records.forEach(r => { if (r.isIntersecting) { r.target.classList.add('visible'); io.unobserve(r.target); } });
    }, { threshold: 0.06 });
    $$('.reveal').forEach(e => io.observe(e));
  } else $$('.reveal').forEach(e => e.classList.add('visible'));
})();
