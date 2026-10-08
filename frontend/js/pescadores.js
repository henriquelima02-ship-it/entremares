(function () {
  const api = window.EntreMaresAPI;
  const grid = document.getElementById('fisherGrid');
  if (!api || !grid) return;
  const mode = document.getElementById('fisherMode');
  const empty = document.getElementById('fisherEmpty');

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[char]);

  function tags(shipping = {}) {
    const items = [];
    if (shipping.pickup) items.push('Retirada');
    if (shipping.communityDelivery) items.push('Entrega comunitária');
    if (shipping.collaborativeFreight) items.push('Frete colaborativo');
    return items.map(item => `<span class="mini-tag">${item}</span>`).join('');
  }

  async function load() {
    try {
      const response = await api.listFishermen();
      const items = response.items || [];
      mode.className = `api-status ${response.demo ? 'demo' : 'online'}`;
      mode.innerHTML = response.demo
        ? '<strong>Modo demonstrativo.</strong> Os perfis abaixo são exemplos ou registros locais deste navegador.'
        : '<strong>Backend conectado.</strong> Exibindo somente perfis publicados.';
      grid.innerHTML = items.map(item => `
        <article class="product-card">
          <div class="product-art"><span>🎣</span><small>pescador artesanal</small></div>
          <div class="product-body">
            <div><span class="tag">${esc(item.community || 'comunidade caiçara')}</span><h3>${esc(item.displayName || 'Pescador')}</h3></div>
            <p>${esc(item.bio || 'Perfil cadastrado na frente Camarão na Tarrafa.')}</p>
            <div class="product-info"><span><strong>Ponto de retirada</strong></span><span>${esc(item.pickupReference || 'A combinar')}</span></div>
            <div class="mini-tags">${tags(item.shipping)}</div>
            ${item.whatsapp ? `<a class="btn whatsapp-btn btn-wide" href="https://wa.me/${esc(item.whatsapp)}?text=${encodeURIComponent('Olá! Vi seu perfil no EntreMarés / Camarão na Tarrafa. Quais pescados estão disponíveis hoje?')}" target="_blank" rel="noopener noreferrer">Perguntar no WhatsApp</a>` : ''}
            <a class="btn btn-secondary btn-wide" href="./pescados.html">Ver pescados disponíveis</a>
          </div>
        </article>`).join('');
      empty.classList.toggle('hidden', items.length > 0);
    } catch (error) {
      mode.className = 'api-status demo';
      mode.textContent = `Não foi possível carregar os perfis: ${error.message}`;
    }
  }

  load();
})();
