(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');
  const SHRIMP_LOGO_URL = 'https://media.baamboozle.com/uploads/images/838881/1671078098_84833_gif-url.gif';
  // Conjunto local de SVGs, sem CDN ou fontes externas. Ícones decorativos;
  // o texto dos botões e links continua sendo a descrição acessível.
  const iconPaths = Object.freeze({
    home: '<path d="m3 9 9-7 9 7v11a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9z"/>',
    fish: '<path d="M6.5 12c2-4 6-6 10-5l3-3 1 5a7 7 0 0 1 0 6l-1 5-3-3c-4 1-8-1-10-5z"/><path d="m6.5 12-4-4v8z"/><circle cx="16" cy="11" r=".7" fill="currentColor" stroke="none"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    book: '<path d="M12 7c-2.5-2-5.5-2.5-10-2v14c4.5-.5 7.5 0 10 2 2.5-2 5.5-2.5 10-2V5c-4.5-.5-7.5 0-10 2z"/><path d="M12 7v14"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    user: '<circle cx="12" cy="7.5" r="4"/><path d="M4 21c0-5 3-7 8-7s8 2 8 7"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7.5" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bag: '<path d="M4 8h16l-1 13H5z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="4" y="11" width="16" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9 2 2-3 3 2 2-3 3-2-2-3 3"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    tag: '<path d="M20 13 12 21 3 12V4h8z"/><circle cx="8" cy="8" r="1"/>',
    package: '<path d="m12 2 9 5-9 5-9-5z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 8.2 21 21M14.5 9.5 21 3M8.2 15.8l4.2-4.2"/>',
    truck: '<path d="M2 6h12v12H2zM14 10h4l4 4v4h-8z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    pencil: '<path d="m4 20 4-.7L20 7.3 16.7 4 4.7 16z"/><path d="m14.5 6.5 3 3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    pause: '<circle cx="12" cy="12" r="10"/><path d="M10 8v8M14 8v8"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7.5 7.5 0 0 1 13-2L20 12M4 12l1.5 3a7.5 7.5 0 0 0 13 0"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m7 12 3.5 3.5L17 9"/>',
    search: '<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.5 16.5 5 5"/>',
    leaf: '<path d="M20 4C9 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-5 12-16z"/><path d="M5 19c4-5 8-8 13-11"/>',
    waves: '<path d="M2 7c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 13c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 19c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v12h14V9M10 13h4"/>',
    utensils: '<path d="M4 2v8a3 3 0 0 0 6 0V2M7 2v20M16 13V2c4 2 4 8 0 11zM16 13v9"/>',
    heart: '<path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8z"/>',
    alert: '<path d="m12 2 10 18H2z"/><path d="M12 9v4M12 17h.01"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M5 5 19 19M19 5 5 19"/>'
  });
  function svgIcon(name) {
    const path = iconPaths[name];
    return path ? `<svg class="em-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>` : '';
  }
  function decorateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(holder => {
      const markup = svgIcon(holder.dataset.icon);
      if (markup) {
        holder.innerHTML = markup;
        holder.setAttribute('aria-hidden', 'true');
      }
    });
  }
  window.EntreMaresIcons = Object.freeze({ svg: svgIcon, decorate: decorateIcons });


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

  function currentSectionFile() {
    const path = window.location.pathname.toLowerCase();
    if (/\/conteudos\//.test(path)) return 'saberes.html';
    if (/\/locais\//.test(path)) return 'guia.html';
    if (path.endsWith('/pesquisas.html')) return 'saberes.html';
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
  // Atualiza a assinatura institucional também nas páginas internas e históricas.
  document.querySelectorAll('.brand small, .site-footer span').forEach(el => {
    el.textContent = el.textContent.replace('Saberes, Lugares e Produtos Caiçaras', 'Saberes, Povoados e Produtos Caiçaras');
  });
  removePublicSubmissionLinks();

  if (toggle && nav) {
    nav.id ||= 'main-navigation';
    toggle.setAttribute('aria-controls', nav.id);

    const setMenuState = isOpen => {
      nav.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      toggle.innerHTML = svgIcon(isOpen ? 'close' : 'menu');
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
    // Navegação pública única: conteúdos editoriais + frente de pescados.
    const prefix = prefixForNav();
    const sections = [
      ['index.html', 'Início', 'home'],
      ['pescados.html', 'Pescados', 'fish'],
      ['guia.html', 'Povoados', 'map'],
      ['saberes.html', 'Saberes', 'book']
    ];
    nav.replaceChildren(...sections.map(([file, label, iconName]) => {
      const link = document.createElement('a');
      link.href = `${prefix}${file}`;
      link.innerHTML = svgIcon(iconName) + '<span>' + label + '</span>';
      return link;
    }));

    const currentSession = session();
    const account = document.createElement('a');
    account.dataset.sessionNav = 'true';
    if (currentSession?.user?.role === 'pescador') {
      account.href = `${prefix}painel-pescador.html`;
      account.textContent = 'Meu painel';
    } else if (currentSession?.user?.curator) {
      account.href = `${prefix}curadoria-comercial.html`;
      account.textContent = 'Curadoria comercial';
    } else if (currentSession?.user?.role === 'cliente') {
      account.href = `${prefix}minha-conta.html`;
      account.textContent = 'Meus pedidos';
    } else {
      account.href = `${prefix}login.html`;
      account.textContent = 'Entrar';
    }
    const accountIcon = account.href.includes('painel-pescador') ? 'dashboard'
      : account.href.includes('curadoria') ? 'shield'
      : account.href.includes('minha-conta') ? 'bag' : 'user';
    account.innerHTML = svgIcon(accountIcon) + '<span>' + account.textContent + '</span>';
    nav.appendChild(account);
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
      <a href="${prefix}index.html" aria-label="Início">${svgIcon('home')}<small>Início</small></a>
      <a href="${prefix}pescados.html" aria-label="Pescados">${svgIcon('fish')}<small>Pescados</small></a>
      <a href="${prefix}guia.html" aria-label="Povoados">${svgIcon('map')}<small>Povoados</small></a>
      <a href="${prefix}${accountFile}" aria-label="${accountLabel}">${svgIcon(accountFile === 'painel-pescador.html' ? 'dashboard' : accountFile === 'minha-conta.html' ? 'bag' : 'user')}<small>${accountLabel}</small></a>
    `;
    document.body.appendChild(quickNav);
    markCurrentNavigation(quickNav);
  }

  decorateIcons();

  const needsVisualMedia = /\/conteudos\/(fauna-flora-piacaguera|historia-piacaguera)\.html$/.test(window.location.pathname);
  if (needsVisualMedia) {
    const script = document.createElement('script');
    script.src = '../js/visual-media.js';
    script.defer = true;
    document.body.appendChild(script);
  }
})();