(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;

  const session = api.getSession();
  if (!session || session.user?.role !== 'cliente') {
    window.location.replace('./login.html?tipo=comprar');
    return;
  }

  const box = document.getElementById('customerOrders');
  const empty = document.getElementById('customerOrdersEmpty');
  const status = document.getElementById('customerStatus');
  const welcome = document.getElementById('customerWelcome');

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);

  const brl = value => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  function stockUnitLabel(unit, quantity) {
    if (unit === 'duzia') return Number(quantity) === 1 ? 'dúzia' : 'dúzias';
    if (unit === 'lote_20kg') return Number(quantity) === 1 ? 'lote de 20 kg' : 'lotes de 20 kg';
    return 'kg';
  }

  const labels = {
    recebido: 'Pedido recebido',
    confirmado: 'Confirmado pelo pescador',
    em_preparo: 'Em preparo',
    pronto_retirada: 'Pronto para retirada',
    em_rota: 'Em rota',
    concluido: 'Concluído',
    recusado: 'Recusado',
    cancelado: 'Cancelado'
  };

  function render(items) {
    empty.classList.toggle('hidden', items.length > 0);
    box.innerHTML = items.map(order => {
      const products = (order.items || []).map(item =>
        `<li><strong>${esc(item.species)}</strong> — ${Number(item.quantityKg || 0).toLocaleString('pt-BR')} ${esc(stockUnitLabel(item.saleUnit, item.quantityKg))}${item.cut?.label ? ` • ${esc(item.cut.label)}` : ''}</li>`
      ).join('');

      return `
        <article class="customer-order-card">
          <div class="customer-order-top">
            <div><span class="status ${esc(order.status)}">${esc(labels[order.status] || order.status)}</span><h2>${esc(order.code || 'Pedido')}</h2></div>
            <strong class="customer-order-total">${brl(order.total)}</strong>
          </div>
          <p class="customer-order-fisher">Pescador: <strong>${esc(order.fisherman?.displayName || 'Pescador cadastrado')}</strong>${order.fisherman?.community ? ` • ${esc(order.fisherman.community)}` : ''}</p>
          <ul class="customer-order-items">${products}</ul>
          <small>Pedido feito em ${new Date(order.createdAt).toLocaleString('pt-BR')}</small>
        </article>`;
    }).join('');
  }

  async function load() {
    welcome.textContent = `Olá, ${session.user?.name || 'cliente'}.`;
    try {
      const response = await api.customerOrders();
      status.className = `api-status ${response.demo ? 'demo' : 'online'}`;
      status.innerHTML = response.demo
        ? '<strong>Modo de teste.</strong> Pedidos desta conta ficam somente neste navegador.'
        : '<strong>Sistema online.</strong> Aqui aparecem os pedidos feitos enquanto você estava conectado.';
      render(response.items || []);
    } catch (error) {
      status.className = 'api-status demo';
      status.innerHTML = `<strong>Não foi possível carregar seus pedidos.</strong> ${esc(error.message)}`;
    }
  }

  document.getElementById('customerLogout').addEventListener('click', () => {
    api.logout();
    window.location.href = './login.html?tipo=comprar';
  });

  load();
})();