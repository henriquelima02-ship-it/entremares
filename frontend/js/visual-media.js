(function () {
  const path = window.location.pathname;
  const media = {
    'Boto-cinza': {
      src: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Sotalia_guianensis_Guyane_fran%C3%A7aise_Amandine_Bordin_4.jpg',
      alt: 'Boto-cinza saltando sobre a água',
      credit: 'Amandine Bordin / GEPoG • Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Sotalia_guianensis_Guyane_fran%C3%A7aise_Amandine_Bordin_4.jpg'
    },
    'Guará': {
      src: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Scarlet_Ibis_%28Eudocimus_ruber%29_RWD.jpg',
      alt: 'Guará adulto com plumagem vermelha',
      credit: 'Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Scarlet_Ibis_(Eudocimus_ruber)_RWD.jpg'
    },
    'Jaguatirica': {
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Ocelot_%28Leopardus_pardalis%29-8.jpg/1280px-Ocelot_%28Leopardus_pardalis%29-8.jpg',
      alt: 'Jaguatirica sobre um tronco',
      credit: 'Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/Leopardus_pardalis'
    },
    'Mangue-vermelho': {
      src: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Rhizophora_mangle_%28prop_roots%29.jpg',
      alt: 'Raízes-escora do mangue-vermelho',
      credit: 'Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Rhizophora_mangle_(prop_roots).jpg'
    },
    'Gralha-azul': {
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cyanocorax_caeruleus.jpg',
      alt: 'Gralha-azul em ambiente arborizado',
      credit: 'Henri Bergius • Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Cyanocorax_caeruleus.jpg'
    },
    'Tiê-sangue': {
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ramphocelus_bresilius_%28aka%29.jpg',
      alt: 'Tiê-sangue com plumagem vermelha',
      credit: 'Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Ramphocelus_bresilius_(aka).jpg'
    }
  };

  function figure(item, className = 'species-photo') {
    const fig = document.createElement('figure');
    fig.className = className;
    fig.dataset.emMedia = 'true';
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.innerHTML = `Imagem de referência • <a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.credit}</a>`;
    fig.append(img, caption);
    return fig;
  }

  if (path.includes('fauna-flora-piacaguera.html')) {
    document.querySelectorAll('.species-card').forEach(card => {
      if (card.querySelector('[data-em-media]')) return;
      const title = card.querySelector('h3')?.textContent.trim() || '';
      const key = Object.keys(media).find(name => title.startsWith(name));
      if (key) card.prepend(figure(media[key]));
    });
  }

  if (path.includes('historia-piacaguera.html')) {
    const article = document.querySelector('.article-page');
    const back = article?.querySelector('.article-back');
    if (article && back && !article.querySelector('.history-visual')) {
      const item = {
        src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Porto_de_paranagua.png',
        alt: 'Representação artística do Porto de Paranaguá por Alfredo Andersen',
        credit: 'Alfredo Andersen • obra em domínio público • Wikimedia Commons',
        href: 'https://commons.wikimedia.org/wiki/File:Porto_de_paranagua.png'
      };
      back.insertAdjacentElement('afterend', figure(item, 'article-visual history-visual'));
    }
  }
})();
