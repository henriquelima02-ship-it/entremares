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
  function forSpecies(species, category = '') {
    const name = normalize(species);
    if (name.includes('robalo')) return image('robalo', 'Ilustração digital de referência de robalo');
    if (name.includes('tainha')) return image('tainha', 'Ilustração digital de referência de tainha');
    if (name.includes('pescadinha')) return image('pescadinha', 'Ilustração digital de referência de pescadinha');
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