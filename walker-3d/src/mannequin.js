import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const REFERENCE_STATURE = 1.7;

// Segment lengths as fractions of standing height (standard anthropometric ratios).
const RATIO = {
  thigh: 0.245,
  shank: 0.246,
  ankle: 0.039,
  torso: 0.288, // hip joint to shoulder line
  upperArm: 0.186,
  foreArm: 0.146,
  hipHalf: 0.095,
  shoulderHalf: 0.1295,
  headRadius: 0.06,
};

/**
 * Two-bone IK in 3D. Returns the middle joint and the end point; `reached` is false when the target is too far,
 * in which case the limb is straight and stops short. `flexion` is the bend at the middle joint in radians.
 */
export function solveTwoBone(root, target, lengthA, lengthB, pole) {
  const toTarget = new THREE.Vector3().subVectors(target, root);
  const distance = toTarget.length();
  const maxReach = (lengthA + lengthB) * 0.999;
  const reached = distance <= maxReach;
  const clamped = THREE.MathUtils.clamp(distance, Math.abs(lengthA - lengthB) + 1e-4, maxReach);
  const axis = toTarget.clone().normalize();
  const along = (lengthA * lengthA - lengthB * lengthB + clamped * clamped) / (2 * clamped);
  const height = Math.sqrt(Math.max(lengthA * lengthA - along * along, 0));
  const sideways = pole.clone().addScaledVector(axis, -pole.dot(axis));
  if (sideways.lengthSq() < 1e-8) sideways.set(0, 0, 1);
  sideways.normalize();
  const middle = root.clone().addScaledVector(axis, along).addScaledVector(sideways, height);
  const end = root.clone().addScaledVector(axis, clamped);
  const cosInterior = THREE.MathUtils.clamp((lengthA * lengthA + lengthB * lengthB - clamped * clamped) / (2 * lengthA * lengthB), -1, 1);
  return { middle, end, reached, flexion: Math.PI - Math.acos(cosInterior) };
}

function createLimb(material) {
  const geometry = new THREE.CylinderGeometry(1, 0.82, 1, 20);
  geometry.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

function placeLimb(mesh, from, to, radius) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = Math.max(direction.length(), 1e-4);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  mesh.scale.set(radius, length, radius);
}

const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
function createBlob(material) {
  const mesh = new THREE.Mesh(sphereGeometry, material);
  mesh.castShadow = true;
  return mesh;
}

/**
 * A stylised art mannequin built from primitives. Everything is posed from a few numbers (pelvis, torso lean,
 * foot positions) plus the grips the hands must hold, so changing the walker or the stature just works.
 *
 * Space: `root` sits at the pelvis (x and z) inside the walker's frame and can turn about the vertical axis.
 * Pose positions are given in the parent's space; the IK runs in root space (+z is the way the user faces).
 */
