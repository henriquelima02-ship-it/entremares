(function () {
  const api = window.EntreMaresAPI;
  const form = document.getElementById('clientRegisterForm');
  if (!api || !form) return;

  const status = document.getElementById('clientApiStatus');
  const mode = document.getElementById('clientModeBadge');
  const result = document.getElementById('clientRegisterResult');
  const password = document.getElementById('clientPassword');
  const confirm = document.getElementById('clientConfirmPassword');

  if (api.mode === 'api') {
    status.className = 'api-status online';
    status.innerHTML = '<strong>Sistema online.</strong> Sua conta será salva para acompanhar pedidos.';
    mode.textContent = 'SISTEMA ONLINE';
  } else {
    status.className = 'api-status demo';
    status.innerHTML = '<strong>Modo de teste.</strong> Este cadastro ficará somente neste navegador.';
    mode.textContent = 'MODO DE TESTE';
  }

  document.getElementById('clientTogglePassword').addEventListener('click', event => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    confirm.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar senhas' : 'Mostrar senhas';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.classList.add('hidden');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (password.value !== confirm.value) {
      result.innerHTML = '<strong>Revise a senha.</strong> As duas senhas precisam ser iguais.';
      result.classList.remove('hidden');
      confirm.focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Criando sua conta...';

    try {
      const response = await api.registerUser({
        role: 'cliente',
        name: document.getElementById('clientName').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        password: password.value,
        profile: {
          community: document.getElementById('clientCommunity').value.trim()
        }
      });

      result.innerHTML = '<strong>Conta criada.</strong> Agora você pode acompanhar seus pedidos. <a class="result-action" href="./pescados.html">Ver pescados</a>';
      result.classList.remove('hidden');
      form.classList.add('signup-complete');

      if (!response.demo) {
        setTimeout(() => { window.location.href = './pescados.html'; }, 900);
      }
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível criar a conta.</strong> ${error.message}`;
      result.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = 'Criar minha conta';
    }
  });
})();