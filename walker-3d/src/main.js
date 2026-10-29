import * as THREE from 'three';
import './style.css';
import { DEFAULT_STATE } from './constants.js';
import { createStage } from './scene.js';
import { createWalker } from './walker.js';
import { createControls } from './controls.js';
import { createAnnotations } from './annotations.js';
import { CameraRig } from './cameraRig.js';
import { Tweener } from './tween.js';
import { exportGLB } from './exporter.js';

const container = document.getElementById('app');
const { renderer, labelRenderer, scene, camera, controls: orbit } = createStage(container);

const walker = createWalker();
scene.add(walker.group);

const state = { ...DEFAULT_STATE };
walker.apply(state);

const tweens = new Tweener();
const rig = new CameraRig(camera, orbit);
rig.goTo('threeQuarter');
rig.update(10); // start framed, no tween
const annotations = createAnnotations(scene, walker.anchors, camera, container);

let folded = false;
const ui = createControls(container, state, {
  setHandleHeight: (value) => (state.handleHeight = value),
  setHandleAngle: (value) => (state.handleAngle = value),
  setPanelOpen: (open) => tweens.to(state, 'panelOpen', open ? 1 : 0, 0.75),
  setLocked: (locked) => tweens.to(state, 'lock', locked ? 1 : 0, 0.35),
  async toggleFold() {
    folded = !folded;
    const target = folded;
    ui.setFolded(target);
    if (target && state.panelOpen > 0) {
      ui.setPanelOpen(false);
      await tweens.to(state, 'panelOpen', 0, 0.5); // the perch has to stow before the frames close on it
    }
    if (folded === target) tweens.to(state, 'fold', target ? 1 : 0, 1.4);
  },
  setAnnotations: (on) => annotations.setVisible(on),
  setAutoRotate: (on) => (orbit.autoRotate = on),
  goToView: (name) => rig.goTo(name),
  async exportModel() {
    try {
      const bytes = await exportGLB(walker.group);
      ui.setStatus(`Exported redesigned-walker.glb (${(bytes / 1024).toFixed(0)} KB)`);
    } catch (error) {
      console.error(error);
      ui.setStatus('Export failed, see the console.');
    }
  },
});

const timer = new THREE.Timer();
timer.connect(document);

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const delta = Math.min(timer.getDelta(), 0.1);
  tweens.update(delta);
  walker.apply(state);
  rig.update(delta);
  orbit.update(delta);
  annotations.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

// Handy for debugging and automated screenshots.
window.walkerDebug = { state, rig, orbit, camera, walker, annotations, ui };