export function createMannequin() {
  const root = new THREE.Group();
  root.name = 'Mannequin';

  const body = new THREE.MeshStandardMaterial({ color: 0x8795a8, roughness: 0.62, metalness: 0.02 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x5b6a80, roughness: 0.55, metalness: 0.02 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.25, metalness: 0.1 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x262b34, roughness: 0.7 });

  const torso = new THREE.Group();
  torso.name = 'Torso';
  const pelvisShape = createBlob(body);
  const abdomen = createBlob(body);
  const chest = createBlob(body);
  const neck = createLimb(joint);
  const head = createBlob(body);
  const face = createBlob(visor);
  torso.add(pelvisShape, abdomen, chest, neck, head, face);
  root.add(torso);

  const makeSide = () => ({
    thigh: createLimb(body),
    shank: createLimb(body),
    upperArm: createLimb(body),
    foreArm: createLimb(body),
    hip: createBlob(joint),
    knee: createBlob(joint),
    shoulder: createBlob(joint),
    elbow: createBlob(joint),
    hand: createBlob(joint),
    foot: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), shoe),
  });
  const sides = { left: makeSide(), right: makeSide() };
  for (const side of Object.values(sides)) {
    side.foot.castShadow = true;
    root.add(...Object.values(side));
  }

  const materials = [body, joint, visor, shoe];
  function setOpacity(opacity) {
    for (const material of materials) {
      const transparent = opacity < 1;
      if (material.transparent !== transparent) material.needsUpdate = true;
      material.transparent = transparent;
      material.opacity = opacity;
    }
  }

  const metrics = { elbowFlexion: 0, reached: true };
  let scale = 1;
  let length = {};

  function setStature(statureMetres) {
    scale = statureMetres / REFERENCE_STATURE;
    const s = statureMetres;
    length = {
      thigh: RATIO.thigh * s,
      shank: RATIO.shank * s,
      ankle: RATIO.ankle * s,
      torso: RATIO.torso * s,
      upperArm: RATIO.upperArm * s,
      foreArm: RATIO.foreArm * s,
      hipHalf: RATIO.hipHalf * s,
      shoulderHalf: RATIO.shoulderHalf * s,
    };
    pelvisShape.scale.set(0.145 * scale, 0.095 * scale, 0.092 * scale);
    abdomen.position.set(0, 0.13 * scale, 0);
    abdomen.scale.set(0.135 * scale, 0.14 * scale, 0.088 * scale);
    chest.position.set(0, length.torso * 0.76, 0);
    chest.scale.set(0.17 * scale, 0.185 * scale, 0.1 * scale);
    neck.position.set(0, length.torso * 0.96, 0);
    neck.scale.set(0.034 * scale, 0.1 * scale, 0.034 * scale);
    const headRadius = RATIO.headRadius * s;
    head.position.set(0, length.torso + 0.145 * scale, 0.006 * scale);
    head.scale.set(headRadius, headRadius * 1.14, headRadius * 1.05);
    face.position.set(0, length.torso + 0.15 * scale, headRadius * 0.82);
    face.scale.set(headRadius * 0.78, headRadius * 0.4, headRadius * 0.34);
    return length;
  }
  setStature(REFERENCE_STATURE);

  const pole = {
    leg: new THREE.Vector3(0, 0, 1), // knees point the way the user faces
    armLeft: new THREE.Vector3(-0.35, -0.8, -0.5),
    armRight: new THREE.Vector3(0.35, -0.8, -0.5),
  };

  /** The pelvis height a straight-ish leg allows for a given hip and ankle (root space). */
  function legCeiling(hip, ankle) {
    const reach = (length.thigh + length.shank) * 0.996;
    const horizontal = Math.hypot(ankle.x - hip.x, ankle.z - hip.z);
    return ankle.y + Math.sqrt(Math.max(reach * reach - horizontal * horizontal, 0));
  }

  const rootInverse = new THREE.Matrix4();
  const toRoot = (vector) => vector.clone().applyMatrix4(rootInverse);

  /**
   * pose: { pelvisZ, pelvisY (optional), lean, yaw, left: {x,z,y}, right: {x,z,y} } in parent space.
   * grips: { left: Vector3, right: Vector3 } hand targets in parent space; `lapBlend` slides the hands to the thighs.
   */
  function update(pose, grips, lapBlend = 0) {
    root.position.set(0, 0, pose.pelvisZ);
    root.rotation.y = pose.yaw ?? 0;
    root.updateMatrix();
    rootInverse.copy(root.matrix).invert();

    const footTarget = {};
    for (const key of ['left', 'right']) {
      const foot = pose[key];
      footTarget[key] = toRoot(new THREE.Vector3(foot.x, (foot.y ?? 0) + length.ankle, foot.z));
    }
    // Keep each foot on its own side of the body whichever way the user faces.
    if (footTarget.left.x > footTarget.right.x) [footTarget.left, footTarget.right] = [footTarget.right, footTarget.left];

    const hips = {
      left: new THREE.Vector3(-length.hipHalf, 0, 0),
      right: new THREE.Vector3(length.hipHalf, 0, 0),
    };
    const ceiling = Math.min(legCeiling(hips.left, footTarget.left), legCeiling(hips.right, footTarget.right));
    const pelvisY = Math.min(pose.pelvisY ?? Infinity, ceiling);
    hips.left.y = hips.right.y = pelvisY;

    torso.position.set(0, pelvisY, 0);
    torso.rotation.x = pose.lean ?? 0;
    torso.updateMatrix();
    const shoulderY = length.torso * 0.97;
    const shoulders = {
      left: new THREE.Vector3(-length.shoulderHalf, shoulderY, 0).applyMatrix4(torso.matrix),
      right: new THREE.Vector3(length.shoulderHalf, shoulderY, 0).applyMatrix4(torso.matrix),
    };

    const radius = (value) => value * scale;
    let flexionTotal = 0;
    let allReached = true;

    for (const key of ['left', 'right']) {
      const parts = sides[key];
      const leg = solveTwoBone(hips[key], footTarget[key], length.thigh, length.shank, pole.leg);
      placeLimb(parts.thigh, hips[key], leg.middle, radius(0.047));
      placeLimb(parts.shank, leg.middle, leg.end, radius(0.034));
      parts.hip.position.copy(hips[key]);
      parts.hip.scale.setScalar(radius(0.05));
      parts.knee.position.copy(leg.middle);
      parts.knee.scale.setScalar(radius(0.04));
      parts.foot.position.set(leg.end.x, leg.end.y - length.ankle * 0.5, leg.end.z + 0.035 * scale);
      parts.foot.scale.set(0.08 * scale, 0.042 * scale, 0.21 * scale);

      const gripLocal = toRoot(grips[key]);
      const wrist = gripLocal.clone().add(new THREE.Vector3(0, 0, -0.05 * scale)); // wrist sits behind the grip
      const lapLocal = leg.middle.clone().lerp(hips[key], 0.4).add(new THREE.Vector3(0, 0.07 * scale, 0));
      const target = wrist.lerp(lapLocal, lapBlend);
      const arm = solveTwoBone(shoulders[key], target, length.upperArm, length.foreArm, key === 'left' ? pole.armLeft : pole.armRight);
      placeLimb(parts.upperArm, shoulders[key], arm.middle, radius(0.03));
      placeLimb(parts.foreArm, arm.middle, arm.end, radius(0.025));
      parts.shoulder.position.copy(shoulders[key]);
      parts.shoulder.scale.setScalar(radius(0.042));
      parts.elbow.position.copy(arm.middle);
      parts.elbow.scale.setScalar(radius(0.032));
      parts.hand.position.copy(arm.reached || lapBlend > 0 ? arm.end.clone().lerp(gripLocal, 1 - lapBlend) : arm.end);
      parts.hand.scale.set(radius(0.036), radius(0.032), radius(0.05));

      flexionTotal += arm.flexion;
      allReached = allReached && arm.reached;
    }

    metrics.elbowFlexion = THREE.MathUtils.radToDeg(flexionTotal / 2);
    metrics.reached = allReached;
    return pelvisY;
  }

  /** Pelvis height when standing on flat feet, for animation targets. */
  function standingPelvisY() {
    return length.ankle + (length.thigh + length.shank) * 0.996;
  }

  return { group: root, metrics, setStature, setOpacity, update, standingPelvisY, get scale() { return scale; }, get length() { return length; } };
}
