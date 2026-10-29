import { DIM } from './constants.js';

const toggleRow = (id, label, stateId, initial) => `
  <label class="switch">
    <input type="checkbox" id="${id}" ${initial ? 'checked' : ''} />
    <span class="track"></span>
    <span class="switch-text">${label} <b id="${stateId}"></b></span>
  </label>`;

/**
 * Builds the control panel (top-left). Emits through `actions`, and returns setters so main.js can
 * keep the UI in step when the model changes things itself (e.g. folding closes the rest panel).
 */
export function createControls(container, initial, actions) {
  const [minHeight, maxHeight] = DIM.heightRange;
  const [minAngle, maxAngle] = DIM.angleRange;

  const panel = document.createElement('aside');
  panel.className = 'control-panel';
  panel.setAttribute('aria-label', 'Walker controls');
  panel.innerHTML = `
    <header>
      <div>
        <h1>Redesigned Walker</h1>
        <p>HMI course project · interactive 3D</p>
      </div>
      <button type="button" class="collapse" aria-expanded="true" aria-label="Collapse controls">–</button>
    </header>
    <div class="panel-body">
      <section>
        <h2>Handle</h2>
        <label class="slider">
          <span>Height</span><output id="height-out"></output>
          <input type="range" id="height" min="${minHeight}" max="${maxHeight}" step="0.005" value="${initial.handleHeight}" />
        </label>
        <label class="slider">
          <span>Angle</span><output id="angle-out"></output>
          <input type="range" id="angle" min="${minAngle}" max="${maxAngle}" step="1" value="${initial.handleAngle}" />
        </label>
      </section>
      <section>
        <h2>Mechanisms</h2>
        ${toggleRow('panel-toggle', 'Rest panel', 'panel-state', initial.panelOpen > 0.5)}
        <div class="lock-row">
          ${toggleRow('lock-toggle', 'Lock lever', 'lock-state', initial.lock > 0.5)}
          <i class="led" id="lock-led" aria-hidden="true"></i>
        </div>
        <button type="button" class="button" id="fold-button">Fold for storage</button>
      </section>
      <section>
        <h2>View</h2>
        ${toggleRow('notes-toggle', 'Annotations', 'notes-state', false)}
        ${toggleRow('rotate-toggle', 'Auto-rotate', 'rotate-state', false)}
        <div class="presets" role="group" aria-label="Camera presets">
          <button type="button" class="button small" data-view="front">Front</button>
          <button type="button" class="button small" data-view="side">Side</button>
          <button type="button" class="button small" data-view="threeQuarter">3/4</button>
          <button type="button" class="button small" data-view="top">Top</button>
        </div>
      </section>
      <button type="button" class="button primary" id="export-button">Export GLB</button>
      <p class="status" id="status" role="status"></p>
    </div>`;
  container.appendChild(panel);

  const $ = (selector) => panel.querySelector(selector);
  const heightInput = $('#height');
  const angleInput = $('#angle');
  const panelToggle = $('#panel-toggle');
  const lockToggle = $('#lock-toggle');
  const foldButton = $('#fold-button');

  const setText = (id, text) => ($(id).textContent = text);
  const showHeight = (value) => setText('#height-out', `${Number(value).toFixed(2)} m`);
  const showAngle = (value) => setText('#angle-out', `${value}°`);
  const showPanel = (open) => setText('#panel-state', open ? '· unfolded' : '· folded');
  const showLock = (locked) => {
    setText('#lock-state', locked ? '· locked' : '· released');
    $('#lock-led').classList.toggle('on', locked);
  };
  const showNotes = (on) => setText('#notes-state', on ? '· on' : '· off');
  const showRotate = (on) => setText('#rotate-state', on ? '· on' : '· off');
  const showFold = (folded) => {
    foldButton.textContent = folded ? 'Unfold walker' : 'Fold for storage';
    foldButton.classList.toggle('active', folded);
    panelToggle.disabled = folded;
  };

  showHeight(initial.handleHeight);
  showAngle(initial.handleAngle);
  showPanel(initial.panelOpen > 0.5);
  showLock(initial.lock > 0.5);
  showNotes(false);
  showRotate(false);
  showFold(false);

  heightInput.addEventListener('input', () => {
    showHeight(heightInput.value);
    actions.setHandleHeight(Number(heightInput.value));
  });
  angleInput.addEventListener('input', () => {
    showAngle(angleInput.value);
    actions.setHandleAngle(Number(angleInput.value));
  });
  panelToggle.addEventListener('change', () => {
    showPanel(panelToggle.checked);
    actions.setPanelOpen(panelToggle.checked);
  });
  lockToggle.addEventListener('change', () => {
    showLock(lockToggle.checked);
    actions.setLocked(lockToggle.checked);
  });
  foldButton.addEventListener('click', () => actions.toggleFold());
  $('#notes-toggle').addEventListener('change', (event) => {
    showNotes(event.target.checked);
    actions.setAnnotations(event.target.checked);
  });
  $('#rotate-toggle').addEventListener('change', (event) => {
    showRotate(event.target.checked);
    actions.setAutoRotate(event.target.checked);
  });
  panel.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => actions.goToView(button.dataset.view));
  });
  const exportButton = $('#export-button');
  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    try {
      await actions.exportModel();
    } finally {
      exportButton.disabled = false;
    }
  });

  const collapse = $('.collapse');
  const setCollapsed = (collapsed) => {
    panel.classList.toggle('collapsed', collapsed);
    collapse.textContent = collapsed ? '+' : '–';
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.setAttribute('aria-label', collapsed ? 'Expand controls' : 'Collapse controls');
  };
  collapse.addEventListener('click', () => setCollapsed(!panel.classList.contains('collapsed')));
  if (window.innerWidth < 600) setCollapsed(true);

  return {
    setPanelOpen(open) {
      panelToggle.checked = open;
      showPanel(open);
    },
    setFolded: showFold,
    setStatus(text) {
      $('#status').textContent = text;
    },
  };
}
