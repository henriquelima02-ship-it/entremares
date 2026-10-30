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
      href: 'https://commons.wikimedia.org/wiki/File:Ocelot_%28Leopardus_pardalis%29-8.jpg'
    },
    'Mangue-vermelho': {
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/APA_de_Guaraque%C3%A7aba_-_fundo_da_ba%C3%ADa_de_Antonina_vista_mangue_e_serra_ibitiraquire_-_Marcos_Peretti_Maranh%C3%A3o(14).jpg?width=900',
      alt: 'Paisagem de manguezal no Rio do Meio, Baía de Antonina, Paraná',
      credit: 'Marcos Peretti Maranhão (2011) • CC BY-SA 4.0 • Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:APA_de_Guaraque%C3%A7aba_-_fundo_da_ba%C3%ADa_de_Antonina_vista_mangue_e_serra_ibitiraquire_-_Marcos_Peretti_Maranh%C3%A3o(14).jpg'
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
    fig.className = className + ' story-photo story-photo--species';
    fig.dataset.emMedia = 'true';
    fig.dataset.photoSource = item.href;
    const media = document.createElement('div');
    media.className = 'story-photo-media';
    const img = document.createElement('img');
    img.src = item.src;
    img.dataset.large = item.src;
    img.alt = item.alt + '. Imagem de referência, não registro fotográfico de Piaçaguera.';
    img.loading = 'lazy';
    img.decoding = 'async';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-photo-expand';
    button.setAttribute('data-photo-open', '');
    button.setAttribute('aria-label', 'Ampliar imagem de referência: ' + item.alt);
    button.textContent = 'Ampliar foto';
    media.append(img, button);
    const caption = document.createElement('figcaption');
    const description = document.createElement('span');
    description.className = 'story-photo-caption';
    const title = item === media['Mangue-vermelho'] ? 'Mangue-vermelho' : '';
    description.textContent = title === 'Mangue-vermelho'
      ? 'Manguezal da Baía de Antonina (PR), como referência do habitat; a fotografia não identifica individualmente mangue-vermelho em Piaçaguera.'
      : 'Imagem de referência da espécie — não registrada nesta fotografia em Piaçaguera.';
    const attribution = document.createElement('small');
    attribution.className = 'story-photo-attribution';
    const link = document.createElement('a');
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.credit;
    attribution.append('Foto: ', link, '. Crédito e licença completos no arquivo original.');
    caption.append(description, attribution);
    fig.append(media, caption);
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
