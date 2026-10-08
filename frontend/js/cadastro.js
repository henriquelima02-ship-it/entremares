(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const api = window.EntreMaresAPI;
  const roleInput = document.getElementById('role');
  const fisherFields = document.getElementById('fisherFields');
  const roleLabel = document.getElementById('roleLabel');
  const submitLabel = document.getElementById('registerSubmitLabel');
  const result = document.getElementById('registerResult');
  const apiStatus = document.getElementById('apiStatus');
  const modeBadge = document.getElementById('modeBadge');

  const cutLabels = {
    inteiro: 'Inteiro', limpo: 'Limpo', eviscerado: 'Eviscerado', file: 'Filé', posta: 'Posta', descascado: 'Descascado', sem_cabeca: 'Sem cabeça'
  };

  const isApi = api && api.mode === 'api';
  apiStatus.innerHTML = isApi
    ? '<strong>Backend conectado.</strong> O cadastro será enviado para a API do EntreMarés.'
    : '<strong>Modo demonstrativo.</strong> O GitHub Pages está funcionando sem servidor. Cadastros e anúncios ficam somente neste navegador até a API pública ser configurada.';
  apiStatus.classList.add(isApi ? 'online' : 'demo');
  modeBadge.textContent = isApi ? 'BACKEND CONECTADO' : 'MODO DEMONSTRAÇÃO';

  function setRole(role) {
    roleInput.value = role;
    document.querySelectorAll('[data-role]').forEach(button => {
      const active = button.dataset.role === role;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const isFisher = role === 'pescador';
    fisherFields.classList.toggle('hidden', !isFisher);
    roleLabel.textContent = isFisher ? 'Cadastro de pescador' : 'Cadastro de cliente';
    submitLabel.textContent = isFisher ? 'Criar perfil e cadastrar pescado' : 'Criar cadastro de cliente';
    document.getElementById('displayName').required = isFisher;
    document.getElementById('pickupReference').required = isFisher;
  }

  document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));

  function selectedCuts() {
    return Array.from(document.querySelectorAll('input[name="cut"]:checked')).map(input => ({
      id: input.value,
      label: cutLabels[input.value],
      extraPerKg: Number(document.querySelector(`[data-cut-extra="${input.value}"]`)?.value || 0)
    }));
  }

  function shippingPayload() {
    return {
      pickup: document.getElementById('shipPickup').checked,
      communityDelivery: document.getElementById('shipDelivery').checked,
      collaborativeFreight: document.getElementById('shipCollaborative').checked,
      deliveryFee: Number(document.getElementById('deliveryFee').value || 0),
      collaborativeFee: Number(document.getElementById('collaborativeFee').value || 0),
      notes: document.getElementById('shippingNotes').value.trim()
    };
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.classList.add('hidden');
    const fd = new FormData(form);
    const password = String(fd.get('password') || '');
    const confirmPassword = String(fd.get('confirmPassword') || '');
    const role = String(fd.get('role') || 'cliente');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (password !== confirmPassword) {
      result.innerHTML = '<strong>As senhas não conferem.</strong> Revise os dois campos antes de continuar.';
      result.classList.remove('hidden');
      return;
    }
    if (role === 'pescador' && !document.getElementById('shipPickup').checked && !document.getElementById('shipDelivery').checked && !document.getElementById('shipCollaborative').checked) {
      result.innerHTML = '<strong>Escolha pelo menos uma opção de logística.</strong>';
      result.classList.remove('hidden');
      return;
    }

    const species = document.getElementById('species').value.trim();
    if (role === 'pescador' && species) {
      const quantity = Number(document.getElementById('quantityKg').value || 0);
      const price = Number(document.getElementById('pricePerKg').value || 0);
      if (quantity <= 0 || price <= 0) {
        result.innerHTML = '<strong>Para cadastrar um pescado, informe quantidade e preço por kg.</strong>';
        result.classList.remove('hidden');
        return;
      }
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submitLabel.textContent = 'Enviando...';

    try {
      const shipping = shippingPayload();
      const registration = await api.registerUser({
        role,
        name: String(fd.get('name')).trim(),
        phone: String(fd.get('phone')).trim(),
        email: String(fd.get('email')).trim(),
        password,
        profile: {
          community: String(fd.get('community') || '').trim(),
          displayName: String(fd.get('displayName') || '').trim(),
          pickupReference: String(fd.get('pickupReference') || '').trim(),
          bio: String(fd.get('bio') || '').trim(),
          shipping
        }
      });

      let productResponse = null;
      if (role === 'pescador' && species && registration.fisherman?.id) {
        productResponse = await api.createProduct(registration.fisherman.id, {
          species,
          category: document.getElementById('category').value,
          state: document.getElementById('state').value,
          catchDate: document.getElementById('catchDate').value,
          quantityKg: Number(document.getElementById('quantityKg').value),
          pricePerKg: Number(document.getElementById('pricePerKg').value),
          originNote: document.getElementById('originNote').value.trim(),
          description: document.getElementById('productDescription').value.trim(),
          cuts: selectedCuts(),
          shipping
        });
      }

      const modeText = registration.demo ? 'Tudo ficou salvo somente neste navegador.' : 'Os dados foram recebidos pelo backend.';
      const productText = productResponse ? ` <strong>${species}</strong> também foi cadastrado.` : '';
      result.innerHTML = `<strong>Cadastro concluído.</strong>${productText} ${modeText} <a href="./pescados.html">Abrir a vitrine de pescados →</a>`;
      result.classList.remove('hidden');
      form.reset();
      setRole('cliente');
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível concluir.</strong> ${error.message}`;
      result.classList.remove('hidden');
    } finally {
      submit.disabled = false;
      submitLabel.textContent = roleInput.value === 'pescador' ? 'Criar perfil e cadastrar pescado' : 'Criar cadastro de cliente';
    }
  });
})();
