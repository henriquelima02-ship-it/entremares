(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;

  const session = api.getSession();
  if (!session || session.user?.role !== 'pescador') {
    window.location.replace('./login.html?tipo=vender');
    return;
  }

  const state = { dashboard: null, editing: null };
  let productSubmitBusy = false;
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
    pending_review: 'publicando',
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
    $('editQuantity').min = unit === 'kg' ? '0.1' : '1';
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
    const box = $('presetReference');
    if (index === '' || index === null || index === undefined) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    const item = catalog[Number(index)];
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

    const preview = window.EntreMaresFishMedia?.forSpecies(item.name, item.category);
    const previewImage = preview ? `<img src="${esc(preview.src)}" alt="${esc(preview.alt)}" loading="lazy" decoding="async">` : '';
    box.innerHTML = `<div class="preset-with-image">${previewImage}<div>${rangeHelp}<br>${esc(presetPriceText(item))}${item.note ? `<br><small>${esc(item.note)}</small>` : ''}<br><small>Imagem ilustrativa, não do anúncio.</small></div></div>`;
    box.classList.remove('hidden');
  }


  // Cadastro por toques: campos enviados à API permanecem os mesmos do formulário anterior.
  const wizardNames = ['Escolher o pescado', 'Quantidade e preço', 'Preparo e entrega', 'Conferir e publicar'];
  let wizardStep = 0;
  let wizardCategory = 'todos';
  const recommendedFees = { cut: 10, communityDelivery: 15, collaborativeFreight: 30 };

  function showWizardError(message) {
    const result = $('productResult');
    result.textContent = message;
    result.classList.remove('hidden');
    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hideWizardError() {
    $('productResult').classList.add('hidden');
    $('productResult').textContent = '';
  }

  function displayManualName(show) {
    $('manualSpeciesFields').classList.toggle('hidden', !show);
    if (show) $('editSpecies').removeAttribute('readonly');
  }

  function activePresetItem() {
    const index = $('fishPreset').value;
    if (index === '') return null;
    return catalog[Number(index)] || null;
  }

  function updateSelectedFish() {
    const name = $('editSpecies').value.trim();
    const unit = saleUnitLabel($('editSaleUnit').value);
    $('wizardSelectedFish').textContent = name
      ? 'Escolhido: ' + name + ' • venda por ' + unit
      : 'Nenhum pescado escolhido ainda.';
  }

  function updateFishTiles() {
    const container = $('wizardFishCards');
    const index = $('fishPreset').value;
    const pictureApi = window.EntreMaresFishMedia;
    const filtered = catalog.map((item,i) => ({item,i}))
      .filter(({item}) => wizardCategory === 'todos' || item.category === wizardCategory);
    container.innerHTML = filtered.map(({item,i}) => {
      const image = pictureApi?.forSpecies(item.name, item.category);
      const icon = item.category === 'crustaceo' ? '🦐' : item.category === 'molusco' ? '🦪' : '🐟';
      const visual = image && !image.generic
        ? '<img src="' + esc(image.src) + '" alt="" loading="lazy" decoding="async">'
        : '<span class="wizard-fish-fallback" aria-hidden="true">' + icon + '</span>';
      const price = item.priceMin == null ? 'Confirmar preço' : presetPriceText(item);
      return '<button type="button" class="wizard-fish-tile" data-wizard-fish="' + i
        + '" aria-pressed="' + String(index === String(i)) + '">' + visual
        + '<span><strong>' + esc(item.name) + '</strong><small>' + esc(price)
        + '</small></span></button>';
    }).join('');
    document.querySelectorAll('[data-wizard-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.wizardFilter === wizardCategory));
    });
    updateSelectedFish();
  }

  function selectPresetForWizard(index) {
    $('fishPreset').value = index;
    applyPreset(index);
    if (index === '') {
      $('editSpecies').value = '';
      $('editPrice').value = '';
    }
    displayManualName(false);
    document.querySelectorAll('[data-wizard-fish]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.wizardFish === String(index)));
    });
    updateSelectedFish();
    updatePriceButtons();
    updateCutChoices();
    hideWizardError();
  }

  function quickButton(container, value, label, selected) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.quickValue = String(value);
    button.textContent = label;
    button.setAttribute('aria-pressed', String(selected));
    container.append(button);
  }

  function updateQuantityButtons() {
    const target = $('wizardQuantityChoices');
    if (!target) return;
    const unit = $('editSaleUnit').value;
    const amounts = unit === 'kg' ? [0.5,1,2,5,10,20] : unit === 'duzia' ? [1,2,5,10] : [1,2,3,5];
    target.replaceChildren();
    amounts.forEach(qty => quickButton(target,qty, String(qty).replace('.', ',') + (unit === 'kg' ? ' kg' : unit === 'duzia' ? ' dúz.' : ' lote(s)'),Number($('editQuantity').value) === qty));
    updateSelectedFish();
  }

  function updatePriceButtons() {
    const target = $('wizardPriceChoices');
    if (!target) return;
    target.replaceChildren();
    const item = activePresetItem();
    if (!item || item.priceMin == null) {
      const hint=document.createElement('small');
      hint.textContent='Sem preço de referência. Digite o valor combinado para hoje.';
      target.append(hint);
      return;
    }
    const min=Number(item.priceMin), max=Number(item.priceMax);
    const choices = min === max ? [min] : [...new Set([min, (min+max)/2, max].map(v=>Math.round(v*100)/100))];
    choices.forEach(value => quickButton(target,value,brl(value),Number($('editPrice').value) === value));
  }

  function updateQuickButtons() {
    document.querySelectorAll('[data-wizard-select]').forEach(button => {
      const input = $(button.dataset.wizardSelect);
      button.setAttribute('aria-pressed', String(input?.value === button.dataset.wizardValue));
    });
    updateQuantityButtons();
    updatePriceButtons();
  }

  function updateCutStates() {
    document.querySelectorAll('[data-edit-cut]').forEach(input => {
      const card = input.closest('.wizard-cut-card');
      card?.classList.toggle('selected', input.checked);
    });
  }

  function updateCutChoices() {
    const category = $('editCategory').value;
    const byCategory = {
      peixe: ['inteiro','limpo','eviscerado','file','posta','sem_cabeca'],
      crustaceo: ['inteiro','limpo','descascado','sem_cabeca'],
      molusco: ['inteiro','limpo'],
      outro: ['inteiro','limpo','eviscerado','file','posta','descascado','sem_cabeca']
    };
    const allowed = byCategory[category] || byCategory.outro;
    document.querySelectorAll('[data-edit-cut]').forEach(input => {
      const existing = state.editing?.cuts?.some(cut => cut.id === input.dataset.editCut);
      const visible = allowed.includes(input.dataset.editCut) || Boolean(existing);
      input.closest('.wizard-cut-card').hidden = !visible;
      if (!visible) input.checked = false;
    });
    updateCutStates();
  }

  function updateShippingStates() {
    ['Pickup','Delivery','Freight'].forEach(name => {
      const input = $('editShip' + name);
      input.closest('.wizard-choice')?.classList.toggle('selected', input.checked);
    });
    $('wizardDeliveryLabel').textContent = 'Valor atual: ' + brl($('editDeliveryFee').value) + ' • referência: R$ 15';
    $('wizardFreightLabel').textContent = 'Base atual: ' + brl($('editFreightFee').value) + ' • referência: R$ 30';
  }

  function reviewRow(label, value) {
    return '<div class="wizard-review-item"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  function updateReview() {
    const unit = saleUnitLabel($('editSaleUnit').value);
    const cuts = selectedCuts();
    const cutsLabel = cuts.length ? cuts.map(cut => cut.label + (cut.extraPerKg ? ' + ' + brl(cut.extraPerKg) + '/' + unit : '')).join(', ') : 'Nenhum preparo selecionado';
    const methods = [];
    if ($('editShipPickup').checked) methods.push('Retirada sem frete');
    if ($('editShipDelivery').checked) methods.push('Entrega: ' + brl($('editDeliveryFee').value));
    if ($('editShipFreight').checked) methods.push('Frete base: ' + brl($('editFreightFee').value) + ' (pode variar com a quantidade)');
    $('wizardReview').innerHTML = [
      reviewRow('Pescado',$('editSpecies').value.trim() || 'Não selecionado'),
      reviewRow('Quantidade', String($('editQuantity').value || '—') + ' ' + saleUnitStockLabel($('editSaleUnit').value,$('editQuantity').value)),
      reviewRow('Preço de venda',brl($('editPrice').value) + ' por ' + unit),
      reviewRow('Estado',($('editState').selectedOptions[0]?.textContent || 'Fresco')),
      reviewRow('Duração', $('editAvailabilityHours').value + ' horas'),
      reviewRow('Preparo',cutsLabel),
      reviewRow('Como receber', methods.join(' • ') || 'Nenhuma opção')
    ].join('');
  }

  function setWizardStep(next) {
    wizardStep = Math.max(0,Math.min(3,next));
    document.querySelectorAll('[data-wizard-step]').forEach(section => {
      section.hidden = Number(section.dataset.wizardStep) !== wizardStep;
    });
    document.querySelectorAll('[data-wizard-progress]').forEach(span => {
      const index=Number(span.dataset.wizardProgress);
      span.classList.toggle('is-current', index===wizardStep);
      span.classList.toggle('is-done', index<wizardStep);
      if(index===wizardStep) span.setAttribute('aria-current','step');
      else span.removeAttribute('aria-current');
    });
    $('wizardStepStatus').textContent = 'Etapa ' + (wizardStep+1) + ' de 4 — ' + wizardNames[wizardStep];
    $('wizardBack').hidden = wizardStep === 0;
    $('wizardNext').hidden = wizardStep === 3;
    $('wizardSubmit').hidden = wizardStep !== 3;
    if(wizardStep===3) updateReview();
    hideWizardError();
    const dialog=$('productEditor');
    dialog.scrollTop=0;
  }

  function validWizardStep(index) {
    if(index===0) {
      if(!$('editSpecies').value.trim()){
        showWizardError('Escolha um pescado da galeria ou toque em “Não achei meu pescado”.');
        return false;
      }
    }
    if(index===1) {
      for(const id of ['editSaleUnit','editQuantity','editPrice']) {
        const input=$(id);
        if(!input.checkValidity() || Number(id==='editSaleUnit'?1:input.value)<=0) {
          if(id!=='editSaleUnit' && !input.value) input.setCustomValidity('Informe um valor maior que zero.');
          input.reportValidity();
          input.setCustomValidity('');
          return false;
        }
      }
    }
    if(index===2){
      if(!($('editShipPickup').checked||$('editShipDelivery').checked||$('editShipFreight').checked)){
        showWizardError('Escolha pelo menos uma forma de retirada ou entrega.');
        return false;
      }
    }
    return true;
  }

  function initializeNewFees(){
    const shipping=state.dashboard?.fisherman?.shipping || {};
    $('editDeliveryFee').value = shipping.communityDelivery
      ? Number(shipping.deliveryFee ?? 0) : recommendedFees.communityDelivery;
    $('editFreightFee').value = shipping.collaborativeFreight
      ? Number(shipping.collaborativeFee ?? 0) : recommendedFees.collaborativeFreight;
    document.querySelectorAll('[data-edit-extra]').forEach(input=>{
      input.value=input.dataset.editExtra==='inteiro' ? 0 : recommendedFees.cut;
    });
  }

  function showEditorWizard() {
    const match=catalog.findIndex(item=>item.name.toLowerCase()===$('editSpecies').value.trim().toLowerCase());
    $('fishPreset').value = match>=0 ? String(match) : '';
    displayManualName(match<0 && Boolean($('editSpecies').value.trim()));
    wizardCategory='todos';
    updateFishTiles();
    updateQuickButtons();
    updateCutChoices();
    updateShippingStates();
    $('wizardConfirmed').checked=false;
    $('wizardSubmit').textContent=state.editing?'Salvar alterações':'Publicar pescado';
    setWizardStep(0);
  }

  function bindWizard() {
    $('wizardFishCards').addEventListener('click',event=>{
      const button=event.target.closest('[data-wizard-fish]');
      if(button) selectPresetForWizard(button.dataset.wizardFish);
    });
    $('wizardFilters').addEventListener('click',event=>{
      const button=event.target.closest('[data-wizard-filter]');
      if(button){wizardCategory=button.dataset.wizardFilter;updateFishTiles();}
    });
    $('wizardManualChoice').addEventListener('click',()=>{
      $('fishPreset').value='';
      $('editSpecies').value='';
      $('editCategory').value='outro';
      $('editPrice').value='';
      $('editSaleUnit').value='kg';
      updateSaleUnitFields();
      $('presetReference').classList.add('hidden');
      displayManualName(true);
      updateFishTiles();
      updatePriceButtons();
      updateCutChoices();
      $('editSpecies').focus();
    });
    $('wizardNext').addEventListener('click',()=>{
      if(validWizardStep(wizardStep))setWizardStep(wizardStep+1);
    });
    $('wizardBack').addEventListener('click',()=>setWizardStep(wizardStep-1));
    $('wizardQuantityChoices').addEventListener('click',event=>{
      const button=event.target.closest('[data-quick-value]');
      if(button){$('editQuantity').value=button.dataset.quickValue;updateQuantityButtons();updateReview();}
    });
    $('wizardPriceChoices').addEventListener('click',event=>{
      const button=event.target.closest('[data-quick-value]');
      if(button){$('editPrice').value=button.dataset.quickValue;updatePriceButtons();updateReview();}
    });
    document.querySelectorAll('[data-wizard-select]').forEach(button=>button.addEventListener('click',()=>{
      $(button.dataset.wizardSelect).value=button.dataset.wizardValue;
      updateQuickButtons();updateReview();
    }));
    document.querySelectorAll('[data-wizard-fee]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.wizardFee === 'delivery') {
        $('editShipDelivery').checked = true;
        $('editDeliveryFee').value = recommendedFees.communityDelivery;
      } else {
        $('editShipFreight').checked = true;
        $('editFreightFee').value = recommendedFees.collaborativeFreight;
      }
      updateShippingStates();
      updateReview();
    }));
    $('wizardToday').addEventListener('click',()=>{
      const d=new Date(), pad=n=>String(n).padStart(2,'0');
      $('editCatchDate').value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    });
    $('productForm').addEventListener('input',()=>{updateReview();updateQuickButtons();updateSelectedFish();updateShippingStates();});
    $('productForm').addEventListener('change',event=>{
      if(event.target.id === 'editCategory') updateCutChoices();
      if(event.target.matches('[data-edit-cut]'))updateCutStates();
      if(event.target.matches('[id^="editShip"]'))updateShippingStates();
      updateReview();
    });
    $('wizardSpeak').addEventListener('click',()=>{
      if(!('speechSynthesis' in window)){showWizardError('O recurso de leitura não está disponível neste aparelho.');return;}
      window.speechSynthesis.cancel();
      const script=[
        'Escolha o pescado. Toque na imagem ou no nome. Se não encontrar, escolha escrever o nome.',
        'Escolha a quantidade e confirme o preço de hoje. Também pode escolher o estado do pescado e o prazo.',
        'Toque nos cortes que você faz. Escolha como o cliente vai receber o pescado. Os valores são sugestões e podem ser alterados.',
        'Confira a quantidade e o preço. Marque a confirmação e toque em publicar pescado.'
      ][wizardStep];
      const message=new SpeechSynthesisUtterance(script);
      message.lang='pt-BR';message.rate=.9;
      window.speechSynthesis.speak(message);
    });
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
    // Segurança extra para respostas antigas ou em cache.
    const visibleProducts = (products || []).filter(product => product.status !== 'deleted');
    $('productsEmpty').classList.toggle('hidden', visibleProducts.length > 0);

    box.innerHTML = visibleProducts.map(product => {
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

            ${remaining ? `<div class="dashboard-availability"><span data-icon="clock" aria-hidden="true"></span> ${esc(remaining)}</div>` : ''}
            <p>${esc(product.description || 'Sem descrição pública.')}</p>

            <div class="dashboard-item-meta">
              <span><span data-icon="package" aria-hidden="true"></span> <strong>${Number(product.quantityKg || 0).toLocaleString('pt-BR')} ${esc(saleUnitStockLabel(product.saleUnit, product.quantityKg))}</strong> em estoque</span>
              <span>${esc(product.state || 'fresco')}</span>
              <span><span data-icon="clock" aria-hidden="true"></span> Prazo: ${Number(product.availabilityHours || 36)}h</span>
              <span><span data-icon="cut" aria-hidden="true"></span> Cortes: ${esc(cuts)}</span>
            </div>

            ${product.status === 'paused' && product.pauseReason === 'community_unavailable'
              ? '<div class="review-note"><strong>Aviso da comunidade:</strong> houve relatos de indisponibilidade. Confirme o estoque e use “Confirmar disponibilidade”.</div>'
              : product.status === 'paused' && product.pauseReason === 'seller_unavailable'
                ? '<div class="review-note"><strong>Venda não atendida:</strong> o anúncio foi pausado. Corrija o estoque e confirme a disponibilidade.</div>'
                : product.status === 'paused' && product.pauseReason === 'no_stock'
                  ? '<div class="review-note"><strong>Estoque zerado:</strong> adicione estoque para reativar.</div>'
                  : ''}
            ${product.reviewNote ? `<div class="review-note"><strong>Observação:</strong> ${esc(product.reviewNote)}</div>` : ''}
          </div>

          <div class="dashboard-item-actions">
            <button class="btn btn-secondary" type="button" data-edit-product="${esc(product.id)}"><span data-icon="pencil" aria-hidden="true"></span> Editar</button>
            ${canRenew
              ? `<button class="btn btn-primary" type="button" data-product-action="renew" data-product-id="${esc(product.id)}"><span data-icon="${product.status === 'paused' ? 'check' : 'refresh'}" aria-hidden="true"></span> ${product.status === 'paused' ? 'Confirmar disponibilidade' : `Renovar ${Number(product.availabilityHours || 36)}h`}</button>`
              : ''}
            ${product.status === 'published'
              ? `<button class="btn btn-secondary" type="button" data-product-action="pause" data-product-id="${esc(product.id)}"><span data-icon="pause" aria-hidden="true"></span> Pausar</button>`
              : product.status === 'paused'
                ? ''
                : product.status === 'rejected'
                  ? `<button class="btn btn-primary" type="button" data-product-action="submit" data-product-id="${esc(product.id)}">Enviar para revisão</button>`
                  : ''}
            <button class="btn btn-delete-product" type="button" data-delete-product="${esc(product.id)}"><span data-icon="trash" aria-hidden="true"></span> Excluir anúncio</button>
          </div>
        </article>`;
    }).join('');
    window.EntreMaresIcons?.decorate(box);

    box.querySelectorAll('[data-delete-product]').forEach(button => {
      button.addEventListener('click', async () => {
        const product = state.dashboard?.products?.find(item => item.id === button.dataset.deleteProduct);
        if (!product) return;
        const description = `${product.species} — ${brl(product.pricePerKg)}/${saleUnitLabel(product.saleUnit)}, ${Number(product.quantityKg || 0).toLocaleString('pt-BR')} ${saleUnitStockLabel(product.saleUnit, product.quantityKg)}; status: ${statusLabel(effectiveStatus(product))}`;
        if (!window.confirm(`Excluir este anúncio?\\n\\n${description}\\n\\nEle desaparecerá da vitrine e do seu painel. Pedidos anteriores serão preservados. Esta ação não pode ser desfeita.`)) return;
        button.disabled = true;
        button.textContent = 'Excluindo...';
        try {
          const response = await api.deleteProduct(product.id);
          await load();
          window.alert(response.message || 'Anúncio excluído.');
        } catch (error) {
          window.alert(error.message || 'Não foi possível excluir o anúncio.');
          button.disabled = false;
          button.textContent = 'Excluir anúncio';
        }
      });
    });

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
            <button class="btn btn-primary" type="button" data-save-order="${esc(order.id)}"><span data-icon="check" aria-hidden="true"></span> Salvar status</button>
            ${!['recusado', 'cancelado', 'concluido'].includes(order.status)
              ? `<button class="btn btn-secondary" type="button" data-order-unavailable="${esc(order.id)}"><span data-icon="alert" aria-hidden="true"></span> Sem estoque: recusar pedido e pausar anúncio</button>`
              : ''}
          </div>
        </article>`;
    }).join('');
    window.EntreMaresIcons?.decorate(box);

    box.querySelectorAll('[data-order-unavailable]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Confirmar falta de estoque? O pedido será recusado, a reserva devolvida e o anúncio pausado até você corrigir e confirmar a disponibilidade.')) return;
        button.disabled = true;
        try {
          await api.setOrderStatus(button.dataset.orderUnavailable, 'recusado', 'unavailable');
          await load();
        } catch (error) {
          window.alert(error.message);
        } finally {
          button.disabled = false;
        }
      });
    });
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
    initializeNewFees();
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
        document.querySelector(`[data-edit-extra="${input.dataset.editCut}"]`).value = Number(found?.extraPerKg ?? (input.dataset.editCut === 'inteiro' ? 0 : recommendedFees.cut));
      });

      $('editShipPickup').checked = Boolean(product.shipping?.pickup);
      $('editShipDelivery').checked = Boolean(product.shipping?.communityDelivery);
      $('editShipFreight').checked = Boolean(product.shipping?.collaborativeFreight);
      $('editDeliveryFee').value = Number(product.shipping?.deliveryFee || 0);
      $('editFreightFee').value = Number(product.shipping?.collaborativeFee || 0);
      $('editShippingNotes').value = product.shipping?.notes || '';
    }

    openDialog(dialog);
    showEditorWizard();
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
    if (productSubmitBusy) return;
    if (!$('productForm').checkValidity()) {
      $('productForm').reportValidity();
      return;
    }

    const result = $('productResult');
    result.classList.add('hidden');
    const saveButton = $('productForm').querySelector('button[type="submit"]');
    const originalLabel = saveButton.textContent;
    productSubmitBusy = true;
    saveButton.disabled = true;
    saveButton.textContent = 'Salvando...';
    let saved = false;

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
      saved = true;
      setTimeout(() => {
        closeDialog($('productEditor'));
        productSubmitBusy = false;
        saveButton.disabled = false;
        saveButton.textContent = originalLabel;
      }, 700);
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível salvar.</strong> ${esc(error.message)}`;
      result.classList.remove('hidden');
    } finally {
      if (!saved) {
        productSubmitBusy = false;
        saveButton.disabled = false;
        saveButton.textContent = originalLabel;
      }
    }
  });

  $('fishPreset').addEventListener('change', event => selectPresetForWizard(event.target.value));
  $('editSaleUnit').addEventListener('change', () => {
    updateSaleUnitFields();
    updateQuantityButtons();
    updateReview();
  });

  function decorateCutEditor() {
    document.querySelectorAll('[data-cut-photo]').forEach(slot => {
      const picture = window.EntreMaresFishMedia?.forCut(slot.dataset.cutPhoto, 'peixe');
      if (!picture) return;
      const img = document.createElement('img');
      img.src = picture.src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      slot.append(img);
    });
  }
  decorateCutEditor();

  populatePresetCatalog();
  bindWizard();
  updateFishTiles();
  updateQuickButtons();

  $('newProductButton').addEventListener('click', () => openProductEditor());
  document.querySelector('[data-open-product]').addEventListener('click', () => openProductEditor());
  document.querySelector('[data-close-product]').addEventListener('click', () => closeDialog($('productEditor')));

  $('logoutButton').addEventListener('click', () => {
    api.logout();
    window.location.href = './login.html?tipo=vender';
  });

  load();
})();