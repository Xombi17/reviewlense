import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DIM } from './constants.js';
import { adjustmentHoles, castAndReceive, collarAt, setHiddenUserData, tubeBetween } from './geometry.js';
import { createFoot } from './foot.js';
import { createHandle } from './handle.js';

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const UPPER_TUBE_OVERLAP = 0.12; // how far the sliding tube reaches into the lower tube
const UPPER_HOLE_START = 0.15;
const UPPER_HOLE_SPACING = 0.03;
const UPPER_HOLE_COUNT = 8;

const point = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * One side frame. `side` is +1 for the right frame, -1 for the left. Origin on the frame plane at floor level,
 * so folding is just moving the group along X.
 * userData: setHandleHeight(m), setHandleAngle(deg), setLock(0..1), setFold(0..1), anchors.
 */
export function createSideFrame(side, materials) {
  const frame = new THREE.Group();
  frame.name = side > 0 ? 'SideFrame_Right' : 'SideFrame_Left';

  const { tubeRadius, upperTubeRadius, collarRadius, frontZ, footHeight, topCollarY, junctionY, panelY } = DIM;
  const tubeBottomY = footHeight - 0.004;
  const outward = point(side, 0, 0);

  // Front upright: fixed lower tube with a foot, plus the telescoping upper tube.
  frame.add(tubeBetween(point(0, tubeBottomY, frontZ), point(0, topCollarY, frontZ), tubeRadius, materials.aluminium));
  frame.add(
    adjustmentHoles({
      from: point(0, 0.15, frontZ),
      to: point(0, 0.35, frontZ),
      spacing: 0.04,
      tubeRadius,
      normals: [outward, point(0, 0, 1)],
      material: materials.hole,
    }),
  );

  const frontFoot = createFoot(materials);
  frontFoot.name = 'FrontFoot';
  frontFoot.position.set(0, 0, frontZ);
  frame.add(frontFoot);

  frame.add(collarAt(point(0, topCollarY, frontZ), Y, collarRadius, 0.045, materials.orange));
  const lockPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.014, 18), materials.orange);
  lockPin.name = 'HeightLockPin';
  lockPin.rotation.z = Math.PI / 2;
  lockPin.position.set(side * (collarRadius + 0.004), topCollarY + 0.004, frontZ);
  frame.add(lockPin);

  const upper = new THREE.Group();
  upper.name = 'TelescopingUpperTube';
  upper.position.set(0, topCollarY - UPPER_TUBE_OVERLAP, frontZ);
  const upperGeometry = new THREE.CylinderGeometry(upperTubeRadius, upperTubeRadius, 1, 40);
  upperGeometry.translate(0, 0.5, 0);
  const upperTube = new THREE.Mesh(upperGeometry, materials.aluminium);
  upper.add(upperTube);
  const upperHoles = [];
  for (let index = 0; index < UPPER_HOLE_COUNT; index++) {
    const y = UPPER_HOLE_START + index * UPPER_HOLE_SPACING;
    const holes = adjustmentHoles({
      from: point(0, y, 0),
      to: point(0, y, 0),
      spacing: 1,
      tubeRadius: upperTubeRadius,
      normals: [outward, point(0, 0, 1)],
      material: materials.hole,
    });
    holes.userData.localY = y;
    upper.add(holes);
    upperHoles.push(holes);
  }
  frame.add(upper);

  const handle = createHandle(side, materials);
  handle.position.set(0, DIM.heightRange[1], frontZ);
  handle.add(collarAt(point(0, -0.073, 0), Y, collarRadius * 0.96, 0.022, materials.orange));
  frame.add(handle);

  // Panel mount: orange collar on the upright and the hinge block reaching toward the panel.
  frame.add(collarAt(point(0, panelY, frontZ), Y, collarRadius, 0.05, materials.orange));
  const hingeBlock = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.034, 0.034, 3, 0.004), materials.orange);
  hingeBlock.name = 'PanelHingeBlock';
  hingeBlock.position.set(-side * (collarRadius + 0.002), panelY, frontZ);
  frame.add(hingeBlock);

  // Junction collar where the rear leg leaves the upright.
  frame.add(collarAt(point(0, junctionY, frontZ), Y, collarRadius, 0.05, materials.orange));

  // Rear leg: pivots about the junction so the frame can tuck it inward when folding.
  const legPivot = new THREE.Group();
  legPivot.name = 'RearLegPivot';
  legPivot.position.set(0, junctionY, frontZ);
  frame.add(legPivot);

  const legEnd = point(side * DIM.rearSplay, tubeBottomY - junctionY, DIM.rearFootZ - frontZ);
  const legDirection = legEnd.clone().normalize();
  const bendEnd = legDirection.clone().multiplyScalar(0.12);
  const telescopeJoint = legDirection.clone().multiplyScalar(0.27);

  const elbow = new THREE.CubicBezierCurve3(
    point(0, 0, 0),
    point(0, -0.05, 0),
    bendEnd.clone().addScaledVector(legDirection, -0.055),
    bendEnd,
  );
  const elbowMesh = new THREE.Mesh(new THREE.TubeGeometry(elbow, 28, tubeRadius, 32), materials.aluminium);
  elbowMesh.name = 'RearLegElbow';
  legPivot.add(castAndReceive(elbowMesh));
  legPivot.add(tubeBetween(bendEnd, telescopeJoint, tubeRadius, materials.aluminium));
  legPivot.add(tubeBetween(telescopeJoint, legEnd, upperTubeRadius, materials.aluminium));
  legPivot.add(collarAt(telescopeJoint, legDirection, collarRadius * 0.97, 0.045, materials.orange));
  legPivot.add(
    collarAt(telescopeJoint.clone().addScaledVector(legDirection, -0.05), legDirection, collarRadius * 0.85, 0.058, materials.black),
  );

  const holeNormals = [outward, new THREE.Vector3().crossVectors(legDirection, X).normalize()];
  legPivot.add(
    adjustmentHoles({
      from: telescopeJoint.clone().addScaledVector(legDirection, 0.05),
      to: legEnd.clone().addScaledVector(legDirection, -0.07),
      spacing: 0.035,
      tubeRadius: upperTubeRadius,
      normals: holeNormals,
      material: materials.hole,
    }),
  );

  const rearFoot = createFoot(materials);
  rearFoot.name = 'RearFoot';
  rearFoot.position.set(legEnd.x, -junctionY, legEnd.z);
  legPivot.add(rearFoot);

  const heightLockAnchor = new THREE.Object3D();
  heightLockAnchor.position.copy(telescopeJoint);
  legPivot.add(heightLockAnchor);
  const footAnchor = new THREE.Object3D();
  footAnchor.position.set(0, 0.04, 0);
  rearFoot.add(footAnchor);

  // Tuck angle: rotate about Z at the junction until the rear foot sits almost under the frame plane.
  const footOffsetX = legEnd.x;
  const legLengthXY = Math.hypot(footOffsetX, legEnd.y);
  const tuckedAngle =
    -Math.acos(THREE.MathUtils.clamp((footOffsetX * 0.2) / legLengthXY, -1, 1)) - Math.atan2(legEnd.y, footOffsetX);

  frame.userData.setHandleHeight = (height) => {
    const topY = height - 0.05;
    const baseY = upper.position.y;
    upperTube.scale.y = topY - baseY;
    handle.position.y = height;
    for (const holes of upperHoles) holes.visible = holes.userData.localY < topY - baseY - 0.06;
  };
  frame.userData.setHandleAngle = (degrees) => handle.userData.setAngle(degrees);
  frame.userData.setLock = (locked01) => handle.userData.setLock(locked01);
  frame.userData.setFold = (fold01) => {
    legPivot.rotation.z = tuckedAngle * fold01;
    rearFoot.rotation.z = -tuckedAngle * fold01; // keep the foot flat on the floor
  };
  setHiddenUserData(frame, 'anchors', {
    grip: handle.userData.anchors.grip,
    control: handle.userData.anchors.control,
    heightLock: heightLockAnchor,
    foot: footAnchor,
  });

  return frame;
}
