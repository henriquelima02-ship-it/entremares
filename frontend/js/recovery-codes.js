(function () {
  function show(target, codes, nextUrl) {
    if (!target || !Array.isArray(codes) || !codes.length) return false;
    target.replaceChildren();
    target.classList.remove('hidden');
    target.classList.remove('error-result');

    const panel = document.createElement('section');
    panel.className = 'recovery-code-panel';
    const h = document.createElement('h3');
    h.textContent = 'Guarde seus códigos para recuperar a conta';
    const note = document.createElement('p');
    note.textContent = 'Se esquecer a senha, entre com seu telefone e um destes códigos. Cada código funciona uma única vez. Eles não serão mostrados novamente.';
    const list = document.createElement('ol');
    list.className = 'recovery-code-list';
    codes.forEach(code => {
      const item = document.createElement('li');
      const text = document.createElement('code');
      text.textContent = code;
      item.append(text);
      list.append(item);
    });
    const buttons = document.createElement('div');
    buttons.className = 'recovery-code-actions';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn-secondary';
    copy.textContent = 'Copiar códigos';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn btn-secondary';
    save.textContent = 'Salvar arquivo';
    const feedback = document.createElement('p');
    feedback.className = 'recovery-feedback';
    feedback.setAttribute('aria-live', 'polite');
    const plainText = 'EntreMarés — códigos de recuperação (guarde em local seguro)\n\n'
      + codes.join('\n') + '\n\nCada código funciona uma vez. Não compartilhe seus códigos.\n';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(plainText);
        feedback.textContent = 'Códigos copiados. Guarde-os em local privado.';
      } catch (_) {
        feedback.textContent = 'Selecione os códigos acima para copiá-los manualmente.';
      }
    });
    save.addEventListener('click', () => {
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'entremarés-codigos-recuperacao.txt';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      feedback.textContent = 'Arquivo criado. Guarde-o em um local privado.';
    });
    buttons.append(copy, save);
    panel.append(h, note, list, buttons, feedback);
    if (nextUrl) {
      const ack = document.createElement('label');
      ack.className = 'check-row recovery-ack';
      const check = document.createElement('input');
      check.type = 'checkbox';
      const label = document.createElement('span');
      label.textContent = 'Guardei meus códigos em local seguro.';
      ack.append(check, label);
      const continueLink = document.createElement('a');
      continueLink.href = nextUrl;
      continueLink.className = 'btn btn-primary btn-wide';
      continueLink.textContent = 'Continuar para minha conta';
      continueLink.setAttribute('aria-disabled', 'true');
      continueLink.addEventListener('click', event => {
        if (!check.checked) event.preventDefault();
      });
      check.addEventListener('change', () => {
        continueLink.setAttribute('aria-disabled', String(!check.checked));
      });
      panel.append(ack, continueLink);
    }
    target.append(panel);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }
  window.EntreMaresRecoveryCodes = { show };
})();
