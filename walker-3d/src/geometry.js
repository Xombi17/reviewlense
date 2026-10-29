import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

/** Keeps Object3D references out of glTF `extras` (they are circular, so JSON.stringify would choke). */
export function setHiddenUserData(object, key, value) {
  Object.defineProperty(object.userData, key, { value, enumerable: false, writable: true, configurable: true });
}

export function castAndReceive(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

/** Cylinder from point a to point b. */
export function tubeBetween(a, b, radius, material, radialSegments = 40) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments), material);
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  return castAndReceive(mesh);
}

/** Chamfered ring that slips over a tube. `axis` is the tube direction at `point`. */
export function collarAt(point, axis, radius, length, material) {
  const half = length / 2;
  const edge = Math.min(0.0025, length / 4);
  const profile = [
    new THREE.Vector2(0, -half),
    new THREE.Vector2(radius - edge, -half),
    new THREE.Vector2(radius, -half + edge),
    new THREE.Vector2(radius, half - edge),
    new THREE.Vector2(radius - edge, half),
    new THREE.Vector2(0, half),
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), material);
  mesh.position.copy(point);
  mesh.quaternion.setFromUnitVectors(UP, axis.clone().normalize());
  return castAndReceive(mesh);
}

/** Dark discs sitting on a tube surface, merged into one mesh. `normals` are the directions the holes face. */
export function adjustmentHoles({ from, to, spacing, tubeRadius, normals, material, holeRadius = 0.0036 }) {
  const axis = new THREE.Vector3().subVectors(to, from);
  const length = axis.length();
  axis.normalize();
  const count = Math.floor(length / spacing) + 1;
  const discs = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  for (let step = 0; step < count; step++) {
    const centre = from.clone().addScaledVector(axis, step * spacing);
    for (const normal of normals) {
      const unitNormal = normal.clone().normalize();
      quaternion.setFromUnitVectors(FORWARD, unitNormal);
      const position = centre.clone().addScaledVector(unitNormal, tubeRadius + 0.0007);
      const disc = new THREE.CircleGeometry(holeRadius, 14);
      disc.applyMatrix4(matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1)));
      discs.push(disc);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(discs), material);
  mesh.name = 'AdjustmentHoles';
  return mesh;
}

/** Soft radial blob used as a fake contact shadow. */
let blobTexture;
export function createContactBlob(radius, opacity = 0.55) {
  if (!blobTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.35, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    blobTexture = new THREE.CanvasTexture(canvas);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, opacity, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.0008;
  mesh.name = 'ContactShadow';
  mesh.userData.excludeFromExport = true;
  mesh.renderOrder = 1;
  return mesh;
}
