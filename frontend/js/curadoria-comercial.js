(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[char]);
  const brl = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function sessionIsCurator() {
    return Boolean(api.getSession()?.user?.curator);
  }

  function showAccess() {
    const session = api.getSession();
    const access = $('curatorAccess');
    const actions = $('curatorActions');

    if (session?.user?.curator) {
      access.className = `api-status ${api.mode === 'api' ? 'online' : 'demo'}`;
      access.innerHTML = api.mode === 'api'
        ? '<strong>Curadoria autenticada.</strong> As decisões abaixo alteram o que aparece publicamente na vitrine.'
        : '<strong>Curadoria demonstrativa.</strong> As decisões ficam somente neste navegador.';
      actions.classList.add('hidden');
      $('curationWorkspace').classList.remove('hidden');
      load();
      return;
    }

    $('curationWorkspace').classList.add('hidden');
    actions.classList.remove('hidden');
    if (api.mode === 'api') {
      access.className = 'api-status demo';
      access.innerHTML = '<strong>Acesso restrito.</strong> Entre com uma conta cujo e-mail esteja autorizado em CURATOR_EMAILS no backend.';
      $('demoCuratorButton').classList.add('hidden');
    } else {
      access.className = 'api-status demo';
      access.innerHTML = '<strong>Modo demonstrativo.</strong> Ative uma sessão de curadoria para testar o fluxo sem dados reais.';
      $('demoCuratorButton').classList.remove('hidden');
    }
  }

  function renderFishermen(items) {
    const box = $('pendingFishermen');
    $('pendingFishermenEmpty').classList.toggle('hidden', items.length > 0);
    box.innerHTML = items.map(item => `
      <article class="curation-card">
        <div class="curation-card-head"><div><span class="status pending">em revisão</span><h3>${esc(item.displayName || 'Pescador')}</h3></div><span class="tag">${esc(item.community || 'comunidade')}</span></div>
        <p>${esc(item.bio || 'Sem apresentação informada.')}</p>
        <dl class="review-facts">
          <div><dt>Ponto de retirada</dt><dd>${esc(item.pickupReference || 'A combinar')}</dd></div>
          <div><dt>WhatsApp público</dt><dd>${item.whatsappPublic ? 'Sim — receber pedidos pelo WhatsApp' : 'Não'}</dd></div>
          ${item.privateContact ? `<div><dt>Contato para conferência</dt><dd>${esc(item.privateContact.name)} • ${esc(item.privateContact.email)} • ${esc(item.privateContact.phone)}</dd></div>` : ''}
        </dl>
        <div class="curation-actions">
          <button class="btn btn-primary" type="button" data-fisher-action="approve" data-id="${esc(item.id)}">Aprovar</button>
          <button class="btn btn-secondary danger-button" type="button" data-fisher-action="reject" data-id="${esc(item.id)}">Solicitar ajustes</button>
        </div>
      </article>`).join('');

    box.querySelectorAll('[data-fisher-action]').forEach(button => button.addEventListener('click', async () => {
      const rejecting = button.dataset.fisherAction === 'reject';
      const note = rejecting ? (window.prompt('Informe brevemente o ajuste necessário:') || '') : '';
      if (rejecting && !note) return;
      button.disabled = true;
      try {
        await api.curateFisherman(button.dataset.id, button.dataset.fisherAction, note);
        await load();
      } catch (error) {
        window.alert(error.message);
      } finally {
        button.disabled = false;
      }
    }));
  }

  function renderProducts(items) {
    const box = $('pendingProducts');
    $('pendingProductsEmpty').classList.toggle('hidden', items.length > 0);
    box.innerHTML = items.map(item => `
      <article class="curation-card">
        <div class="curation-card-head"><div><span class="status pending">em revisão</span><h3>${esc(item.species)}</h3></div><strong class="price">${brl(item.pricePerKg)}<small>/kg</small></strong></div>
        <p>${esc(item.description || 'Sem descrição informada.')}</p>
        <dl class="review-facts">
          <div><dt>Pescador</dt><dd>${esc(item.fisherman?.displayName || item.fishermanId)}</dd></div>
          <div><dt>Estoque</dt><dd>${Number(item.quantityKg || 0).toLocaleString('pt-BR')} kg • ${esc(item.state || '')}</dd></div>
          <div><dt>Prazo do anúncio</dt><dd>${Number(item.availabilityHours || 36)} horas após a publicação</dd></div>
          <div><dt>Cortes</dt><dd>${esc((item.cuts || []).map(cut => cut.label).join(' • ') || 'A combinar')}</dd></div>
          <div><dt>Origem / observação</dt><dd>${esc(item.originNote || 'Não informada')}</dd></div>
        </dl>
        <div class="curation-actions">
          <button class="btn btn-primary" type="button" data-product-action="approve" data-id="${esc(item.id)}">Publicar</button>
          <button class="btn btn-secondary danger-button" type="button" data-product-action="reject" data-id="${esc(item.id)}">Solicitar ajustes</button>
        </div>
      </article>`).join('');

    box.querySelectorAll('[data-product-action]').forEach(button => button.addEventListener('click', async () => {
      const rejecting = button.dataset.productAction === 'reject';
      const note = rejecting ? (window.prompt('Informe brevemente o ajuste necessário:') || '') : '';
      if (rejecting && !note) return;
      button.disabled = true;
      try {
        await api.curateProduct(button.dataset.id, button.dataset.productAction, note);
        await load();
      } catch (error) {
        window.alert(error.message);
      } finally {
        button.disabled = false;
      }
    }));
  }

  async function load() {
    if (!sessionIsCurator()) return showAccess();
    try {
      const [summary, pending] = await Promise.all([api.curationSummary(), api.curationPending()]);
      $('curFisherPending').textContent = summary.fishermenPending;
      $('curProductPending').textContent = summary.productsPending;
      $('curFisherPublished').textContent = summary.fishermenPublished;
      $('curOrdersOpen').textContent = summary.ordersOpen;
      renderFishermen(pending.fishermen || []);
      renderProducts(pending.products || []);
    } catch (error) {
      $('curatorAccess').className = 'api-status demo';
      $('curatorAccess').innerHTML = `<strong>Não foi possível abrir a curadoria.</strong> ${esc(error.message)}`;
      if (/acesso|login|sessão|session/i.test(error.message)) {
        api.logout();
        $('curationWorkspace').classList.add('hidden');
        $('curatorActions').classList.remove('hidden');
      }
    }
  }

  $('demoCuratorButton').addEventListener('click', () => {
    api.startDemoCuratorSession();
    showAccess();
  });

  showAccess();
})();
