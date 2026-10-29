import * as THREE from 'three';
import { tubeBetween, collarAt, castAndReceive } from './geometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const HEIGHT = 0.868; // fixed (grips at 0.85 m, the right height for a 170 cm user)
const HALF_WIDTH = 0.25;
const FRONT_Z = 0.14;
const REAR_Z = -0.19;
const TUBE = 0.0125;

const point = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * The walker being replaced: fixed-height frame, straight legs, plain grips, a cross brace and no rest panel.
 * Returns a Group with `userData.anchors` { leftGrip, rightGrip } for the mannequin's hands.
 */
export function createExistingWalker() {
  const group = new THREE.Group();
  group.name = 'ExistingWalker';

  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.85, roughness: 0.38 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.75 });
  const tip = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.8 });
  const bracket = new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.5, metalness: 0.4 });

  const tipProfile = [
    [0, 0],
    [0.026, 0],
    [0.028, 0.006],
    [0.022, 0.036],
    [0.0185, 0.05],
    [0, 0.05],
  ].map(([radius, height]) => new THREE.Vector2(radius, height));
  const tipGeometry = new THREE.LatheGeometry(tipProfile, 28);

  const anchors = {};
  for (const side of [-1, 1]) {
    const x = side * HALF_WIDTH;
    const legTop = HEIGHT - 0.03;
    // Slightly splayed legs, as on a basic folding frame.
    const frontBottom = point(x + side * 0.012, 0.045, FRONT_Z + 0.01);
    const rearBottom = point(x + side * 0.012, 0.045, REAR_Z - 0.01);
    group.add(tubeBetween(frontBottom, point(x, legTop, FRONT_Z), TUBE, steel, 24));
    group.add(tubeBetween(rearBottom, point(x, legTop, REAR_Z), TUBE, steel, 24));
    // Top rail with rounded corners.
    for (const z of [FRONT_Z, REAR_Z]) {
      const corner = new THREE.Mesh(new THREE.SphereGeometry(TUBE, 20, 14), steel);
      corner.position.set(x, legTop, z);
      group.add(castAndReceive(corner));
    }
    group.add(tubeBetween(point(x, legTop, FRONT_Z), point(x, legTop, REAR_Z), TUBE, steel, 24));
    group.add(tubeBetween(point(x, legTop, FRONT_Z), point(x, HEIGHT - 0.012, FRONT_Z), TUBE, steel, 24));

    // Plain foam grip on the rear half of the rail.
    const gripMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.0205, 0.0205, 0.13, 28), grip);
    gripMesh.rotation.x = Math.PI / 2;
    gripMesh.position.set(x, legTop + 0.012, -0.07);
    group.add(castAndReceive(gripMesh));
    for (const z of [-0.005, -0.135]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 20, 12), grip);
      cap.scale.z = 0.5;
      cap.position.set(x, legTop + 0.012, z);
      group.add(castAndReceive(cap));
    }

    // Rubber tips and a plain pin collar on each leg.
    for (const [bottom, z] of [[frontBottom, FRONT_Z + 0.01], [rearBottom, REAR_Z - 0.01]]) {
      const tipMesh = new THREE.Mesh(tipGeometry, tip);
      tipMesh.position.set(bottom.x, 0, z);
      group.add(castAndReceive(tipMesh));
      group.add(collarAt(point(bottom.x, 0.2, z), new THREE.Vector3(0, 1, 0), TUBE * 1.45, 0.045, bracket));
    }

    const gripAnchor = new THREE.Object3D();
    gripAnchor.position.set(x, legTop + 0.012, -0.07);
    group.add(gripAnchor);
    anchors[side < 0 ? 'leftGrip' : 'rightGrip'] = gripAnchor;
  }

  // Cross braces: one at rail height and one lower, both at the front.
  for (const y of [HEIGHT - 0.03, 0.48]) {
    group.add(tubeBetween(point(-HALF_WIDTH, y, FRONT_Z), point(HALF_WIDTH, y, FRONT_Z), TUBE * 0.9, steel, 24));
  }
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.05, 0.03, 3, 0.008), bracket);
  plate.position.set(0, 0.48, FRONT_Z);
  group.add(castAndReceive(plate));

  Object.defineProperty(group.userData, 'anchors', { value: anchors, enumerable: false });
  return group;
}
