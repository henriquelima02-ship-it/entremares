/* Galeria editorial do EntreMarés: um único visor acessível para todas as fotos. */
(function () {
  const frames = [...document.querySelectorAll('.story-photo[data-photo-source]')];
  if (!frames.length) return;

  const viewer = document.createElement('dialog');
  viewer.className = 'story-photo-viewer';
  viewer.setAttribute('aria-label', 'Fotografia ampliada');
  viewer.innerHTML = `
    <div class="story-photo-viewer-inner">
      <button class="story-photo-close" type="button" data-photo-close aria-label="Fechar fotografia ampliada">×</button>
      <img class="story-photo-viewer-image" alt="">
      <div class="story-photo-viewer-footer">
        <div>
          <strong class="story-photo-viewer-title"></strong>
          <p class="story-photo-viewer-credit"></p>
        </div>
        <a class="story-photo-viewer-source" href="#" target="_blank" rel="noopener noreferrer">Ver arquivo e licença na origem</a>
      </div>
    </div>`;
  document.body.append(viewer);

  const largeImage = viewer.querySelector('.story-photo-viewer-image');
  const title = viewer.querySelector('.story-photo-viewer-title');
  const credit = viewer.querySelector('.story-photo-viewer-credit');
  const source = viewer.querySelector('.story-photo-viewer-source');
  const close = viewer.querySelector('[data-photo-close]');
  let lastTrigger = null;

  function hide() {
    if (viewer.open && typeof viewer.close === 'function') viewer.close();
    else viewer.removeAttribute('open');
    lastTrigger?.focus({ preventScroll: true });
  }

  function show(frame, trigger) {
    const image = frame.querySelector('img');
    if (!image || image.dataset.photoUnavailable === 'true') return;
    const origin = frame.dataset.photoSource;
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(origin)) return;
    const caption = frame.querySelector('figcaption .story-photo-caption');
    const attribution = frame.querySelector('figcaption .story-photo-attribution');
    lastTrigger = trigger;

    largeImage.src = image.dataset.large || image.currentSrc || image.src;
    largeImage.alt = image.alt;
    title.textContent = caption?.textContent?.trim() || image.alt;
    credit.textContent = attribution?.textContent?.trim() || 'Fonte: Wikimedia Commons';
    source.href = origin;

    if (typeof viewer.showModal === 'function') viewer.showModal();
    else viewer.setAttribute('open', '');
    close.focus({ preventScroll: true });
  }

  close.addEventListener('click', hide);
  viewer.addEventListener('click', event => {
    if (event.target === viewer) hide();
  });
  viewer.addEventListener('close', () => {
    largeImage.removeAttribute('src');
    lastTrigger?.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && viewer.open) hide();
  });

  frames.forEach(frame => {
    const button = frame.querySelector('[data-photo-open]');
    const image = frame.querySelector('img');
    button?.addEventListener('click', () => show(frame, button));
    image?.addEventListener('error', () => {
      image.dataset.photoUnavailable = 'true';
      frame.classList.add('story-photo-unavailable');
      if (button) button.disabled = true;
      const notice = document.createElement('p');
      notice.className = 'story-photo-fallback';
      notice.textContent = 'A fotografia não carregou. Consulte o arquivo original no crédito abaixo.';
      frame.querySelector('.story-photo-media')?.append(notice);
    }, { once: true });
  });
})();
