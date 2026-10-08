(function () {
  window.EntreMaresFishCatalog = [
    { name: 'Robalo', category: 'peixe', priceMin: 35, priceMax: 35, saleUnit: 'kg' },
    { name: 'Calafate', category: 'peixe', priceMin: 35, priceMax: 35, saleUnit: 'kg' },
    { name: 'Pescadinha', category: 'peixe', priceMin: 20, priceMax: 20, saleUnit: 'kg', note: 'Há também um registro informado como “12/kg limpa, pescadinha branca”; mantido separado para confirmação.' },
    { name: 'Pescadinha branca (limpa)', category: 'peixe', priceMin: 12, priceMax: 12, saleUnit: 'kg', note: 'Referência provisória a partir da anotação “12/kg limpa, pescadinha branca”. Confirmar nomenclatura e condição antes de usar.' },
    { name: 'Guiri', category: 'peixe', priceMin: 12, priceMax: 15, saleUnit: 'kg' },
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
    { name: 'Pregereia', category: 'peixe', priceMin: 50, priceMax: 50, saleUnit: 'kg', note: 'Nome local informado para peixe; manter a nomenclatura comunitária até confirmação taxonômica.' },
    { name: 'Cação', category: 'peixe', priceMin: 25, priceMax: 25, saleUnit: 'kg' },
    { name: 'Linguado', category: 'peixe', priceMin: 25, priceMax: 25, saleUnit: 'kg' },
    { name: 'Paru', category: 'peixe', priceMin: 15, priceMax: 15, saleUnit: 'kg' },
    { name: 'Misturinha', category: 'outro', priceMin: 12, priceMax: 12, saleUnit: 'kg', note: 'Denominação local informada; manter como categoria aberta.' },
    { name: 'Cavalinha', category: 'peixe', priceMin: 15, priceMax: 15, saleUnit: 'kg' },
    { name: 'Saltero', category: 'peixe', priceMin: 45, priceMax: 60, saleUnit: 'kg', note: 'Faixa aproximada informada: R$ 45 a R$ 60 por kg.' },
    { name: 'Peixe-galo', category: 'peixe', priceMin: 4.5, priceMax: 4.5, saleUnit: 'kg' },
    { name: 'Betara', category: 'peixe', priceMin: 5, priceMax: 5, saleUnit: 'kg' }
  ].map(item => ({
    ...item,
    approximate: true,
    source: 'referencia_comunitaria'
  }));
})();