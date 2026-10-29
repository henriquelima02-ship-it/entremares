(function () {
  const grid = document.getElementById('saberesGrid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-tema]')];
  const buttons = [...document.querySelectorAll('[data-filter-tema]')];
  const search = document.getElementById('saberesBusca');
  const count = document.getElementById('saberesCount');
  const empty = document.getElementById('saberesEmpty');
  const reset = document.getElementById('saberesLimpar');
  const valid = ['todos', 'memoria', 'natureza', 'cultura'];
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const initial = new URLSearchParams(window.location.search).get('tema');
  let selected = valid.includes(initial) ? initial : 'todos';
  function update() {
    const term = normalize(search.value);
    let total = 0;
    cards.forEach(card => {
      const matches = (selected === 'todos' || card.dataset.tema === selected) && (!term || normalize(card.textContent).includes(term));
      card.hidden = !matches;
      if (matches) total++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filterTema === selected)));
    count.textContent = total === 1 ? '1 conteúdo encontrado' : `${total} conteúdos encontrados`;
    empty.hidden = total !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filterTema;
    const url = new URL(window.location.href);
    if (selected === 'todos') url.searchParams.delete('tema');
    else url.searchParams.set('tema', selected);
    window.history.replaceState(null, '', url);
    update();
  }));
  search.addEventListener('input', update);
  reset.addEventListener('click', () => {
    search.value = '';
    selected = 'todos';
    const url = new URL(window.location.href);
    url.searchParams.delete('tema');
    window.history.replaceState(null, '', url);
    update();
    search.focus();
  });
  update();
})();