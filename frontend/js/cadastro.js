(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const api = window.EntreMaresAPI;
  const result = document.getElementById('registerResult');
  const apiStatus = document.getElementById('apiStatus');
  const modeBadge = document.getElementById('modeBadge');
  const submitLabel = document.getElementById('registerSubmitLabel');
  const nameInput = document.getElementById('name');
  const displayNameInput = document.getElementById('displayName');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const togglePassword = document.getElementById('togglePassword');
  const shipDelivery = document.getElementById('shipDelivery');
  const shipCollaborative = document.getElementById('shipCollaborative');
  const deliveryFields = document.getElementById('deliveryFields');
  const freightFields = document.getElementById('freightFields');

  const isApi = api && api.mode === 'api';
  apiStatus.innerHTML = isApi
    ? '<strong>Sistema online.</strong> Seu cadastro será salvo com segurança.'
    : '<strong>Modo de teste.</strong> O cadastro ficará somente neste navegador.';
  apiStatus.classList.add(isApi ? 'online' : 'demo');
  modeBadge.textContent = isApi ? 'SISTEMA ONLINE' : 'MODO DE TESTE';

  let displayNameEdited = false;

  displayNameInput.addEventListener('input', () => {
    displayNameEdited = true;
  });

  nameInput.addEventListener('input', () => {
    if (!displayNameEdited || !displayNameInput.value.trim()) {
      displayNameInput.value = nameInput.value.trim();
    }
  });

  function updateConditionalFields() {
    deliveryFields.classList.toggle('hidden', !shipDelivery.checked);
    freightFields.classList.toggle('hidden', !shipCollaborative.checked);
  }

  shipDelivery.addEventListener('change', updateConditionalFields);
  shipCollaborative.addEventListener('change', updateConditionalFields);
  updateConditionalFields();

  togglePassword.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    confirmPasswordInput.type = show ? 'text' : 'password';
    togglePassword.textContent = show ? 'Ocultar senhas' : 'Mostrar senhas';
  });

  function shippingPayload() {
    return {
      pickup: document.getElementById('shipPickup').checked,
      communityDelivery: shipDelivery.checked,
      collaborativeFreight: shipCollaborative.checked,
      deliveryFee: Number(document.getElementById('deliveryFee').value || 0),
      collaborativeFee: Number(document.getElementById('collaborativeFee').value || 0),
      notes: document.getElementById('shippingNotes').value.trim()
    };
  }

  function showError(message, focusElement) {
    result.innerHTML = '<strong>Revise uma informação.</strong> ' + message;
    result.classList.remove('hidden');
    result.classList.add('error-result');
    if (focusElement) {
      focusElement.focus();
      focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.classList.add('hidden');
    result.classList.remove('error-result');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      showError('As duas senhas precisam ser iguais.', confirmPasswordInput);
      return;
    }

    if (!document.getElementById('shipPickup').checked && !shipDelivery.checked && !shipCollaborative.checked) {
      showError('Marque pelo menos uma forma de retirada ou entrega.', document.getElementById('shipPickup'));
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submitLabel.textContent = 'Salvando seu cadastro...';

    try {
      const registration = await api.registerUser({
        role: 'pescador',
        name: nameInput.value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        password,
        profile: {
          community: document.getElementById('community').value.trim(),
          displayName: displayNameInput.value.trim() || nameInput.value.trim(),
          pickupReference: document.getElementById('pickupReference').value.trim(),
          bio: document.getElementById('bio').value.trim(),
          whatsappPublic: document.getElementById('whatsappPublic').checked,
          shipping: shippingPayload()
        }
      });

      const modeText = registration.demo
        ? 'Este foi um cadastro de teste salvo somente neste navegador.'
        : 'Seu perfil foi enviado para revisão da equipe.';
      result.innerHTML = '<strong>Cadastro criado com sucesso.</strong> ' + modeText +
        ' <a class="result-action" href="./painel-pescador.html">Entrar no meu painel</a>';
      result.classList.remove('hidden');
      form.classList.add('signup-complete');
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      showError(error.message || 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      submit.disabled = false;
      submitLabel.textContent = 'Criar meu cadastro';
    }
  });
})();