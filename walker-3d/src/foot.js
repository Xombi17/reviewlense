import * as THREE from 'three';
import { DIM } from './constants.js';
import { castAndReceive, createContactBlob } from './geometry.js';

// Flared, tapered rubber foot (profile spun with LatheGeometry) with a thin orange ring at the top.
const PROFILE = [
  [0, 0],
  [0.045, 0],
  [0.0505, 0.004],
  [0.0515, 0.012],
  [0.049, 0.026],
  [0.0405, 0.045],
  [0.0315, 0.063],
  [0.0252, 0.078],
  [0.0238, 0.086],
  [0, 0.086],
].map(([radius, height]) => new THREE.Vector2(radius, height));

/** Origin at the floor, axis vertical. The tube plugs in at (0, DIM.footHeight, 0). */
export function createFoot(materials) {
  const foot = new THREE.Group();
  foot.name = 'Foot';

  const rubber = new THREE.Mesh(new THREE.LatheGeometry(PROFILE, 56), materials.rubber);
  rubber.name = 'RubberFoot';
  foot.add(rubber);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0252, 0.0042, 14, 48), materials.orange);
  ring.name = 'FootRing';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = DIM.footHeight - 0.002;
  foot.add(ring);

  foot.add(createContactBlob(0.115, 0.42));
  return castAndReceive(foot);
}
