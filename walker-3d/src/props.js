import * as THREE from 'three';

/** Plain chair for the "standing up" step. Seat top at 0.45 m, facing +Z. */
export function createChair() {
  const chair = new THREE.Group();
  chair.name = 'Chair';
  const wood = new THREE.MeshStandardMaterial({ color: 0xb59a76, roughness: 0.65 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x3b3f48, roughness: 0.5, metalness: 0.5 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.42), wood);
  seat.position.y = 0.4325;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.025), wood);
  back.position.set(0, 0.64, -0.2);
  chair.add(seat, back);

  for (const x of [-0.19, 0.19]) {
    for (const z of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.415, 14), frame);
      leg.position.set(x, 0.2075, z);
      chair.add(leg);
    }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 12), frame);
    post.position.set(x, 0.62, -0.19);
    chair.add(post);
  }
  chair.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return chair;
}

/** Faint floor ticks every 0.25 m so forward motion reads in the walking step. */
export function createFloorTicks() {
  const group = new THREE.Group();
  group.name = 'FloorTicks';
  const material = new THREE.MeshBasicMaterial({ color: 0x9aa0ab, transparent: true, opacity: 0.55 });
  const geometry = new THREE.PlaneGeometry(1.4, 0.012);
  for (let z = -1.5; z <= 3; z += 0.25) {
    const tick = new THREE.Mesh(geometry, material);
    tick.rotation.x = -Math.PI / 2;
    tick.position.set(0, 0.0004, z);
    group.add(tick);
  }
  group.visible = false;
  return group;
}
