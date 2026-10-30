(function () {
  const api = window.EntreMaresAPI;
  const form = document.getElementById('recoveryForm');
  if (!api || !form) return;
  const $ = id => document.getElementById(id);
  const result = $('recoveryResult');
  const methods = [...document.querySelectorAll('[name="recoveryMethod"]')];
  const smsOption = $('smsOption');
  const smsRow = $('requestSmsRow');
  const smsNote = $('recoverySmsUnavailable');
  let smsAvailable = false;
  const method = () => methods.find(input => input.checked)?.value || 'backup';

  function choose() {
    const sms = method() === 'sms';
    smsRow.classList.toggle('hidden', !sms);
    $('recoveryCodeLabel').textContent = sms ? 'Código recebido por SMS *' : 'Código de recuperação *';
    $('recoveryCode').placeholder = sms ? 'Digite o código do SMS' : 'Cole ou digite seu código';
    $('recoveryHelp').textContent = sms
      ? 'O código será enviado somente para o telefone associado ao seu cadastro.'
      : 'Use um dos códigos mostrados no cadastro ou em Segurança da conta. Cada código funciona uma vez.';
    result.textContent = '';
  }
  methods.forEach(input => input.addEventListener('change', choose));

  api.recoveryOptions().then(options => {
    smsAvailable = Boolean(options.smsAvailable);
    smsOption.classList.toggle('hidden', !smsAvailable);
    smsNote.classList.toggle('hidden', smsAvailable);
    if (options.demo) smsNote.textContent = 'O modo demonstrativo não permite recuperar senhas. Entre no sistema online para recuperar uma conta real.';
  }).catch(() => {
    smsNote.textContent = 'Não foi possível confirmar o serviço de SMS. Use um código de recuperação.';
  });
  choose();

  $('requestSms').addEventListener('click', async () => {
    if (!smsAvailable) return;
    const phone = $('recoveryPhone').value.trim();
    if (!phone) { $('recoveryPhone').focus(); return; }
    const button = $('requestSms');
    button.disabled = true;
    result.textContent = 'Solicitando código...';
    try {
      const response = await api.requestRecoverySms(phone);
      result.textContent = response.message;
    } catch (error) {
      result.textContent = error.message || 'Não foi possível enviar o código.';
    } finally { button.disabled = false; }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if ($('recoveryNewPassword').value !== $('recoveryConfirm').value) {
      result.textContent = 'As duas senhas devem ser iguais.';
      $('recoveryConfirm').focus();
      return;
    }
    const button = $('recoverySubmit');
    button.disabled = true;
    result.textContent = 'Verificando código...';
    try {
      const response = await api.resetPassword({
        identifier: $('recoveryPhone').value.trim(),
        method: method(),
        code: $('recoveryCode').value.trim(),
        newPassword: $('recoveryNewPassword').value
      });
      form.reset();
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = response.message || 'Senha redefinida.';
      const link = document.createElement('a');
      link.href = './login.html';
      link.className = 'btn btn-primary';
      link.textContent = 'Entrar na minha conta';
      result.append(strong, document.createTextNode(' '), link);
    } catch (error) {
      result.textContent = error.message || 'Não foi possível recuperar a senha.';
    } finally { button.disabled = false; }
  });
})();
