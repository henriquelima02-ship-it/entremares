(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');
  const SHRIMP_LOGO_URL = 'https://media.baamboozle.com/uploads/images/838881/1671078098_84833_gif-url.gif';

  function enhanceBrandLogo() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.brand-symbol').forEach(symbol => {
      symbol.classList.add('brand-logo');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.textContent = '';

      if (reduceMotion) {
        symbol.textContent = '🦐';
        symbol.classList.add('brand-logo-static');
        return;
      }

      const img = document.createElement('img');
      img.src = SHRIMP_LOGO_URL;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        symbol.textContent = '🦐';
        symbol.classList.add('brand-logo-static');
      }, { once: true });
      symbol.appendChild(img);
    });
  }


  function prefixForNav() {
    const home = nav?.querySelector('a[href$="index.html"]');
    return home?.getAttribute('href')?.startsWith('../') ? '../' : './';
  }

  function session() {
    try {
      return JSON.parse(sessionStorage.getItem('entremares_session_v1') || 'null');
    } catch (_) {
      return null;
    }
  }

  function ensureNavLink(file, label, beforeFile = '') {
    if (!nav || nav.querySelector(`a[href$="${file}"]`)) return;
    const link = document.createElement('a');
    link.href = `${prefixForNav()}${file}`;
    link.textContent = label;
    const before = beforeFile ? nav.querySelector(`a[href$="${beforeFile}"]`) : null;
    if (before) nav.insertBefore(link, before);
    else nav.appendChild(link);
  }

  function currentSectionFile() {
    const path = window.location.pathname.toLowerCase();
    if (/\/(conteudos|locais)\//.test(path)) return 'guia.html';
    return path.split('/').filter(Boolean).pop() || 'index.html';
  }

  function markCurrentNavigation(scope) {
    if (!scope) return;
    const currentFile = currentSectionFile();
    scope.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').split('#')[0].split('?')[0];
      const file = href.split('/').filter(Boolean).pop();
      const active = file === currentFile;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function removePublicSubmissionLinks() {
    document.querySelectorAll('a[href$="contribuir.html"]').forEach(link => link.remove());
    document.querySelectorAll('.site-footer a[href$="curadoria.html"]').forEach(link => link.remove());
  }

  enhanceBrandLogo();
  removePublicSubmissionLinks();

  if (toggle && nav) {
    nav.id ||= 'main-navigation';
    toggle.setAttribute('aria-controls', nav.id);

    const setMenuState = isOpen => {
      nav.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      toggle.textContent = isOpen ? '×' : '☰';
    };

    toggle.addEventListener('click', () => setMenuState(!nav.classList.contains('open')));
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) setMenuState(false);
    });
    document.addEventListener('click', event => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setMenuState(false);
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMenuState(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) setMenuState(false);
    });
    setMenuState(false);
  }

  if (nav) {
    nav.querySelectorAll('a[href$="guia.html"]').forEach(link => {
      if (/guia turístico/i.test(link.textContent)) link.textContent = 'Lugares';
    });
    nav.querySelectorAll('a[href$="cadastro.html"]').forEach(link => {
      if (/cadastro/i.test(link.textContent)) link.textContent = 'Para pescadores';
    });

    ensureNavLink('pescadores.html', 'Pescadores', 'pescados.html');
    ensureNavLink('pescados.html', 'Pescados', 'cadastro.html');

    const currentSession = session();
    if (!nav.querySelector('[data-session-nav]')) {
      const account = document.createElement('a');
      account.dataset.sessionNav = 'true';
      if (currentSession?.user?.role === 'pescador') {
        account.href = `${prefixForNav()}painel-pescador.html`;
        account.textContent = 'Meu painel';
      } else if (currentSession?.user?.curator) {
        account.href = `${prefixForNav()}curadoria-comercial.html`;
        account.textContent = 'Curadoria';
      } else if (currentSession?.user?.role === 'cliente') {
        account.href = `${prefixForNav()}minha-conta.html`;
        account.textContent = 'Meus pedidos';
      } else {
        account.href = `${prefixForNav()}login.html`;
        account.textContent = 'Comprar / Vender';
      }
      nav.appendChild(account);
    }
    markCurrentNavigation(nav);
  }

  const publicPage = !/curadoria|painel-pescador/.test(window.location.pathname);
  if (publicPage && !document.querySelector('.mobile-quick-nav')) {
    const prefix = prefixForNav();
    const currentSession = session();
    const accountFile = currentSession?.user?.role === 'pescador'
      ? 'painel-pescador.html'
      : currentSession?.user?.role === 'cliente'
        ? 'minha-conta.html'
        : 'login.html';
    const accountLabel = currentSession?.user?.role === 'pescador'
      ? 'Painel'
      : currentSession?.user?.role === 'cliente'
        ? 'Pedidos'
        : 'Acesso';
    const quickNav = document.createElement('nav');
    quickNav.className = 'mobile-quick-nav';
    quickNav.setAttribute('aria-label', 'Acesso rápido');
    quickNav.innerHTML = `
      <a href="${prefix}index.html"><span aria-hidden="true">⌂</span><small>Início</small></a>
      <a href="${prefix}guia.html"><span aria-hidden="true">⌖</span><small>Lugares</small></a>
      <a href="${prefix}pescados.html"><span aria-hidden="true">◒</span><small>Pescados</small></a>
      <a href="${prefix}${accountFile}"><span aria-hidden="true">◎</span><small>${accountLabel}</small></a>
    `;
    document.body.appendChild(quickNav);
    markCurrentNavigation(quickNav);
  }

  const needsVisualMedia = /\/conteudos\/(fauna-flora-piacaguera|historia-piacaguera)\.html$/.test(window.location.pathname);
  if (needsVisualMedia) {
    const script = document.createElement('script');
    script.src = '../js/visual-media.js';
    script.defer = true;
    document.body.appendChild(script);
  }
})();