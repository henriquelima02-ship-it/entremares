(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');

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

  function removePublicSubmissionLinks() {
    document.querySelectorAll('a[href$="contribuir.html"]').forEach(link => link.remove());
    document.querySelectorAll('.site-footer a[href$="curadoria.html"]').forEach(link => link.remove());
  }

  removePublicSubmissionLinks();

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
    toggle.setAttribute('aria-expanded', 'false');
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
      } else {
        account.href = `${prefixForNav()}login.html`;
        account.textContent = 'Entrar';
      }
      nav.appendChild(account);
    }
  }

  const publicPage = !/curadoria|painel-pescador/.test(window.location.pathname);
  if (publicPage && !document.querySelector('.mobile-quick-nav')) {
    const prefix = prefixForNav();
    const currentSession = session();
    const accountFile = currentSession?.user?.role === 'pescador' ? 'painel-pescador.html' : 'login.html';
    const accountLabel = currentSession?.user?.role === 'pescador' ? 'Painel' : 'Entrar';
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
  }

  const needsVisualMedia = /\/conteudos\/(fauna-flora-piacaguera|historia-piacaguera)\.html$/.test(window.location.pathname);
  if (needsVisualMedia) {
    const script = document.createElement('script');
    script.src = '../js/visual-media.js';
    script.defer = true;
    document.body.appendChild(script);
  }
})();