import * as THREE from 'three';
import { easeInOutCubic } from './tween.js';
import { ORBIT_TARGET, getViewInset } from './scene.js';

// Direction from the orbit target plus the half extents (metres) the shot must fit.
const PRESETS = {
  front: { direction: new THREE.Vector3(0, 0.12, 1), halfWidth: 0.42, halfHeight: 0.55 },
  side: { direction: new THREE.Vector3(1, 0.1, 0), halfWidth: 0.4, halfHeight: 0.55 },
  threeQuarter: { direction: new THREE.Vector3(-1.4, 0.5, 1.75), halfWidth: 0.6, halfHeight: 0.58 },
  threeQuarterUser: { direction: new THREE.Vector3(-1.4, 0.35, 1.75), halfWidth: 0.7, halfHeight: 1.0, target: new THREE.Vector3(0, 0.88, -0.1) },
  top: { direction: new THREE.Vector3(0, 1, -0.05), halfWidth: 0.5, halfHeight: 0.32 }, // front points up the screen
};

const DURATION = 0.9;

/** Smooth camera presets: tweens the orbit around the target in spherical coordinates. */
export class CameraRig {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.motion = null;
    controls.addEventListener('start', () => (this.motion = null)); // user input wins
  }

  goTo(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    const toOffset = preset.direction.clone().normalize().multiplyScalar(this.fitDistance(preset));
    const target = preset.target ?? ORBIT_TARGET;
    this.flyTo(toOffset.add(target), target);
  }

  /** Tween to an arbitrary camera position and orbit target (world space). */
  flyTo(position, target) {
    const fromOffset = this.camera.position.clone().sub(this.controls.target);
    this.motion = {
      elapsed: 0,
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      from: new THREE.Spherical().setFromVector3(fromOffset),
      to: new THREE.Spherical().setFromVector3(position.clone().sub(target)),
    };
    // Take the short way round the walker.
    const turn = this.motion.to.theta - this.motion.from.theta;
    this.motion.to.theta -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;
  }

  /** Move camera and target together, e.g. to follow the walker down the room. */
  shift(delta) {
    this.camera.position.add(delta);
    this.controls.target.add(delta);
    if (this.motion) {
      this.motion.fromTarget.add(delta);
      this.motion.toTarget.add(delta);
    }
  }

  /** Distance at which the shot's half extents fit the part of the viewport not covered by the panel. */
  fitDistance({ halfWidth, halfHeight }) {
    const { clientWidth: width, clientHeight: height } = this.camera.userData.container;
    const aspect = (width - getViewInset(width)) / height;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return 1.12 * Math.max(halfHeight / tanHalfFov, halfWidth / (aspect * tanHalfFov));
  }

  update(delta) {
    if (!this.motion) return;
    const motion = this.motion;
    motion.elapsed += delta;
    const progress = Math.min(1, motion.elapsed / DURATION);
    const eased = easeInOutCubic(progress);

    this.controls.target.lerpVectors(motion.fromTarget, motion.toTarget, eased);
    const spherical = new THREE.Spherical(
      THREE.MathUtils.lerp(motion.from.radius, motion.to.radius, eased),
      THREE.MathUtils.lerp(motion.from.phi, motion.to.phi, eased),
      THREE.MathUtils.lerp(motion.from.theta, motion.to.theta, eased),
    );
    this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    this.camera.lookAt(this.controls.target);
    if (progress >= 1) this.motion = null;
  }
}
