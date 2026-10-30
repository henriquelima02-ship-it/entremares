(function () {
  const api = window.EntreMaresAPI;
  if (!api) return;
  const $ = id => document.getElementById(id);
  const session = api.getSession();
  if (!session?.user) {
    window.location.replace('./login.html');
    return;
  }
  $('backAccount').href = session.user.role === 'pescador'
    ? './painel-pescador.html' : './minha-conta.html';
  $('backAccount').textContent = session.user.role === 'pescador'
    ? 'Voltar ao meu painel' : 'Voltar aos meus pedidos';

  if (api.mode === 'demo') {
    $('securityCount').textContent = 'Funções de segurança indisponíveis no modo demonstrativo.';
    $('recoveryCodesForm').classList.add('hidden');
    $('changePasswordForm').classList.add('hidden');
    return;
  }
  async function refreshCount() {
    try {
      const count = await api.recoveryCount();
      $('securityCount').textContent = count.available === 1
        ? '1 código disponível para recuperar sua conta.'
        : `${count.available} códigos disponíveis para recuperar sua conta.`;
      if (count.available === 0) $('securityCount').textContent += ' Gere novos códigos abaixo para não ficar sem acesso.';
    } catch (error) {
      $('securityCount').textContent = error.message || 'Não foi possível verificar os códigos.';
    }
  }
  $('recoveryCodesForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('generateCodes');
    button.disabled = true;
    $('codesResult').textContent = '';
    try {
      const response = await api.renewRecoveryCodes($('codesPassword').value);
      $('codesPassword').value = '';
      window.EntreMaresRecoveryCodes.show($('newRecoveryCodes'), response.recoveryCodes);
      $('codesResult').textContent = response.message;
      await refreshCount();
    } catch (error) {
      $('codesResult').textContent = error.message || 'Não foi possível criar códigos.';
    } finally { button.disabled = false; }
  });
  $('changePasswordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const result = $('securityPasswordResult');
    if ($('newPassword').value !== $('newPasswordConfirm').value) {
      result.textContent = 'As senhas não conferem.';
      return;
    }
    const button = $('changePasswordButton');
    button.disabled = true;
    try {
      const response = await api.changePassword($('currentPassword').value, $('newPassword').value);
      result.textContent = response.message + ' Redirecionando para o acesso.';
      window.location.href = './login.html';
    } catch (error) {
      result.textContent = error.message || 'Não foi possível alterar a senha.';
      button.disabled = false;
    }
  });
  refreshCount();
})();
