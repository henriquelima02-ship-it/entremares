(function () {
  const api = window.EntreMaresAPI;
  const grid = document.getElementById('productGrid');
  if (!api || !grid) return;

  const search = document.getElementById('productSearch');
  const category = document.getElementById('categoryFilter');
  const empty = document.getElementById('marketEmpty');
  const marketMode = document.getElementById('marketMode');
  const dialog = document.getElementById('orderDialog');
  const form = document.getElementById('orderForm');
  const quantity = document.getElementById('orderQuantity');
  const cut = document.getElementById('orderCut');
  const shipping = document.getElementById('orderShipping');
  const shippingNote = document.getElementById('shippingNote');
  const total = document.getElementById('orderTotal');
  const totalDetail = document.getElementById('orderTotalDetail');
  const result = document.getElementById('orderResult');

  let products = [];
  let activeProduct = null;
  let shippingOptions = [];

  const brl = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
  const categoryIcon = value => ({ peixe: '🐟', crustaceo: '🦐', molusco: '🦪', outro: '🌊' })[value] || '🌊';

  function shippingTags(product) {
    const tags = [];
    if (product.shipping?.pickup) tags.push('Retirada');
    if (product.shipping?.communityDelivery) tags.push('Entrega comunitária');
    if (product.shipping?.collaborativeFreight) tags.push('Frete colaborativo');
    return tags.map(item => `<span class="mini-tag">${item}</span>`).join('');
  }

  function cutsText(product) {
    if (!product.cuts?.length) return 'Preparação a combinar';
    return product.cuts.map(item => item.label || item.id).join(' • ');
  }

  function draw() {
    const query = search.value.trim().toLowerCase();
    const selected = category.value;
    const visible = products.filter(product => {
      const matchSearch = !query || `${product.species} ${product.description || ''}`.toLowerCase().includes(query);
      const matchCategory = selected === 'all' || product.category === selected;
      return matchSearch && matchCategory;
    });

    grid.innerHTML = visible.map(product => `
      <article class="product-card">
        <div class="product-art product-art-${esc(product.category)}"><span>${categoryIcon(product.category)}</span><small>${esc(product.state || 'fresco')}</small></div>
        <div class="product-body">
          <div class="product-title-row"><div><span class="tag">${esc(product.category)}</span><h3>${esc(product.species)}</h3></div><strong class="price">${brl(product.pricePerKg)}<small>/kg</small></strong></div>
          <p>${esc(product.description || 'Pescado artesanal cadastrado na plataforma.')}</p>
          <div class="product-info"><span><strong>${Number(product.quantityKg || 0).toLocaleString('pt-BR')} kg</strong> disponíveis</span><span>${esc(product.fisherman?.displayName || 'Pescador cadastrado')}</span><span>${esc(product.fisherman?.community || '')}</span></div>
          <div class="cut-line"><strong>Cortes:</strong> ${esc(cutsText(product))}</div>
          <div class="mini-tags">${shippingTags(product)}</div>
          ${product.originNote ? `<small class="origin-note">${esc(product.originNote)}</small>` : ''}
          <button class="btn btn-primary btn-wide" type="button" data-order="${esc(product.id)}">Montar pedido</button>
        </div>
      </article>`).join('');

    empty.classList.toggle('hidden', visible.length > 0);
    grid.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => openOrder(button.dataset.order)));
  }

  async function load() {
    try {
      const response = await api.listProducts();
      products = response.items || [];
      marketMode.textContent = response.demo
        ? 'Vitrine demonstrativa: os itens abaixo são exemplos ou registros salvos neste navegador e não representam disponibilidade comercial real.'
        : 'Disponibilidade recebida do backend. Estoque e horário são confirmados após o pedido.';
      draw();
    } catch (error) {
      marketMode.textContent = `Não foi possível carregar a vitrine: ${error.message}`;
    }
  }

  function dialogOpen() {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  async function openOrder(id) {
    activeProduct = products.find(item => item.id === id);
    if (!activeProduct) return;
    result.classList.add('hidden');
    document.getElementById('orderProductId').value = id;
    document.getElementById('orderProductName').textContent = activeProduct.species;
    document.getElementById('orderProductMeta').textContent = `${activeProduct.fisherman?.displayName || 'Pescador cadastrado'} • ${activeProduct.fisherman?.community || 'comunidade caiçara'} • ${brl(activeProduct.pricePerKg)}/kg`;
    quantity.max = activeProduct.quantityKg;
    quantity.value = Math.min(1, Number(activeProduct.quantityKg || 1));
    cut.innerHTML = (activeProduct.cuts?.length ? activeProduct.cuts : [{ id: '', label: 'A combinar', extraPerKg: 0 }])
      .map(item => `<option value="${esc(item.id)}" data-extra="${Number(item.extraPerKg || 0)}">${esc(item.label)}${item.extraPerKg ? ` (+ ${brl(item.extraPerKg)}/kg)` : ''}</option>`).join('');
    await refreshShipping();
    calculateTotal();
    dialogOpen();
  }

  async function refreshShipping() {
    if (!activeProduct) return;
    try {
      const response = await api.shippingOptions(activeProduct.id, Number(quantity.value || 1));
      shippingOptions = response.options || [];
      shipping.innerHTML = shippingOptions.map(item => `<option value="${esc(item.id)}" data-fee="${Number(item.fee || 0)}">${esc(item.label)}${item.fee ? ` (+ ${brl(item.fee)})` : ''}</option>`).join('');
      updateShippingNote();
    } catch (error) {
      shipping.innerHTML = '<option value="">Indisponível</option>';
      shippingNote.textContent = error.message;
    }
  }

  function updateShippingNote() {
    const option = shippingOptions.find(item => item.id === shipping.value);
    shippingNote.textContent = option?.note || '';
    calculateTotal();
  }

  function calculateTotal() {
    if (!activeProduct) return;
    const kg = Math.max(0, Number(quantity.value || 0));
    const cutExtra = Number(cut.selectedOptions[0]?.dataset.extra || 0);
    const fee = Number(shipping.selectedOptions[0]?.dataset.fee || 0);
    const subtotal = (Number(activeProduct.pricePerKg) + cutExtra) * kg;
    total.textContent = brl(subtotal + fee);
    totalDetail.textContent = `${kg.toLocaleString('pt-BR')} kg • produto ${brl(subtotal)}${fee ? ` • logística ${brl(fee)}` : ' • sem taxa de retirada'}`;
  }

  search.addEventListener('input', draw);
  category.addEventListener('change', draw);
  quantity.addEventListener('change', async () => { await refreshShipping(); calculateTotal(); });
  quantity.addEventListener('input', calculateTotal);
  cut.addEventListener('change', calculateTotal);
  shipping.addEventListener('change', updateShippingNote);
  document.querySelector('[data-close-dialog]').addEventListener('click', closeDialog);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!activeProduct) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const response = await api.createOrder({
        customer: {
          name: document.getElementById('orderName').value.trim(),
          phone: document.getElementById('orderPhone').value.trim(),
          community: document.getElementById('orderCommunity').value.trim(),
          notes: document.getElementById('orderNotes').value.trim()
        },
        items: [{ productId: activeProduct.id, quantityKg: Number(quantity.value), cutId: cut.value }],
        shippingType: shipping.value
      });
      result.innerHTML = `<strong>Pedido registrado.</strong> Código: ${esc(response.order?.code || response.order?.id)}. ${esc(response.message || '')}`;
      result.classList.remove('hidden');
      if (!response.demo) await load();
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível registrar.</strong> ${esc(error.message)}`;
      result.classList.remove('hidden');
    } finally {
      submit.disabled = false;
    }
  });

  load();
})();
