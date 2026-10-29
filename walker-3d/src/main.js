import * as THREE from 'three';
import './style.css';
import { DEFAULT_STATE } from './constants.js';
import { createStage } from './scene.js';
import { createWalker } from './walker.js';
import { createExistingWalker } from './existing.js';
import { createMannequin } from './mannequin.js';
import { createChair, createFloorTicks } from './props.js';
import { createControls } from './controls.js';
import { createAnnotations } from './annotations.js';
import { createCompareOverlay } from './compare.js';
import { createWalkthrough } from './walkthrough.js';
import { standingPose } from './poses.js';
import { DEFAULT_STATURE, assessFit, recommendedHandleHeight } from './ergonomics.js';
import { CameraRig } from './cameraRig.js';
import { Tweener } from './tween.js';
import { exportGLB } from './exporter.js';

const container = document.getElementById('app');
const { renderer, labelRenderer, scene, camera, controls: orbit, setLayout } = createStage(container);

// The walker, the walker it replaces and the user share one transform so the walkthrough can move them together.
const walker = createWalker();
const existing = createExistingWalker();
existing.visible = false;
const user = createMannequin();
user.setStature(DEFAULT_STATURE / 100);
user.group.visible = false;
const pair = new THREE.Group();
pair.name = 'WalkerAndUser';
pair.add(walker.group, existing, user.group);

const chair = createChair();
chair.position.z = -0.46;
chair.visible = false;
const ticks = createFloorTicks();
scene.add(pair, chair, ticks);

const state = { ...DEFAULT_STATE };
walker.apply(state);

const view = { mode: 'redesigned', showUser: false, stature: DEFAULT_STATURE, notes: false };

const tweens = new Tweener();
const rig = new CameraRig(camera, orbit);
rig.goTo('threeQuarter');
rig.update(10); // start framed, no tween
const annotations = createAnnotations(scene, walker.anchors, camera, container);

const compare = createCompareOverlay(container);

const _world = new THREE.Vector3();
const toPair = (object) => pair.worldToLocal(object.getWorldPosition(_world.set(0, 0, 0)).clone());
function getGrips() {
  const grips =
    view.mode === 'existing'
      ? { left: existing.userData.anchors.leftGrip, right: existing.userData.anchors.rightGrip }
      : walker.grips;
  return { left: toPair(grips.left), right: toPair(grips.right) };
}

let walkthrough;
function refreshVisibility() {
  annotations.setVisible(view.notes && view.mode === 'redesigned' && !walkthrough?.active);
  compare.setActive(view.mode === 'compare' && !walkthrough?.active);
}

function setMode(mode) {
  view.mode = mode;
  ui.setMode(mode);
  ui.setUserToggleEnabled(mode !== 'compare');
  refreshVisibility();
}

/** Show or hide the mannequin and frame the camera so the whole person is in view. */
function showUser(on, syncToggle = true) {
  view.showUser = on;
  if (syncToggle) ui.setShowUser(on);
  rig.goTo(on ? 'threeQuarterUser' : 'threeQuarter');
}

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
  setAnnotations(on) {
    view.notes = on;
    refreshVisibility();
  },
  setAutoRotate: (on) => (orbit.autoRotate = on),
  goToView: (name) => rig.goTo(name),
  setMode,
  setStature(centimetres) {
    view.stature = centimetres;
    user.setStature(centimetres / 100);
    if (!view.showUser && view.mode !== 'compare') showUser(true);
  },
  setShowUser: (on) => showUser(on, false),
  fitHandle() {
    const height = recommendedHandleHeight(view.stature);
    tweens.to(state, 'handleHeight', height, 0.5);
    ui.setHandleHeight(height);
    if (!view.showUser) showUser(true);
  },
  startWalkthrough: () => walkthrough.start(),
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

let savedUi = null;
walkthrough = createWalkthrough({
  container,
  state,
  pair,
  user,
  chair,
  ticks,
  rig,
  walker,
  getGrips,
  recommendedHeight: () => recommendedHandleHeight(view.stature),
  cancelTweens: () => tweens.clear(),
  onActiveChange(active) {
    if (active) {
      savedUi = { mode: view.mode, autoRotate: orbit.autoRotate };
      orbit.autoRotate = false;
      view.mode = 'redesigned';
      ui.setMode('redesigned');
    } else if (savedUi) {
      orbit.autoRotate = savedUi.autoRotate;
      setMode(savedUi.mode);
    }
    ui.setWalkthroughActive(active);
    // The tour hides the control panel and shows a caption card at the bottom.
    setLayout(active ? { fov: 40, left: 0, bottom: window.innerWidth < 700 ? 190 : 130 } : { fov: null, left: null, bottom: 0 });
    refreshVisibility();
  },
});

// Keep the fit readout current without touching the DOM every frame.
let lastFit = '';
function updateFitReadout() {
  const assessment = assessFit(user.metrics);
  const key = `${assessment.label}|${assessment.detail}|${view.stature}`;
  if (key === lastFit) return;
  lastFit = key;
  ui.setFit(assessment, recommendedHandleHeight(view.stature));
}

function poseIdleUser() {
  user.group.visible = view.showUser && view.mode !== 'compare';
  const grips = getGrips();
  const gripZ = (grips.left.z + grips.right.z) / 2;
  user.update(standingPose(user, gripZ), grips, 0);
  updateFitReadout();
}

function renderFrame() {
  if (view.mode === 'compare' && !walkthrough.active) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const split = Math.round(width * compare.position);
    renderer.setScissorTest(true);
    renderer.setViewport(0, 0, width, height);
    walker.group.visible = false;
    existing.visible = true;
    renderer.setScissor(0, 0, split, height);
    renderer.render(scene, camera);
    walker.group.visible = true;
    existing.visible = false;
    renderer.setScissor(split, 0, width - split, height);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
  } else {
    walker.group.visible = view.mode !== 'existing' || walkthrough.active;
    existing.visible = view.mode === 'existing' && !walkthrough.active;
    renderer.render(scene, camera);
  }
}

const timer = new THREE.Timer();
timer.connect(document);

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const delta = Math.min(timer.getDelta(), 0.1);
  tweens.update(delta);
  walkthrough.update(delta);
  walker.apply(state);
  pair.updateMatrixWorld(true);
  if (walkthrough.active) walkthrough.commitUser();
  else poseIdleUser();
  rig.update(delta);
  orbit.update(delta);
  annotations.update();
  renderFrame();
  labelRenderer.render(scene, camera);
});

// Handy for debugging and automated screenshots.
window.walkerDebug = { state, view, rig, orbit, camera, walker, existing, user, pair, chair, annotations, ui, walkthrough, compare, setMode };
