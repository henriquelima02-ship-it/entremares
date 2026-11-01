(function () {
  const prefix = './assets/pescados/';
  const normalize = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const files = {
    robalo:'robalo.webp', tainha:'tainha.webp', pescadinha:'pescadinha.webp',
    peixe:'peixe.webp', camarao:'camarao.webp', ostra:'ostra.webp', siri:'siri.webp',
    limpo:'corte-limpo.webp', file:'corte-file.webp', posta:'corte-posta.webp'
  };
  function image(file, description, generic = false) {
    return { src: prefix + files[file], alt: description, generic };
  }
  // Acervo local produzido a partir dos links enviados pelo projeto.
  // As imagens retratam referências de espécie/preparo, nunca o lote anunciado.
  // Consulte docs/RELATORIO_IMPORTACAO_PESCADOS.json para origens e falhas.
  // Fontes e direitos de terceiros continuam atribuídos aos respectivos titulares.
  const referenceImages = {
    "calafate": {
      "file": null,
      "credit": "Wikimedia Commons / Acquario di Genova",
      "source": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Umbrina_cirrosa_Acquario_di_Genova.jpg",
      "alt": "Umbrina cirrosa fotografada no Aquário de Gênova; associação ao nome local precisa ser confirmada.",
      "local": false
    },
    "bagre": {
      "file": "bagre.webp",
      "credit": "Miniatura Google (procedência original não identificada)",
      "source": null,
      "alt": "Imagem de bagre indicada pela equipe; procedência original não identificada.",
      "local": true
    },
    "miraguaia": {
      "file": "miraguaia.webp",
      "credit": "Museu da Língua Portuguesa",
      "source": "https://museulinguaportuguesa.org.br/wp-content/uploads/2017/11/Miraguaia.jpg",
      "alt": "Imagem de referência de miraguaia, não o lote oferecido.",
      "local": true
    },
    "sardinha": {
      "file": "sardinha.webp",
      "credit": "Fishcode",
      "source": "https://fishcode.com.br/cdn/shop/files/sardinhaverdadeira-sardinellabrasilienses.png?v=1707159939",
      "alt": "Ilustração de sardinha-verdadeira como referência; o lote anunciado pode variar.",
      "local": true
    },
    "camarao descascado": {
      "file": "camarao-descascado.webp",
      "credit": "Swift",
      "source": null,
      "alt": "Foto comercial de camarão pré-cozido e descascado; não é camarão vivo.",
      "local": true
    },
    "caranguejo": {
      "file": "caranguejo.webp",
      "credit": "Estadão",
      "source": "https://www.estadao.com.br/resizer/v2/I2C3UMXZQRDBNIPNMZKP4UKSPQ.jpg?auth=58769600b3a7476bb52233cfa26975cd249d75ac7628626320c12c73eb7bf4d6",
      "alt": "Imagem de referência de caranguejo, não lote anunciado.",
      "local": true
    },
    "bacucu": {
      "file": "bacucu.webp",
      "credit": "Ana Maria Brogui",
      "source": "https://anamariabrogui.com.br/assets/uploads/receitas/fotos/usuario-2217-3a708c992d18d387d7103ab2224178d4.jpg",
      "alt": "Foto de preparo culinário referenciada para bacucu, não necessariamente produto in natura.",
      "local": true
    },
    "baiacu": {
      "file": "baiacu.webp",
      "credit": "O Globo",
      "source": "https://s2-oglobo.glbimg.com/pWyyF3Cno3HbWIjSGMreovUsgsM=/0x105:984x570/888x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2024/J/j/Dm5qcyTyaqphK9po4Bag/baiacu.jpg",
      "alt": "Imagem de baiacu; identificação exata necessária antes da venda.",
      "local": true
    },
    "cacao": {
      "file": "cacao.webp",
      "credit": "Formoso Carnes",
      "source": "https://www.formosocarnes.com.br/uploads/produtos/cx-10-kg-posta-de-cacao1.jpg",
      "alt": "Postas de cação; não representa o animal inteiro.",
      "local": true
    },
    "linguado": {
      "file": "linguado.webp",
      "credit": "InfoEscola",
      "source": "https://www.infoescola.com/wp-content/uploads/2011/04/linguado_166190972.jpg",
      "alt": "Imagem de referência de linguado.",
      "local": true
    },
    "paru": {
      "file": "paru.webp",
      "credit": "Fishcode",
      "source": "https://fishcode.com.br/cdn/shop/products/Chaetodipterusfaber.png?v=1670677352",
      "alt": "Ilustração de paru; não registro da pesca local.",
      "local": true
    },
    "misturinha": {
      "file": "misturinha.webp",
      "credit": "Facebook - foto indicada pelo usuário",
      "source": null,
      "alt": "Referência de peixes variados; misturinha não é espécie única.",
      "local": true
    },
    "cavalinha": {
      "file": "cavalinha.webp",
      "credit": "Fishcode",
      "source": "https://fishcode.com.br/cdn/shop/products/Scomberjaponicus.png?v=1670676641",
      "alt": "Ilustração de cavalinha; não o lote anunciado.",
      "local": true
    },
    "salteira": {
      "file": "salteira.webp",
      "credit": "Museu da Língua Portuguesa",
      "source": "https://museulinguaportuguesa.org.br/wp-content/uploads/2017/11/Salteira.jpg",
      "alt": "Imagem de salteira como referência.",
      "local": true
    },
    "peixe-galo": {
      "file": "peixe-galo.webp",
      "credit": "Seabev",
      "source": "https://www.seabev.com.br/wp-content/uploads/2024/11/peixe-galo-6.jpg",
      "alt": "Fotografia de referência do peixe-galo.",
      "local": true
    },
    "betara": {
      "file": "betara.webp",
      "credit": "Fishcode",
      "source": "https://fishcode.com.br/cdn/shop/files/betara-peixepapaterra.png?v=1686834873",
      "alt": "Ilustração de betara/papa-terra.",
      "local": true
    },
    "prejereba": {
      "file": "prejereba.webp",
      "credit": "Fishcode",
      "source": "https://fishcode.com.br/cdn/shop/products/prejereba.png?v=1670676772",
      "alt": "Ilustração de prejereba.",
      "local": true
    },
    "camarao pre-cozido e descascado": {
      "file": "camarao-descascado.webp",
      "credit": "Swift",
      "source": null,
      "alt": "Foto comercial de camarão pré-cozido e descascado; não é camarão vivo.",
      "local": true
    }
  };

  // Referência compartilhada para bagre e guiri, conforme orientação da equipe.
  // Não afirmar identificação taxonômica a partir dessa miniatura.
  referenceImages['bagre-guiri'] = {
    ...referenceImages.bagre,
    alt: 'Imagem de referência compartilhada de bagre e bagre-guiri; fotografia não é do anúncio.'
  };
  referenceImages.guiri = referenceImages['bagre-guiri'];
  // Variações de escrita: a identidade biológica não deve ser inferida pela foto.
  for (const alias of ['bagre-goiri', 'bagre-guri', 'bagre guri', 'bagre goiri', 'bagre guiri', 'goiri']) {
    referenceImages[alias] = referenceImages['bagre-guiri'];
  }

  function forSpecies(species, category = '') {
    const name = normalize(species);
    const selected = referenceImages[name];
    if (selected) return {
      src: selected.local ? prefix + 'referencias/' + selected.file : selected.source,
      source: selected.source || '',
      credit: selected.credit,
      alt: selected.alt,
      generic: false,
      illustrative: true,
      local: Boolean(selected.local),
      external: !selected.local
    };
    // Ilustrações de identificação taxonômica, não fotos de pescado local.
    // Fontes em domínio público: NOAA e bibliografia científica histórica / Wikimedia Commons.
    if (name.includes('prejereba') || name.includes('pregereia') || name.includes('pregereva')) {
      return {
        src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lobotes_surinamensis.jpg?width=400',
        alt: 'Ilustração científica histórica de prejereba (Lobotes surinamensis); não é foto de Piaçaguera',
        source: 'https://commons.wikimedia.org/wiki/File:Lobotes_surinamensis.jpg',
        credit: 'NOAA / Wikimedia Commons, domínio público',
        generic: false,
        illustrative: true
      };
    }
    if (name.includes('miraguaia')) {
      return {
        src: 'https://commons.wikimedia.org/wiki/Special:FilePath/FMIB_33621_Pogonias_Cromis.jpeg?width=400',
        alt: 'Desenho científico histórico de miraguaia (Pogonias cromis); não é foto da pesca local',
        source: 'https://commons.wikimedia.org/wiki/File:FMIB_33621_Pogonias_Cromis.jpeg',
        credit: 'William Welsh / Wikimedia Commons, domínio público',
        generic: false,
        illustrative: true
      };
    }
    if (name.includes('robalo')) return image('robalo', 'Ilustração digital de referência de robalo');
    if (name.includes('tainha')) return image('tainha', 'Ilustração digital de referência de tainha');
    if (name.includes('pescadinha')) return image('pescadinha', 'Ilustração digital de referência de pescadinha');
    if (name.includes('camarao') && name.includes('vivo')) return {
      ...image('camarao', 'Ilustração de camarão inteiro como referência visual, não é uma fotografia de camarão vivo.'),
      credit: 'Ilustração do acervo EntreMarés',
      source: '',
      local: true,
      external: false,
      illustrative: true
    };
    if (name.includes('camarao')) return image('camarao', 'Ilustração digital de referência de camarões');
    if (/\bsiri\b/.test(name)) return image('siri', 'Ilustração digital de referência de siri');
    if (name.includes('ostra')) return image('ostra', 'Ilustração digital de referência de ostras');
    if (category === 'peixe') return image('peixe', 'Ilustração genérica de peixe, não da espécie anunciada', true);
    return null;
  }
  function forCut(cutId, category) {
    if (category !== 'peixe') return null;
    const key = ({inteiro:'robalo',limpo:'limpo',eviscerado:'limpo',file:'file',posta:'posta'})[cutId];
    return key ? image(key, 'Exemplo ilustrativo de preparo de robalo: ' + cutId) : null;
  }
  window.EntreMaresFishMedia = {forSpecies, forCut};
})();