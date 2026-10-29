import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS, DIM } from './constants.js';
import { castAndReceive, setHiddenUserData } from './geometry.js';

const LEVER_LOCKED = -0.34; // rad, tip pushed down away from the grip
const LEVER_RELEASED = 0.1; // rad, tip pulled up against the grip

/**
 * Origin on the upright axis at grip height. The grip runs rearward (-Z) from a black mount.
 * userData: setAngle(deg), setLock(0..1), anchors { grip, control }.
 */
export function createHandle(side, materials) {
  const handle = new THREE.Group();
  handle.name = 'Handle';

  const mount = new THREE.Mesh(new RoundedBoxGeometry(0.052, 0.066, 0.07, 5, 0.014), materials.black);
  mount.name = 'HandleMount';
  mount.position.set(0, -0.02, -0.004);
  handle.add(mount);

  // Orange key plate on the outward face, like the reference.
  const keyPlate = new THREE.Mesh(new RoundedBoxGeometry(0.006, 0.034, 0.044, 3, 0.0025), materials.orange);
  keyPlate.name = 'HandleKeyPlate';
  keyPlate.position.set(side * 0.0275, -0.008, 0.002);
  handle.add(keyPlate);

  const indicator = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.0035, 20), materials.indicator);
  indicator.name = 'LockIndicator';
  indicator.position.set(0, 0.0148, 0.016);
  handle.add(indicator);

  // Everything that follows the grip tilt lives in this pivot.
  const tilt = new THREE.Group();
  tilt.name = 'GripTilt';
  handle.add(tilt);

  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.0235, 0.103, 10, 28), materials.black);
  grip.name = 'ErgonomicGrip';
  grip.rotation.x = Math.PI / 2;
  grip.scale.set(1, 1, 0.92); // slightly flattened top to bottom
  grip.position.set(0, 0, -0.095);
  tilt.add(grip);

  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0252, 0.0252, 0.011, 36), materials.orange);
  ring.name = 'GripShoulderRing';
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0, -0.048);
  tilt.add(ring);

  const capProfile = [
    [0, 0],
    [0.0247, 0],
    [0.0247, 0.011],
    [0.0215, 0.0185],
    [0.011, 0.0228],
    [0, 0.0238],
  ].map(([radius, height]) => new THREE.Vector2(radius, height));
  const endCap = new THREE.Mesh(new THREE.LatheGeometry(capProfile, 40), materials.orange);
  endCap.name = 'EndCap';
  endCap.rotation.x = -Math.PI / 2; // lathe axis (+Y) -> -Z, dome points rearward
  endCap.position.set(0, 0, -0.158);
  tilt.add(endCap);

  // Brake / lock lever hanging below the grip.
  const lever = new THREE.Group();
  lever.name = 'LockLever';
  lever.position.set(0, -0.037, -0.058);
  const leverBlade = new THREE.Mesh(new RoundedBoxGeometry(0.017, 0.0085, 0.105, 3, 0.003), materials.black);
  leverBlade.position.z = -0.0525;
  const leverPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 18), materials.orange);
  leverPin.rotation.z = Math.PI / 2;
  const leverTip = new THREE.Mesh(new RoundedBoxGeometry(0.019, 0.0095, 0.014, 3, 0.003), materials.orange);
  leverTip.position.z = -0.1015;
  lever.add(leverBlade, leverPin, leverTip);
  tilt.add(lever);

  // Collar closing the mount over the upright.
  const gripAnchor = new THREE.Object3D();
  gripAnchor.position.set(0, 0.02, -0.11);
  tilt.add(gripAnchor);
  const controlAnchor = new THREE.Object3D();
  controlAnchor.position.set(0, -0.004, -0.06);
  lever.add(controlAnchor);

  handle.userData.setAngle = (degrees) => {
    tilt.rotation.x = -THREE.MathUtils.degToRad(degrees);
  };
  handle.userData.setLock = (locked01) => {
    lever.rotation.x = THREE.MathUtils.lerp(LEVER_RELEASED, LEVER_LOCKED, locked01);
    indicator.material.emissive.set(locked01 > 0.5 ? COLORS.lockOn : COLORS.lockOff);
    indicator.material.emissiveIntensity = THREE.MathUtils.lerp(0.9, 2.4, locked01);
  };
  setHiddenUserData(handle, 'anchors', { grip: gripAnchor, control: controlAnchor });

  return castAndReceive(handle);
}
