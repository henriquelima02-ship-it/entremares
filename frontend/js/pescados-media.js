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
  // Referências externas enviadas pela equipe do projeto. Não são imagens da captura
  // nem comprovam identificação taxonômica do pescado vendido. Direitos reservados
  // às fontes indicadas; verificar autorização antes de copiar/hospedar localmente.
  // Em caso de falha de rede o cadastro apresenta um ícone neutro.
  const externalReferences = {
      "miraguaia": {
          "src": "https://museulinguaportuguesa.org.br/wp-content/uploads/2017/11/Miraguaia.jpg",
          "credit": "Museu da Língua Portuguesa",
          "alt": "Imagem de referência da miraguaia"
      },
      "sardinha": {
          "src": "https://fishcode.com.br/cdn/shop/files/sardinhaverdadeira-sardinellabrasilienses.png?v=1707159939",
          "credit": "Fishcode",
          "alt": "Ilustração de sardinha-verdadeira; referência para o pescado sardinha"
      },
      "caranguejo": {
          "src": "https://www.estadao.com.br/resizer/v2/I2C3UMXZQRDBNIPNMZKP4UKSPQ.jpg?auth=58769600b3a7476bb52233cfa26975cd249d75ac7628626320c12c73eb7bf4d6",
          "credit": "Estadão",
          "alt": "Imagem de referência de caranguejo; fotografia externa não vinculada ao lote anunciado"
      },
      "bacucu": {
          "src": "https://anamariabrogui.com.br/assets/uploads/receitas/fotos/usuario-2217-3a708c992d18d387d7103ab2224178d4.jpg",
          "credit": "Ana Maria Brogui",
          "alt": "Imagem culinária de referência enviada para bacucu; não representa necessariamente o produto in natura"
      },
      "baiacu": {
          "src": "https://s2-oglobo.glbimg.com/pWyyF3Cno3HbWIjSGMreovUsgsM=/0x105:984x570/888x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2024/J/j/Dm5qcyTyaqphK9po4Bag/baiacu.jpg",
          "credit": "O Globo",
          "alt": "Imagem de referência de baiacu; a espécie exata deve ser identificada antes da comercialização"
      },
      "cacao": {
          "src": "https://www.formosocarnes.com.br/uploads/produtos/cx-10-kg-posta-de-cacao1.jpg",
          "credit": "Formoso Carnes",
          "alt": "Postas de cação de referência, não foto do pescado inteiro"
      },
      "linguado": {
          "src": "https://www.infoescola.com/wp-content/uploads/2011/04/linguado_166190972.jpg",
          "credit": "InfoEscola",
          "alt": "Imagem de referência de linguado"
      },
      "paru": {
          "src": "https://fishcode.com.br/cdn/shop/products/Chaetodipterusfaber.png?v=1670677352",
          "credit": "Fishcode",
          "alt": "Ilustração de paru (Chaetodipterus faber)"
      },
      "cavalinha": {
          "src": "https://fishcode.com.br/cdn/shop/products/Scomberjaponicus.png?v=1670676641",
          "credit": "Fishcode",
          "alt": "Ilustração de cavalinha (Scomber japonicus)"
      },
      "salteira": {
          "src": "https://museulinguaportuguesa.org.br/wp-content/uploads/2017/11/Salteira.jpg",
          "credit": "Museu da Língua Portuguesa",
          "alt": "Imagem de referência de salteira"
      },
      "peixe-galo": {
          "src": "https://www.seabev.com.br/wp-content/uploads/2024/11/peixe-galo-6.jpg",
          "credit": "Seabev",
          "alt": "Fotografia de referência de peixe-galo"
      },
      "betara": {
          "src": "https://fishcode.com.br/cdn/shop/files/betara-peixepapaterra.png?v=1686834873",
          "credit": "Fishcode",
          "alt": "Ilustração de betara, também chamada papa-terra"
      },
      "prejereba": {
          "src": "https://fishcode.com.br/cdn/shop/products/prejereba.png?v=1670676772",
          "credit": "Fishcode",
          "alt": "Ilustração de prejereba"
      }
  };

  function forSpecies(species, category = '') {
    const name = normalize(species);
    const selected = externalReferences[name];
    if (selected) return {
      ...selected,
      source: selected.src,
      generic: false,
      illustrative: true,
      external: true
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
    if (name.includes('camarao') && name.includes('vivo')) return null; // Não mostrar camarão já preparado como se estivesse vivo.
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