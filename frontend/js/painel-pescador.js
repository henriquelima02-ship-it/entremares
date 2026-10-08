(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;

  const session = api.getSession();
  if (!session || session.user?.role !== 'pescador') {
    window.location.replace('./login.html?tipo=vender');
    return;
  }

  const state = { dashboard: null, editing: null };
  const $ = id => document.getElementById(id);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);

  const brl = value => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const statusLabel = value => ({
    published: 'publicado',
    expired: 'prazo vencido',
    pending_review: 'em revisão',
    paused: 'pausado',
    rejected: 'ajustes solicitados',
    recebido: 'recebido',
    confirmado: 'confirmado',
    em_preparo: 'em preparo',
    pronto_retirada: 'pronto',
    em_rota: 'em rota',
    concluido: 'concluído',
    recusado: 'recusado',
    cancelado: 'cancelado'
  })[value] || value || '—';

  const cutLabels = {
    inteiro: 'Inteiro',
    limpo: 'Limpo',
    eviscerado: 'Eviscerado',
    file: 'Filé',
    posta: 'Posta',
    descascado: 'Descascado',
    sem_cabeca: 'Sem cabeça'
  };

  const catalog = Array.isArray(window.EntreMaresFishCatalog) ? window.EntreMaresFishCatalog : [];

  function saleUnitLabel(unit) {
    if (unit === 'duzia') return 'dúzia';
    if (unit === 'lote_20kg') return 'lote de 20 kg';
    return 'kg';
  }

  function saleUnitStockLabel(unit, quantity) {
    if (unit === 'duzia') return Number(quantity) === 1 ? 'dúzia' : 'dúzias';
    if (unit === 'lote_20kg') return Number(quantity) === 1 ? 'lote de 20 kg' : 'lotes de 20 kg';
    return 'kg';
  }

  function updateSaleUnitFields() {
    const unit = $('editSaleUnit').value || 'kg';
    const quantityLabel = unit === 'duzia'
      ? 'Quantidade de dúzias *'
      : unit === 'lote_20kg'
        ? 'Quantidade de lotes de 20 kg *'
        : 'Quantidade (kg) *';
    const priceLabel = unit === 'duzia'
      ? 'Preço por dúzia (R$) *'
      : unit === 'lote_20kg'
        ? 'Preço por lote de 20 kg (R$) *'
        : 'Preço por kg (R$) *';

    $('editQuantityLabel').textContent = quantityLabel;
    $('editPriceLabel').textContent = priceLabel;
    $('editQuantity').step = unit === 'kg' ? '0.1' : '1';
  }

  function presetPriceText(item) {
    if (item.priceMin == null) return 'Preço ainda não informado.';
    const suffix = saleUnitLabel(item.saleUnit);
    if (Number(item.priceMin) === Number(item.priceMax)) return `${brl(item.priceMin)} por ${suffix}`;
    return `${brl(item.priceMin)} a ${brl(item.priceMax)} por ${suffix}`;
  }

  function populatePresetCatalog() {
    const select = $('fishPreset');
    if (!select) return;
    catalog.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${item.name} — ${presetPriceText(item)}`;
      select.appendChild(option);
    });
  }

  function applyPreset(index) {
    const item = catalog[Number(index)];
    const box = $('presetReference');
    if (!item) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    $('editSpecies').value = item.name;
    $('editCategory').value = item.category || 'outro';
    $('editSaleUnit').value = item.saleUnit || 'kg';
    updateSaleUnitFields();

    if (item.priceMin != null && Number(item.priceMin) === Number(item.priceMax)) {
      $('editPrice').value = Number(item.priceMin);
    } else {
      $('editPrice').value = '';
    }

    const rangeHelp = item.priceMin != null && Number(item.priceMin) !== Number(item.priceMax)
      ? '<strong>Faixa de referência:</strong> escolha o preço de hoje dentro ou fora dessa faixa conforme a venda real.'
      : '<strong>Referência aproximada:</strong> confirme o preço de hoje antes de salvar.';

    box.innerHTML = `${rangeHelp}<br>${esc(presetPriceText(item))}${item.note ? `<br><small>${esc(item.note)}</small>` : ''}`;
    box.classList.remove('hidden');
  }

  function effectiveStatus(product) {
    if (product.status === 'published' && product.expired) return 'expired';
    return product.status || 'pending_review';
  }

  function remainingText(product) {
    if (product.status !== 'published') return '';
    if (product.expired) return 'Prazo encerrado — renove para voltar à vitrine';
    if (!product.expiresAt) return `Disponível por ${Number(product.availabilityHours || 36)}h`;

    const ms = Date.parse(product.expiresAt) - Date.now();
    if (ms <= 0) return 'Prazo encerrado — renove para voltar à vitrine';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.max(0, Math.floor((ms % 3600000) / 60000));
    return hours >= 1
      ? `Sai da vitrine em aproximadamente ${hours}h${minutes ? ` ${minutes}min` : ''}`
      : `Sai da vitrine em aproximadamente ${minutes} min`;
  }

  function setStatusBadge(element, status) {
    element.className = `status ${status || 'pending'}`;
    element.textContent = statusLabel(status);
  }

  function fillProfile(fisherman) {
    $('profileName').value = fisherman.displayName || '';
    $('profileCommunity').value = fisherman.community || '';
    $('profilePickup').value = fisherman.pickupReference || '';
    $('profileBio').value = fisherman.bio || '';
    $('profileWhatsappPublic').checked = fisherman.whatsappPublic !== false;
    $('profilePickupEnabled').checked = Boolean(fisherman.shipping?.pickup);
    $('profileDeliveryEnabled').checked = Boolean(fisherman.shipping?.communityDelivery);
    $('profileFreightEnabled').checked = Boolean(fisherman.shipping?.collaborativeFreight);
    $('profileDeliveryFee').value = Number(fisherman.shipping?.deliveryFee || 0);
    $('profileFreightFee').value = Number(fisherman.shipping?.collaborativeFee || 0);
    $('profileShippingNotes').value = fisherman.shipping?.notes || '';
    setStatusBadge($('profileStatus'), fisherman.status);
  }

  function renderProducts(products) {
    const box = $('myProducts');
    $('productsEmpty').classList.toggle('hidden', products.length > 0);

    box.innerHTML = products.map(product => {
      const cuts = product.cuts?.length
        ? product.cuts.map(cut => cut.label || cutLabels[cut.id] || cut.id).join(' • ')
        : 'A combinar';

      const status = effectiveStatus(product);
      const remaining = remainingText(product);
      const canRenew = status === 'expired' || product.status === 'paused' || product.status === 'published';

      return `
        <article class="dashboard-item ${status === 'expired' ? 'expired-product' : ''}">
          <div class="dashboard-item-main">
            <div class="dashboard-item-title">
              <div><span class="status ${esc(status)}">${esc(statusLabel(status))}</span><h3>${esc(product.species)}</h3></div>
              <strong>${brl(product.pricePerKg)}<small>/${esc(saleUnitLabel(product.saleUnit))}</small></strong>
            </div>

            ${remaining ? `<div class="dashboard-availability">⏱ ${esc(remaining)}</div>` : ''}
            <p>${esc(product.description || 'Sem descrição pública.')}</p>

            <div class="dashboard-item-meta">
              <span><strong>${Number(product.quantityKg || 0).toLocaleString('pt-BR')} ${esc(saleUnitStockLabel(product.saleUnit, product.quantityKg))}</strong> em estoque</span>
              <span>${esc(product.state || 'fresco')}</span>
              <span>Prazo: ${Number(product.availabilityHours || 36)}h</span>
              <span>Cortes: ${esc(cuts)}</span>
            </div>

            ${product.reviewNote ? `<div class="review-note"><strong>Curadoria:</strong> ${esc(product.reviewNote)}</div>` : ''}
          </div>

          <div class="dashboard-item-actions">
            <button class="btn btn-secondary" type="button" data-edit-product="${esc(product.id)}">Editar</button>
            ${canRenew
              ? `<button class="btn btn-primary" type="button" data-product-action="renew" data-product-id="${esc(product.id)}">Renovar ${Number(product.availabilityHours || 36)}h</button>`
              : ''}
            ${product.status === 'published'
              ? `<button class="btn btn-secondary" type="button" data-product-action="pause" data-product-id="${esc(product.id)}">Pausar</button>`
              : product.status === 'paused'
                ? ''
                : product.status === 'rejected'
                  ? `<button class="btn btn-primary" type="button" data-product-action="submit" data-product-id="${esc(product.id)}">Enviar para revisão</button>`
                  : ''}
          </div>
        </article>`;
    }).join('');

    box.querySelectorAll('[data-edit-product]').forEach(button => {
      button.addEventListener('click', () => openProductEditor(button.dataset.editProduct));
    });

    box.querySelectorAll('[data-product-action]').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        const original = button.textContent;
        button.textContent = 'Salvando...';
        try {
          await api.setProductStatus(button.dataset.productId, button.dataset.productAction);
          await load();
        } catch (error) {
          window.alert(error.message);
        } finally {
          button.disabled = false;
          button.textContent = original;
        }
      });
    });
  }

  function orderProgress(status) {
    const steps = ['recebido', 'confirmado', 'em_preparo', 'pronto_retirada', 'em_rota', 'concluido'];
    const index = steps.indexOf(status);
    if (['recusado', 'cancelado'].includes(status)) return 0;
    return Math.max(1, index + 1);
  }

  function renderOrders(orders) {
    const box = $('myOrders');
    $('ordersEmpty').classList.toggle('hidden', orders.length > 0);

    box.innerHTML = orders.map(order => {
      const items = (order.items || [])
        .map(item => `${item.quantityKg} ${saleUnitStockLabel(item.saleUnit, item.quantityKg)} de ${item.species}${item.cut?.label ? ` • ${item.cut.label}` : ''}`)
        .join('<br>');

      return `
        <article class="dashboard-item order-item-card">
          <div class="dashboard-item-main">
            <div class="dashboard-item-title">
              <div><span class="status ${esc(order.status)}">${esc(statusLabel(order.status))}</span><h3>${esc(order.code || order.id)}</h3></div>
              <strong>${brl(order.total)}</strong>
            </div>

            <div class="order-customer">
              <span><strong>${esc(order.customer?.name || 'Cliente')}</strong></span>
              <span>${esc(order.customer?.phone || '')}</span>
              <span>${esc(order.customer?.community || '')}</span>
            </div>

            <p>${items}</p>
            ${order.customer?.notes ? `<div class="review-note"><strong>Observação:</strong> ${esc(order.customer.notes)}</div>` : ''}

            <div class="order-progress" aria-label="Andamento do pedido">
              ${Array.from({ length: 6 }, (_, i) => `<i class="${i < orderProgress(order.status) ? 'active' : ''}"></i>`).join('')}
            </div>
          </div>

          <div class="dashboard-item-actions order-actions">
            <label class="select-box"><span>Atualizar status</span>
              <select data-order-status="${esc(order.id)}">
                ${[
                  ['recebido','Recebido'],
                  ['confirmado','Confirmado'],
                  ['em_preparo','Em preparo'],
                  ['pronto_retirada','Pronto para retirada'],
                  ['em_rota','Em rota'],
                  ['concluido','Concluído'],
                  ['recusado','Recusado']
                ].map(([value,label]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`).join('')}
              </select>
            </label>
            <button class="btn btn-primary" type="button" data-save-order="${esc(order.id)}">Salvar status</button>
          </div>
        </article>`;
    }).join('');

    box.querySelectorAll('[data-save-order]').forEach(button => {
      button.addEventListener('click', async () => {
        const select = box.querySelector(`[data-order-status="${CSS.escape(button.dataset.saveOrder)}"]`);
        button.disabled = true;
        try {
          await api.setOrderStatus(button.dataset.saveOrder, select.value);
          await load();
        } catch (error) {
          window.alert(error.message);
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  function shippingPayload(prefix = 'edit') {
    return {
      pickup: $(prefix === 'edit' ? 'editShipPickup' : 'profilePickupEnabled').checked,
      communityDelivery: $(prefix === 'edit' ? 'editShipDelivery' : 'profileDeliveryEnabled').checked,
      collaborativeFreight: $(prefix === 'edit' ? 'editShipFreight' : 'profileFreightEnabled').checked,
      deliveryFee: Number($(prefix === 'edit' ? 'editDeliveryFee' : 'profileDeliveryFee').value || 0),
      collaborativeFee: Number($(prefix === 'edit' ? 'editFreightFee' : 'profileFreightFee').value || 0),
      notes: $(prefix === 'edit' ? 'editShippingNotes' : 'profileShippingNotes').value.trim()
    };
  }

  function selectedCuts() {
    return Array.from(document.querySelectorAll('[data-edit-cut]:checked')).map(input => ({
      id: input.dataset.editCut,
      label: cutLabels[input.dataset.editCut],
      extraPerKg: Number(document.querySelector(`[data-edit-extra="${input.dataset.editCut}"]`).value || 0)
    }));
  }

  function clearEditor() {
    $('productForm').reset();
    $('editProductId').value = '';
    $('productEditorTitle').textContent = 'Novo pescado';
    $('fishPreset').value = '';
    $('presetReference').classList.add('hidden');
    $('presetReference').innerHTML = '';
    $('editSaleUnit').value = 'kg';
    updateSaleUnitFields();
    $('editAvailabilityHours').value = '36';
    $('editShipPickup').checked = Boolean(state.dashboard?.fisherman?.shipping?.pickup ?? true);
    $('editShipDelivery').checked = Boolean(state.dashboard?.fisherman?.shipping?.communityDelivery);
    $('editShipFreight').checked = Boolean(state.dashboard?.fisherman?.shipping?.collaborativeFreight);
    $('editDeliveryFee').value = Number(state.dashboard?.fisherman?.shipping?.deliveryFee || 0);
    $('editFreightFee').value = Number(state.dashboard?.fisherman?.shipping?.collaborativeFee || 0);
    $('editShippingNotes').value = state.dashboard?.fisherman?.shipping?.notes || '';
    document.querySelector('[data-edit-cut="inteiro"]').checked = true;
    $('productResult').classList.add('hidden');
    state.editing = null;
  }

  function openDialog(target) {
    if (typeof target.showModal === 'function') target.showModal();
    else target.setAttribute('open', '');
  }

  function closeDialog(target) {
    if (typeof target.close === 'function') target.close();
    else target.removeAttribute('open');
  }

  function openProductEditor(id = '') {
    clearEditor();
    const dialog = $('productEditor');

    if (id) {
      const product = state.dashboard?.products?.find(item => item.id === id);
      if (!product) return;

      state.editing = product;
      $('editProductId').value = product.id;
      $('productEditorTitle').textContent = `Editar ${product.species}`;
      $('editSpecies').value = product.species || '';
      $('editCategory').value = product.category || 'peixe';
      $('editState').value = product.state || 'fresco';
      $('editCatchDate').value = product.catchDate || '';
      $('editQuantity').value = Number(product.quantityKg || 0);
      $('editPrice').value = Number(product.pricePerKg || 0);
      $('editSaleUnit').value = product.saleUnit || 'kg';
      updateSaleUnitFields();
      $('editAvailabilityHours').value = String(product.availabilityHours || 36);
      $('editOrigin').value = product.originNote || '';
      $('editDescription').value = product.description || '';

      document.querySelectorAll('[data-edit-cut]').forEach(input => {
        const found = product.cuts?.find(cut => cut.id === input.dataset.editCut);
        input.checked = Boolean(found);
        document.querySelector(`[data-edit-extra="${input.dataset.editCut}"]`).value = Number(found?.extraPerKg || 0);
      });

      $('editShipPickup').checked = Boolean(product.shipping?.pickup);
      $('editShipDelivery').checked = Boolean(product.shipping?.communityDelivery);
      $('editShipFreight').checked = Boolean(product.shipping?.collaborativeFreight);
      $('editDeliveryFee').value = Number(product.shipping?.deliveryFee || 0);
      $('editFreightFee').value = Number(product.shipping?.collaborativeFee || 0);
      $('editShippingNotes').value = product.shipping?.notes || '';
    }

    openDialog(dialog);
  }

  async function load() {
    try {
      const dashboard = await api.dashboard();
      state.dashboard = dashboard;

      $('dashboardStatus').className = `api-status ${dashboard.demo ? 'demo' : 'online'}`;
      $('dashboardStatus').innerHTML = dashboard.demo
        ? '<strong>Painel demonstrativo.</strong> Alterações ficam somente neste navegador.'
        : '<strong>Painel conectado.</strong> Estoque, prazo e pedidos estão ligados ao servidor.';

      $('dashboardWelcome').textContent =
        `${dashboard.fisherman.displayName || session.user.name} • ${dashboard.fisherman.community || 'comunidade caiçara'}`;

      $('summaryPublished').textContent = dashboard.summary.productsPublished || 0;
      $('summaryPending').textContent = dashboard.summary.productsPending || 0;
      $('summaryExpired').textContent = dashboard.summary.productsExpired || 0;
      $('summaryOpenOrders').textContent = dashboard.summary.openOrders || 0;

      fillProfile(dashboard.fisherman);
      renderProducts(dashboard.products || []);
      renderOrders(dashboard.orders || []);
    } catch (error) {
      if (/login|sessão|session|acesso/i.test(error.message)) {
        api.logout();
        window.location.replace('./login.html?tipo=vender');
        return;
      }
      $('dashboardStatus').className = 'api-status demo';
      $('dashboardStatus').textContent = error.message;
    }
  }

  $('profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const result = $('profileResult');
    result.classList.add('hidden');

    try {
      const response = await api.updateFisherProfile({
        displayName: $('profileName').value.trim(),
        community: $('profileCommunity').value.trim(),
        pickupReference: $('profilePickup').value.trim(),
        bio: $('profileBio').value.trim(),
        whatsappPublic: $('profileWhatsappPublic').checked,
        shipping: shippingPayload('profile')
      });

      result.innerHTML = `<strong>Perfil salvo.</strong> ${esc(response.message || '')}`;
      result.classList.remove('hidden');
      await load();
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível salvar.</strong> ${esc(error.message)}`;
      result.classList.remove('hidden');
    }
  });

  $('productForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!$('productForm').checkValidity()) {
      $('productForm').reportValidity();
      return;
    }

    const result = $('productResult');
    result.classList.add('hidden');

    const payload = {
      species: $('editSpecies').value.trim(),
      category: $('editCategory').value,
      state: $('editState').value,
      catchDate: $('editCatchDate').value,
      quantityKg: Number($('editQuantity').value),
      pricePerKg: Number($('editPrice').value),
      saleUnit: $('editSaleUnit').value,
      availabilityHours: Number($('editAvailabilityHours').value),
      originNote: $('editOrigin').value.trim(),
      description: $('editDescription').value.trim(),
      cuts: selectedCuts(),
      shipping: shippingPayload('edit')
    };

    try {
      const response = state.editing
        ? await api.updateProduct(state.editing.id, payload)
        : await api.createProduct(state.dashboard.fisherman.id, payload);

      result.innerHTML = `<strong>Salvo.</strong> ${esc(response.message || '')}`;
      result.classList.remove('hidden');
      await load();
      setTimeout(() => closeDialog($('productEditor')), 700);
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível salvar.</strong> ${esc(error.message)}`;
      result.classList.remove('hidden');
    }
  });

  $('fishPreset').addEventListener('change', event => applyPreset(event.target.value));
  $('editSaleUnit').addEventListener('change', updateSaleUnitFields);
  populatePresetCatalog();

  $('newProductButton').addEventListener('click', () => openProductEditor());
  document.querySelector('[data-open-product]').addEventListener('click', () => openProductEditor());
  document.querySelector('[data-close-product]').addEventListener('click', () => closeDialog($('productEditor')));

  $('logoutButton').addEventListener('click', () => {
    api.logout();
    window.location.href = './login.html?tipo=vender';
  });

  load();
})();