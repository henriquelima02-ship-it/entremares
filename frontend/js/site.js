(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-main-nav]');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

  if (nav && !nav.querySelector('a[href$="pescados.html"]')) {
    const cadastro = nav.querySelector('a[href$="cadastro.html"]');
    const link = document.createElement('a');
    const prefix = cadastro?.getAttribute('href')?.startsWith('../') ? '../' : './';
    link.href = `${prefix}pescados.html`;
    link.textContent = 'Pescados';
    if (cadastro) nav.insertBefore(link, cadastro); else nav.appendChild(link);
  }

  const needsVisualMedia = /\/conteudos\/(fauna-flora-piacaguera|historia-piacaguera)\.html$/.test(window.location.pathname);
  if (needsVisualMedia) {
    const script = document.createElement('script');
    script.src = '../js/visual-media.js';
    script.defer = true;
    document.body.appendChild(script);
  }
})();
