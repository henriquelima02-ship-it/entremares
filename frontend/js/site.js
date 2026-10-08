(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

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

  if (nav) {
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

  const needsVisualMedia = /\/conteudos\/(fauna-flora-piacaguera|historia-piacaguera)\.html$/.test(window.location.pathname);
  if (needsVisualMedia) {
    const script = document.createElement('script');
    script.src = '../js/visual-media.js';
    script.defer = true;
    document.body.appendChild(script);
  }
})();
