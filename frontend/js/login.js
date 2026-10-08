(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;

  const chooser = document.getElementById('accessChooser');
  const panel = document.getElementById('loginPanel');
  const form = document.getElementById('loginForm');
  const status = document.getElementById('loginStatus');
  const mode = document.getElementById('loginMode');
  const result = document.getElementById('loginResult');
  const demoBox = document.getElementById('demoLoginBox');
  const demoButton = document.getElementById('demoLoginButton');
  const passwordInput = document.getElementById('loginPassword');
  const togglePassword = document.getElementById('toggleLoginPassword');
  const actions = document.getElementById('loginActions');
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');

  let accessType = params.get('tipo');
  if (!['comprar', 'vender'].includes(accessType)) accessType = next === 'curadoria-comercial.html' ? 'curadoria' : '';

  const existing = api.getSession();
  if (existing?.user?.curator && next === 'curadoria-comercial.html') {
    window.location.replace('./curadoria-comercial.html');
    return;
  }
  if (existing?.user?.role === 'pescador' && !next && !accessType) {
    window.location.replace('./painel-pescador.html');
    return;
  }
  if (existing?.user?.role === 'cliente' && !next && !accessType) {
    window.location.replace('./minha-conta.html');
    return;
  }

  const configs = {
    comprar: {
      eyebrow: 'Cliente',
      title: 'Entrar para comprar',
      description: 'Acompanhe seus pedidos e compre novamente com mais facilidade.',
      label: 'Acesso do cliente',
      submit: 'Entrar como cliente',
      benefits: ['✓ acompanhar pedidos', '✓ guardar seu acesso', '✓ comprar de novo com facilidade'],
      actions: '<a class="btn btn-secondary btn-wide" href="./cadastro-cliente.html">Criar cadastro de cliente</a><a class="text-link" href="./pescados.html">Comprar sem cadastro pelo WhatsApp</a>'
    },
    vender: {
      eyebrow: 'Pescador',
      title: 'Entrar para vender',
      description: 'Gerencie pescados, estoque, preços, disponibilidade e pedidos.',
      label: 'Acesso do pescador',
      submit: 'Entrar no painel de venda',
      benefits: ['✓ cadastrar pescado', '✓ atualizar estoque e preço', '✓ receber e acompanhar pedidos'],
      actions: '<a class="btn btn-secondary btn-wide" href="./cadastro.html">Criar cadastro de pescador</a>'
    },
    curadoria: {
      eyebrow: 'Curadoria',
      title: 'Entrar na curadoria',
      description: 'Acesso restrito à equipe responsável pela revisão.',
      label: 'Acesso restrito',
      submit: 'Entrar na curadoria',
      benefits: ['✓ revisar perfis', '✓ revisar pescados'],
      actions: ''
    }
  };

  function showChooser() {
    accessType = '';
    chooser.classList.remove('hidden');
    panel.classList.add('hidden');
    const url = new URL(window.location.href);
    url.searchParams.delete('tipo');
    if (!next) history.replaceState({}, '', url);
  }

  function selectAccess(type) {
    accessType = type;
    const config = configs[type];
    if (!config) return;

    chooser.classList.add('hidden');
    panel.classList.remove('hidden');
    document.getElementById('accessEyebrow').textContent = config.eyebrow;
    document.getElementById('accessTitle').textContent = config.title;
    document.getElementById('accessDescription').textContent = config.description;
    document.getElementById('loginRoleLabel').textContent = config.label;
    document.getElementById('loginSubmit').textContent = config.submit;
    document.getElementById('accessBenefits').innerHTML = config.benefits.map(item => `<span>${item}</span>`).join('');
    actions.innerHTML = config.actions;
    result.classList.add('hidden');

    if (type !== 'curadoria') {
      const url = new URL(window.location.href);
      url.searchParams.set('tipo', type);
      history.replaceState({}, '', url);
    }

    if (api.mode === 'api') {
      status.className = 'api-status online';
      status.innerHTML = '<strong>Sistema online.</strong> Digite seu telefone ou e-mail e sua senha.';
      mode.textContent = 'SISTEMA ONLINE';
      form.classList.remove('hidden');
      demoBox.classList.add('hidden');
    } else {
      status.className = 'api-status demo';
      status.innerHTML = '<strong>Modo de teste.</strong> Use o acesso demonstrativo abaixo.';
      mode.textContent = 'MODO DE TESTE';
      form.classList.add('hidden');
      demoBox.classList.remove('hidden');
      demoButton.textContent = type === 'comprar'
        ? 'Abrir como cliente demonstrativo'
        : type === 'vender'
          ? 'Abrir como pescador demonstrativo'
          : 'Abrir curadoria demonstrativa';
    }
  }

  function destination(response) {
    if (next === 'curadoria-comercial.html' && response.user?.curator) return './curadoria-comercial.html';
    if (response.user?.role === 'pescador') return './painel-pescador.html';
    if (response.user?.role === 'cliente') return './minha-conta.html';
    return './pescados.html';
  }

  document.querySelectorAll('[data-access-type]').forEach(button => {
    button.addEventListener('click', () => selectAccess(button.dataset.accessType));
  });

  document.getElementById('changeAccessType').addEventListener('click', showChooser);

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

    const button = document.getElementById('loginSubmit');
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = 'Entrando...';

    try {
      const response = await api.login(
        document.getElementById('loginIdentifier').value.trim(),
        passwordInput.value
      );

      if (accessType === 'comprar' && response.user?.role !== 'cliente') {
        api.logout();
        throw new Error('Este cadastro é de pescador. Escolha “Quero vender” para entrar.');
      }
      if (accessType === 'vender' && response.user?.role !== 'pescador') {
        api.logout();
        throw new Error('Este cadastro é de cliente. Escolha “Quero comprar” para entrar.');
      }
      if (accessType === 'curadoria' && !response.user?.curator) {
        api.logout();
        throw new Error('Esta conta não possui acesso à curadoria.');
      }

      window.location.href = destination(response);
    } catch (error) {
      result.innerHTML = `<strong>Não foi possível entrar.</strong> ${error.message}`;
      result.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  });

  demoButton.addEventListener('click', () => {
    let session;
    if (accessType === 'comprar') session = api.startDemoCustomerSession();
    else if (accessType === 'vender') session = api.startDemoFisherSession();
    else session = api.startDemoCuratorSession();

    window.location.href = accessType === 'comprar'
      ? './minha-conta.html'
      : accessType === 'vender'
        ? './painel-pescador.html'
        : './curadoria-comercial.html';
  });

  if (accessType) selectAccess(accessType);
})();