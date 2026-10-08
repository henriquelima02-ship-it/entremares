(function () {
  const api = window.EntreMaresAPI;
  const form = document.getElementById('loginForm');
  if (!api || !form) return;

  const status = document.getElementById('loginStatus');
  const mode = document.getElementById('loginMode');
  const result = document.getElementById('loginResult');
  const demoBox = document.getElementById('demoLoginBox');
  const passwordInput = document.getElementById('loginPassword');
  const togglePassword = document.getElementById('toggleLoginPassword');
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');

  const existing = api.getSession();
  if (existing?.user?.role === 'pescador' && !next) {
    window.location.replace('./painel-pescador.html');
    return;
  }
  if (existing?.user?.curator && next === 'curadoria-comercial.html') {
    window.location.replace('./curadoria-comercial.html');
    return;
  }

  if (api.mode === 'api') {
    status.className = 'api-status online';
    status.innerHTML = '<strong>Sistema online.</strong> Entre com seu telefone ou e-mail e sua senha.';
    mode.textContent = 'SISTEMA ONLINE';
  } else {
    status.className = 'api-status demo';
    status.innerHTML = '<strong>Modo de teste.</strong> O acesso real depende da conexão com o servidor.';
    mode.textContent = 'MODO DE TESTE';
    form.classList.add('hidden');
    demoBox.classList.remove('hidden');
    const demoButton = document.getElementById('demoFisherLogin');
    if (next === 'curadoria-comercial.html') {
      demoButton.textContent = 'Abrir curadoria demonstrativa';
      demoBox.querySelector('p').textContent = 'Você pode testar a curadoria localmente, sem usar dados reais.';
    }
  }

  function destination(session) {
    if (next === 'curadoria-comercial.html' && session?.user?.curator) return './curadoria-comercial.html';
    if (session?.user?.role === 'pescador') return './painel-pescador.html';
    return './pescados.html';
  }

  togglePassword.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePassword.textContent = show ? 'Ocultar senha' : 'Mostrar senha';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.classList.add('hidden');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Entrando...';
    try {
      const response = await api.login(
        document.getElementById('loginIdentifier').value.trim(),
        passwordInput.value
      );
      window.location.href = destination({ user: response.user, fisherman: response.fisherman });
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível entrar.</strong> ${error.message}`;
      result.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = 'Entrar no painel';
    }
  });

  document.getElementById('demoFisherLogin').addEventListener('click', () => {
    const session = next === 'curadoria-comercial.html'
      ? api.startDemoCuratorSession()
      : api.startDemoFisherSession();
    window.location.href = destination(session);
  });
})();