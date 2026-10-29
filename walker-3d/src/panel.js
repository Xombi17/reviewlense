import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DIM } from './constants.js';
import { castAndReceive, setHiddenUserData } from './geometry.js';

const OPEN_ANGLE = -Math.PI / 2; // swings rearward, toward the user
const MAX_WIDTH = 2 * DIM.halfWidth - 2 * DIM.collarRadius - 0.006;

/**
 * Origin on the hinge axis, mid-way between the two front uprights.
 * Folded: pad stands vertical above the hinge. Unfolded: pad lies horizontal, reaching toward -Z.
 * userData: setOpen(0..1), setWidth(metres), anchor.
 */
export function createPanel(materials) {
  const panel = new THREE.Group();
  panel.name = 'RestPanel';
  panel.position.set(0, DIM.panelY, DIM.frontZ);

  const hinge = new THREE.Group();
  hinge.name = 'PanelHinge';
  panel.add(hinge);

  const { panelHeight: height, panelThickness: thickness } = DIM;

  const shell = new THREE.Mesh(new RoundedBoxGeometry(MAX_WIDTH, height, thickness, 5, 0.011), materials.black);
  shell.name = 'PanelShell';
  shell.position.y = height / 2 + 0.004;
  const cushion = new THREE.Mesh(
    new RoundedBoxGeometry(MAX_WIDTH - 0.026, height - 0.026, thickness + 0.004, 5, 0.008),
    materials.blackPad,
  );
  cushion.name = 'PanelCushion';
  cushion.position.copy(shell.position);
  hinge.add(shell, cushion);

  // Orange hinge barrel and end knuckles along the bottom edge.
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 1, 28), materials.orange);
  barrel.name = 'HingeBarrel';
  barrel.rotation.z = Math.PI / 2;
  panel.add(barrel);

  const anchor = new THREE.Object3D();
  anchor.position.set(0, height / 2, 0);
  hinge.add(anchor);

  panel.userData.setOpen = (open01) => {
    hinge.rotation.x = open01 * OPEN_ANGLE;
  };
  panel.userData.setWidth = (width) => {
    const scale = THREE.MathUtils.clamp(width / MAX_WIDTH, 0.05, 1);
    shell.scale.x = scale;
    cushion.scale.x = scale;
    barrel.scale.y = width;
  };
  setHiddenUserData(panel, 'anchor', anchor);

  return castAndReceive(panel);
}
