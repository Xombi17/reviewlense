import * as THREE from 'three';
import { easeInOutCubic, clamp01 } from './tween.js';
import { standingPose, STANDING_LEAN } from './poses.js';

const ease = easeInOutCubic;
const lerp = THREE.MathUtils.lerp;
const seg = (t, from, to) => clamp01((t - from) / (to - from));
const smooth = (x) => x * x * (3 - 2 * x);

// Walking: the walker jumps ahead, then the user catches up, three times.
const WALK_START = 0.8;
const STRIDE = 0.18; // metres per cycle
const CYCLE = 1.8;
const CYCLES = 3;
const SWING = 0.55;
const WALK_END = CYCLE * CYCLES;
const FIRST_SWING = 0.35;
const SWING_GAP = 0.9;

// Turning in three small pulses.
const TURN_PULSE = 0.42; // rad, about 24 degrees
const TURN_START = 0.4;
const TURN_GAP = 1.1;

// Perching on the unfolded rest panel (hinge at z 0.14, panel 0.14 m deep, top surface 0.515 m).
const SEAT_Z = 0.07;
const SEAT_Y = 0.6;
const SEAT_FEET_Z = -0.3;

const SEATED = { pelvisZ: -0.44, pelvisY: 0.52, lean: 0.32, feetZ: -0.02 };

function pelvisWorldZ(tau, standZ) {
  const clamped = Math.min(tau, WALK_END);
  const cycle = Math.min(Math.floor(clamped / CYCLE), CYCLES - 1);
  const u = clamped >= WALK_END ? 1 : (clamped - cycle * CYCLE) / CYCLE;
  return standZ + STRIDE * (cycle + smooth(seg(u, 0.1, 0.95)));
}

/** Walker, user and feet during the walking step, as functions of the time since the first step. */
function gait(tau, standZ) {
  const clamped = Math.min(Math.max(tau, 0), WALK_END);
  const cycle = Math.min(Math.floor(clamped / CYCLE), CYCLES - 1);
  const u = clamped >= WALK_END ? 1 : (clamped - cycle * CYCLE) / CYCLE;
  const walkerStep = ease(seg(u, 0, 0.4));
  const userStep = smooth(seg(u, 0.1, 0.95));
  const lag = STRIDE * (walkerStep - userStep);
  const pairZ = STRIDE * (cycle + walkerStep);

  const feet = { left: standZ + 0.02, right: standZ + 0.02 };
  const lifts = { left: 0, right: 0 };
  for (let k = 0; k < CYCLES * 2; k++) {
    const side = k % 2 === 0 ? 'left' : 'right';
    const start = FIRST_SWING + SWING_GAP * k;
    if (clamped < start) continue;
    const plant = pelvisWorldZ(start + SWING / 2, standZ) + 0.06;
    const local = seg(clamped, start, start + SWING);
    const from = feet[side];
    feet[side] = lerp(from, plant, ease(local));
    lifts[side] = local < 1 ? 0.07 * Math.sin(Math.PI * local) : 0;
  }
  return {
    pairZ,
    lift: 0.035 * Math.sin(Math.PI * seg(u, 0, 0.4)),
    pelvisRelZ: standZ - lag,
    lean: STANDING_LEAN + 2 * lag,
    feetWorld: feet,
    lifts,
  };
}

const WALK_STEPS = [
  { title: 'Standing up', caption: 'Use the handles for support while standing up.', duration: 5.2 },
  { title: 'Walking with support', caption: 'Move forward with stable and balanced support.', duration: WALK_START + WALK_END + 0.4 },
  { title: 'Turning carefully', caption: 'Lift slightly and turn with small steps.', duration: 4.4 },
  { title: 'Using the fold-down rest panel', caption: 'Unfold the panel to take a short rest. It does not protrude when folded.', duration: 6.4 },
  { title: 'Compact folding for storage', caption: 'Simple fold mechanism for easy storage and transport.', duration: 4.2 },
];

