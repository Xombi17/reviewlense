import * as THREE from 'three';
import { COLORS } from './constants.js';

/** Fine streaks running along the tube (u wraps around, v runs along the length) for a brushed look. */
function createBrushedRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 8;
  const context = canvas.getContext('2d');
  for (let x = 0; x < canvas.width; x++) {
    const streak = 175 + Math.random() * 80;
    context.fillStyle = `rgb(${streak},${streak},${streak})`;
    context.fillRect(x, 0, 1, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createMaterials() {
  const aluminium = new THREE.MeshStandardMaterial({
    name: 'BrushedAluminium',
    color: 0xf3efe9,
    metalness: 0.9,
    roughness: 0.3,
    roughnessMap: createBrushedRoughnessMap(),
  });

  const black = new THREE.MeshStandardMaterial({ name: 'BlackPlastic', color: 0x19191b, roughness: 0.6, metalness: 0.05 });
  const blackPad = new THREE.MeshStandardMaterial({ name: 'BlackPad', color: 0x222226, roughness: 0.62, metalness: 0.0 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber', color: 0x141416, roughness: 0.6, metalness: 0.0 });
  const hole = new THREE.MeshStandardMaterial({ name: 'AdjustHole', color: 0x050506, roughness: 0.9, metalness: 0.0 });
  const orange = new THREE.MeshStandardMaterial({ name: 'OrangeAccent', color: COLORS.orange, roughness: 0.5, metalness: 0.0 });
  const indicator = new THREE.MeshStandardMaterial({
    name: 'LockIndicator',
    color: 0x111111,
    emissive: new THREE.Color(COLORS.lockOn),
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });

  return { aluminium, black, blackPad, rubber, hole, orange, indicator };
}
