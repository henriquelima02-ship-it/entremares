/* Navegação da apresentação IFA: sem dependências, aceita teclado, toque e URL direta #slide-N. */
(function () {
  'use strict';
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  const thumbs = Array.from(document.querySelectorAll('[data-go-slide]'));
  const previous = document.getElementById('ifa-prev');
  const next = document.getElementById('ifa-next');
  const count = document.getElementById('ifa-count');
  const progress = document.getElementById('ifa-progress-bar');
  const fullscreen = document.getElementById('ifa-fullscreen');
  const player = document.getElementById('ifa-player');
  const expand = document.getElementById('ifa-expand');
  const title = document.getElementById('ifa-current-title');
  const description = document.getElementById('ifa-current-description');
  if (!slides.length || !previous || !next || !count || !player) return;

  const summaries = [
    ['O IFA e o EntreMarés', 'O projeto conecta pesquisa escolar, saberes tradicionais, pesca artesanal, tecnologia e participação da comunidade.'],
    ['O que é o IFA?', 'IFA significa Itinerário Formativo de Aprofundamento. É uma oportunidade de investigar problemas e temas que relacionam conhecimento escolar, prática e projeto de vida.'],
    ['O IFA no nosso projeto', 'A pesquisa se aproxima do território: entrevistas, mapeamento de saberes, biodiversidade e produção de materiais com participação estudantil.'],
    ['Conheça o portal EntreMarés', 'O site reúne saberes, povoados e produtos caiçaras e apresenta um acervo público de pesquisas, memórias e cultura local.'],
    ['O que encontramos no site', 'O acervo apresenta reportagens, conhecimentos de Piaçaguera e Amparo, fauna e flora, pesca artesanal e alimentação caiçara.'],
    ['Como a comunidade pode utilizar', 'O portal pode apoiar aulas e pesquisas, rodas de conversa, visitas e divulgação responsável de conhecimentos do território.'],
    ['Acesse e compartilhe', 'O QR Code da tela leva à página inicial do EntreMarés. O site pode ser acessado e compartilhado por moradores, estudantes e visitantes.']
  ];
  let current = 0;
  let swipeX = null;
  let swipeY = null;

  function setSlide(index, updateUrl = true) {
    const nextIndex = Math.min(slides.length - 1, Math.max(0, index));
    current = nextIndex;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    thumbs.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = `${current + 1} / ${slides.length}`;
    progress.style.width = `${(current + 1) / slides.length * 100}%`;
    title.textContent = summaries[current][0];
    description.textContent = summaries[current][1];
    expand.href = slides[current].querySelector('img').getAttribute('src');
    if (updateUrl) history.replaceState(null, '', `#slide-${current + 1}`);
  }

  previous.addEventListener('click', () => setSlide(current - 1));
  next.addEventListener('click', () => setSlide(current + 1));
  thumbs.forEach(btn => btn.addEventListener('click', () => setSlide(Number(btn.dataset.goSlide) - 1)));
  window.addEventListener('keydown', event => {
    const tag = event.target?.tagName || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); setSlide(current + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); setSlide(current - 1); }
    else if (event.key === 'Home' && event.target === document.body) { setSlide(0); }
    else if (event.key === 'End' && event.target === document.body) { setSlide(slides.length - 1); }
  });
  player.querySelector('.ifa-screen').addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    swipeX = event.touches[0].clientX;
    swipeY = event.touches[0].clientY;
  }, {passive:true});
  player.querySelector('.ifa-screen').addEventListener('touchend', event => {
    if (swipeX === null || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - swipeX;
    const dy = event.changedTouches[0].clientY - swipeY;
    swipeX = swipeY = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) setSlide(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
  function refreshFullScreen() {
    const active = document.fullscreenElement === player;
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Ativar tela cheia');
    fullscreen.textContent = active ? '✕ Sair da tela cheia' : '⛶ Tela cheia';
  }
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (player.requestFullscreen) await player.requestFullscreen();
      else fullscreen.disabled = true;
    } catch (error) {
      console.warn('Tela cheia indisponível neste navegador.', error);
    }
  });
  document.addEventListener('fullscreenchange', refreshFullScreen);
  window.addEventListener('hashchange', () => {
    const match = /^#slide-([1-7])$/.exec(location.hash);
    if (match) setSlide(Number(match[1]) - 1, false);
  });
  const match = /^#slide-([1-7])$/.exec(location.hash);
  setSlide(match ? Number(match[1]) - 1 : 0, false);
})();
