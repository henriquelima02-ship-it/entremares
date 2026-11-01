(function () {
  window.EntreMaresFishCatalog = [
    { name: 'Robalo', category: 'peixe', priceMin: 35, priceMax: 35, saleUnit: 'kg' },
    { name: 'Calafate', category: 'peixe', priceMin: 35, priceMax: 35, saleUnit: 'kg' },
    { name: 'Pescadinha', category: 'peixe', priceMin: 12, priceMax: 20, saleUnit: 'kg', note: 'Faixa aproximada informada: R$ 12 a R$ 20 por kg.' },
    { name: 'Bagre-guiri', aliases: ['Guiri', 'Bagre-guri', 'Bagre guiri'], category: 'peixe', priceMin: 12, priceMax: 15, saleUnit: 'kg', note: 'Guiri é nome usado na pesca regional; a identificação exata da espécie deve ser confirmada com o pescador.' },
    { name: 'Miraguaia', category: 'peixe', priceMin: 8, priceMax: 8, saleUnit: 'kg' },
    { name: 'Tainha', category: 'peixe', priceMin: 10, priceMax: 10, saleUnit: 'kg' },
    { name: 'Sardinha', category: 'peixe', priceMin: null, priceMax: null, saleUnit: 'kg', note: 'Preço ainda não informado.' },
    { name: 'Camarão vivo', category: 'crustaceo', priceMin: 10, priceMax: 10, saleUnit: 'duzia' },
    { name: 'Siri — só carne', category: 'crustaceo', priceMin: 80, priceMax: 80, saleUnit: 'kg', note: 'Valor informado para carne de siri.' },
    { name: 'Caranguejo', category: 'crustaceo', priceMin: 30, priceMax: 30, saleUnit: 'kg' },
    { name: 'Ostra', category: 'molusco', priceMin: 135, priceMax: 135, saleUnit: 'lote_20kg', note: 'Referência informada como R$ 135 a cada 20 kg.' },
    { name: 'Bacucu', category: 'molusco', priceMin: 70, priceMax: 70, saleUnit: 'kg' },
    { name: 'Bagre', category: 'peixe', priceMin: 4, priceMax: 4, saleUnit: 'kg' },
    { name: 'Baiacu', category: 'peixe', priceMin: 20, priceMax: 20, saleUnit: 'kg' },
    { name: 'Prejereba', aliases: ['Pregereia', 'Pregereva', 'Prejereba'], category: 'peixe', priceMin: 50, priceMax: 50, saleUnit: 'kg', note: 'Prejereba é a grafia documentada para a espécie; as grafias do cadastro anterior foram mantidas para busca, sem confirmação de uso comunitário.' },
    { name: 'Cação', category: 'peixe', priceMin: 25, priceMax: 25, saleUnit: 'kg' },
    { name: 'Linguado', category: 'peixe', priceMin: 25, priceMax: 25, saleUnit: 'kg' },
    { name: 'Paru', category: 'peixe', priceMin: 15, priceMax: 15, saleUnit: 'kg' },
    { name: 'Misturinha', category: 'outro', priceMin: 12, priceMax: 12, saleUnit: 'kg', note: 'Denominação local informada; manter como categoria aberta.' },
    { name: 'Cavalinha', category: 'peixe', priceMin: 15, priceMax: 15, saleUnit: 'kg' },
    { name: 'Salteira', aliases: ['Saltero', 'Salteiro', 'Guaivira'], category: 'peixe', priceMin: 45, priceMax: 60, saleUnit: 'kg', note: 'Salteira é a grafia documentada; saltero foi preservado como termo do cadastro anterior. Faixa aproximada informada: R$ 45 a R$ 60 por kg.' },
    { name: 'Peixe-galo', category: 'peixe', priceMin: 4.5, priceMax: 4.5, saleUnit: 'kg' },
    { name: 'Betara', category: 'peixe', priceMin: 5, priceMax: 5, saleUnit: 'kg' }
  ].map(item => ({
    ...item,
    approximate: true,
    source: 'referencia_comunitaria',
    aliases: Array.isArray(item.aliases) ? [...new Set(item.aliases)] : []
  }));
})();