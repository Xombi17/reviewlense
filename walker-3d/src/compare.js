const EXISTING_POINTS = [
  'Fixed handle height and angle',
  'No dedicated rest support',
  'Difficult to manoeuvre',
  'No clear lock or brake indication',
  'Bulky to fold and store',
];
const REDESIGNED_POINTS = [
  'Stable and sturdy support',
  'Height and angle adjustable handles',
  'Optional fold-down rest panel',
  'Lightweight and compact',
  'Intuitive lock controls',
  'Better stability and balance',
];

const list = (points, className, mark) =>
  `<ul class="${className}">${points.map((point) => `<li><span aria-hidden="true">${mark}</span>${point}</li>`).join('')}</ul>`;

/**
 * Before/after overlay: a draggable wipe divider (existing walker on the left, redesigned on the right) and the two
 * point lists from the product sheet. `onMove` receives the divider position as a 0..1 fraction of the width.
 */
export function createCompareOverlay(container, onMove) {
  const overlay = document.createElement('div');
  overlay.className = 'compare';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="compare-tag compare-tag--left">Existing walker</div>
    <div class="compare-tag compare-tag--right">Redesigned walker</div>
    <div class="wipe" role="slider" tabindex="0" aria-label="Compare existing and redesigned walker" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
      <span class="wipe-line"></span>
      <span class="wipe-knob" aria-hidden="true">&#8596;</span>
    </div>
    <section class="compare-card compare-card--left" aria-label="Existing walker problems">
      ${list(EXISTING_POINTS, 'cons', '&#10005;')}
    </section>
    <section class="compare-card compare-card--right" aria-label="Redesigned walker benefits">
      ${list(REDESIGNED_POINTS, 'pros', '&#10003;')}
    </section>`;
  container.appendChild(overlay);

  const wipe = overlay.querySelector('.wipe');
  const tagLeft = overlay.querySelector('.compare-tag--left');
  const tagRight = overlay.querySelector('.compare-tag--right');
  let position = 0.5;

  function setPosition(fraction) {
    position = Math.min(0.96, Math.max(0.04, fraction));
    const percent = position * 100;
    wipe.style.left = `${percent}%`;
    wipe.setAttribute('aria-valuenow', String(Math.round(percent)));
    tagLeft.style.right = `calc(${100 - percent}% + 14px)`;
    tagRight.style.left = `calc(${percent}% + 14px)`;
    onMove?.(position);
  }

  const fractionFrom = (event) => {
    const box = container.getBoundingClientRect();
    return (event.clientX - box.left) / box.width;
  };
  wipe.addEventListener('pointerdown', (event) => {
    wipe.setPointerCapture(event.pointerId);
    wipe.classList.add('dragging');
    setPosition(fractionFrom(event));
  });
  wipe.addEventListener('pointermove', (event) => {
    if (wipe.hasPointerCapture(event.pointerId)) setPosition(fractionFrom(event));
  });
  const endDrag = (event) => {
    wipe.classList.remove('dragging');
    if (wipe.hasPointerCapture(event.pointerId)) wipe.releasePointerCapture(event.pointerId);
  };
  wipe.addEventListener('pointerup', endDrag);
  wipe.addEventListener('pointercancel', endDrag);
  wipe.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 0.1 : 0.03;
    if (event.key === 'ArrowLeft') setPosition(position - step);
    else if (event.key === 'ArrowRight') setPosition(position + step);
    else return;
    event.preventDefault();
  });

  setPosition(0.5);
  return {
    get position() {
      return position;
    },
    setPosition,
    setActive(active) {
      overlay.hidden = !active;
    },
  };
}