/**
 * Guided walkthrough of the five sheet steps. Every step is a pure function of its own clock, so Back, Next and
 * replay just reset the clock. Steps are written so that a step starts exactly where the previous one ends.
 */
export function createWalkthrough(context) {
  const { container, state, pair, user, chair, ticks, rig, getGrips, recommendedHeight, onActiveChange, cancelTweens } = context;

  const card = document.createElement('section');
  card.className = 'walkthrough';
  card.hidden = true;
  card.setAttribute('aria-label', 'Walker walkthrough');
  card.innerHTML = `
    <div class="wt-main">
      <ol class="wt-steps">${WALK_STEPS.map((step, index) => `<li><button type="button" data-step="${index}" aria-label="Step ${index + 1}: ${step.title}">${index + 1}</button></li>`).join('')}</ol>
      <h2 class="wt-title"></h2>
      <p class="wt-caption" aria-live="polite"></p>
    </div>
    <div class="wt-actions">
      <button type="button" class="button small" data-action="back">Back</button>
      <button type="button" class="button small" data-action="play">Pause</button>
      <button type="button" class="button small primary-ish" data-action="next">Next</button>
      <button type="button" class="button small" data-action="exit">Exit</button>
    </div>
    <div class="wt-progress"><i></i></div>`;
  container.appendChild(card);
  const $ = (selector) => card.querySelector(selector);

  let active = false;
  let index = 0;
  let clock = 0;
  let playing = false;
  let hold = 0;
  let snapshot = null;
  let standZ = 0;
  let standY = 0.9;
  let followZ = 0;
  let pending = null;

  const grips = () => getGrips();
  const gripZ = () => {
    const { left, right } = grips();
    return (left.z + right.z) / 2;
  };

  function setPair(pairZ, yaw, lift) {
    const centreZ = standZ;
    pair.rotation.y = yaw;
    pair.position.set(0, lift, pairZ + centreZ - centreZ * Math.cos(yaw));
    pair.position.x = -centreZ * Math.sin(yaw);
    pair.updateMatrixWorld(true);
  }

  /** Pose, pair transform and walker state for step `step` at time `t` (all absolute, no memory). */
  function apply(step, t) {
    let pairZ = 0;
    let yaw = 0;
    let lift = 0;
    let lap = 0;
    let pose;
    const stand = standingPose(user, gripZ());
    const feetX = stand.right.x;
    const endGait = gait(WALK_END, 0);
    const endFeetPair = {
      left: standZ + (endGait.feetWorld.left - endGait.pairZ),
      right: standZ + (endGait.feetWorld.right - endGait.pairZ),
    };
    const endZ = endGait.pairZ;
    const endYaw = TURN_PULSE * 3;

    state.panelOpen = 0;
    state.fold = 0;
    chair.visible = step === 0;
    ticks.visible = step === 1;
    user.setOpacity(1);
    user.group.visible = true;

    if (step === 0) {
      const u = seg(t, 0.8, 4.2);
      const scoot = ease(seg(u, 0, 0.35));
      const zProgress = ease(seg(u, 0, 0.75));
      const yProgress = ease(seg(u, 0.25, 1));
      const feetZ = lerp(SEATED.feetZ, standZ + 0.02, scoot);
      pose = {
        pelvisZ: lerp(SEATED.pelvisZ, standZ, zProgress),
        pelvisY: lerp(SEATED.pelvisY, standY, yProgress),
        lean: lerp(SEATED.lean, STANDING_LEAN, ease(u)) + 0.35 * Math.sin(Math.PI * u),
        yaw: 0,
        left: { x: -feetX, z: feetZ, y: 0 },
        right: { x: feetX, z: feetZ, y: 0 },
      };
    } else if (step === 1) {
      const g = gait(t - WALK_START, 0);
      pairZ = g.pairZ;
      lift = g.lift;
      pose = {
        pelvisZ: standZ + g.pelvisRelZ,
        lean: g.lean,
        yaw: 0,
        left: { x: -feetX, z: standZ + (g.feetWorld.left - g.pairZ), y: g.lifts.left },
        right: { x: feetX, z: standZ + (g.feetWorld.right - g.pairZ), y: g.lifts.right },
      };
    } else if (step === 2) {
      pairZ = endZ;
      let turn = 0;
      for (let k = 0; k < 3; k++) {
        const local = seg(t, TURN_START + TURN_GAP * k, TURN_START + TURN_GAP * k + 0.8);
        turn += ease(local) * TURN_PULSE;
        lift = Math.max(lift, 0.03 * Math.sin(Math.PI * local));
      }
      yaw = turn;
      const swing = (from, to) => 0.035 * Math.sin(Math.PI * seg(t, from, to));
      pose = {
        pelvisZ: standZ,
        lean: STANDING_LEAN,
        yaw: 0,
        left: { x: -feetX, z: endFeetPair.left, y: Math.max(swing(0.5, 1.0), swing(2.7, 3.2)) },
        right: { x: feetX, z: endFeetPair.right, y: swing(1.6, 2.1) },
      };
    } else if (step === 3) {
      pairZ = endZ;
      yaw = endYaw;
      state.panelOpen = ease(seg(t, 0, 1.2));
      lap = ease(seg(t, 1.0, 1.8));
      const turn = Math.PI * ease(seg(t, 1.4, 2.8));
      const sit = seg(t, 2.9, 5.0);
      const feet = ease(seg(t, 3.0, 4.6));
      const stepLift = (from, to) => 0.04 * Math.sin(Math.PI * seg(t, from, to));
      pose = {
        pelvisZ: lerp(standZ, SEAT_Z, ease(seg(sit, 0, 0.7))),
        pelvisY: lerp(standY, SEAT_Y, ease(seg(sit, 0.25, 1))),
        lean: lerp(STANDING_LEAN, 0.05, ease(sit)),
        yaw: turn,
        left: { x: -feetX, z: lerp(endFeetPair.left, SEAT_FEET_Z, feet), y: stepLift(1.4, 2.1) },
        right: { x: feetX, z: lerp(endFeetPair.right, SEAT_FEET_Z, feet), y: stepLift(2.1, 2.8) },
      };
    } else {
      pairZ = endZ;
      yaw = endYaw;
      state.panelOpen = 1 - ease(seg(t, 0.5, 1.4));
      state.fold = ease(seg(t, 1.4, 3.2));
      user.setOpacity(1 - seg(t, 0, 0.6));
      user.group.visible = t < 0.6;
      lap = 1;
      pose = {
        pelvisZ: SEAT_Z,
        pelvisY: SEAT_Y,
        lean: 0.05,
        yaw: Math.PI,
        left: { x: -feetX, z: SEAT_FEET_Z, y: 0 },
        right: { x: feetX, z: SEAT_FEET_Z, y: 0 },
      };
    }

    setPair(pairZ, yaw, lift);
    pending = { pose, lap };
  }

  /** Called once the walker has been posed for this frame, so the hands meet the grips where they really are. */
  function commitUser() {
    if (!active || !pending || !user.group.visible) return;
    user.update(pending.pose, grips(), pending.lap);
  }

  function cameraFor(step) {
    // Poses are written in the walker's space and carried to the world by the pair transform.
    const world = (x, y, z) => pair.localToWorld(new THREE.Vector3(x, y, z));
    switch (step) {
      case 0:
        return [world(2.9, 1.0, 0.5), world(0, 0.62, -0.2)];
      case 1:
        return [world(3.1, 1.1, 1.6), world(0, 0.75, 0.1)];
      case 2:
        return [world(-2.8, 1.6, 1.7), world(0, 0.8, -0.1)];
      case 3:
        return [world(2.6, 1.1, -2.6), world(0, 0.6, -0.05)];
      default:
        return [world(-1.8, 1.0, 2.3), world(0, 0.42, 0)];
    }
  }

  function render() {
    const step = WALK_STEPS[index];
    $('.wt-title').textContent = `${index + 1}. ${step.title}`;
    $('.wt-caption').textContent = step.caption;
    card.querySelectorAll('[data-step]').forEach((button, i) => {
      button.classList.toggle('done', i < index);
      button.classList.toggle('current', i === index);
      button.setAttribute('aria-current', i === index ? 'step' : 'false');
    });
    const finished = clock >= step.duration;
    $('[data-action=play]').textContent = playing ? 'Pause' : finished ? 'Replay' : 'Play';
    $('[data-action=back]').disabled = index === 0;
    $('[data-action=next]').disabled = index === WALK_STEPS.length - 1;
    $('.wt-progress i').style.width = `${(clamp01(clock / step.duration) * 100).toFixed(1)}%`;
  }

  function go(next) {
    index = Math.min(WALK_STEPS.length - 1, Math.max(0, next));
    clock = 0;
    hold = 0;
    playing = true;
    apply(index, 0);
    const [position, target] = cameraFor(index);
    rig.flyTo(position, target);
    followZ = pair.position.z;
    render();
  }

  function onKey(event) {
    if (!active) return;
    if (event.key === 'Escape') stop();
    else if (event.key === 'ArrowRight') go(index + 1);
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === ' ' && event.target === document.body) {
      event.preventDefault();
      togglePlay();
    }
  }

  /** Jump to a moment inside the current step and hold there. */
  function seek(seconds) {
    clock = Math.min(WALK_STEPS[index].duration, Math.max(0, seconds));
    playing = false;
    apply(index, clock);
    render();
  }

  function togglePlay() {
    if (clock >= WALK_STEPS[index].duration) {
      go(index);
      return;
    }
    playing = !playing;
    render();
  }

  card.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.step !== undefined) go(Number(button.dataset.step));
    else if (button.dataset.action === 'back') go(index - 1);
    else if (button.dataset.action === 'next') go(index + 1);
    else if (button.dataset.action === 'play') togglePlay();
    else if (button.dataset.action === 'exit') stop();
  });
  window.addEventListener('keydown', onKey);

  function start() {
    if (active) return;
    snapshot = { ...state };
    cancelTweens();
    active = true;
    onActiveChange(true);
    state.handleHeight = recommendedHeight();
    state.handleAngle = 10;
    state.lock = 1;
    state.panelOpen = 0;
    state.fold = 0;
    context.walker.apply(state);
    pair.position.set(0, 0, 0);
    pair.rotation.set(0, 0, 0);
    pair.updateMatrixWorld(true);
    standZ = standingPose(user, gripZ()).pelvisZ;
    standY = user.standingPelvisY();
    card.hidden = false;
    go(0);
  }

  function stop() {
    if (!active) return;
    active = false;
    card.hidden = true;
    pair.position.set(0, 0, 0);
    pair.rotation.set(0, 0, 0);
    pair.updateMatrixWorld(true);
    chair.visible = false;
    ticks.visible = false;
    user.setOpacity(1);
    Object.assign(state, snapshot);
    onActiveChange(false);
    rig.goTo('threeQuarter');
  }

  function update(delta) {
    if (!active) return;
    const step = WALK_STEPS[index];
    if (playing) {
      clock = Math.min(step.duration, clock + delta);
      apply(index, clock);
      if (clock >= step.duration) {
        playing = false;
        hold = 0;
      }
    } else if (clock >= step.duration && index < WALK_STEPS.length - 1) {
      hold += delta;
      if (hold > 1.4) go(index + 1);
    }
    if (index === 1) {
      rig.shift(new THREE.Vector3(0, 0, pair.position.z - followZ));
    }
    followZ = pair.position.z;
    render();
  }

  return {
    start,
    stop,
    update,
    commitUser,
    seek,
    get active() {
      return active;
    },
    go,
    steps: WALK_STEPS,
  };
}
