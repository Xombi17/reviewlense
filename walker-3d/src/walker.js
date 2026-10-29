import * as THREE from 'three';
import { DIM } from './constants.js';
import { createMaterials } from './materials.js';
import { createSideFrame } from './frame.js';
import { createPanel } from './panel.js';

/**
 * The whole walker. `apply(state)` poses it from a plain state object so animation lives outside the model.
 */
export function createWalker() {
  const materials = createMaterials();
  const walker = new THREE.Group();
  walker.name = 'RedesignedWalker';

  const left = createSideFrame(-1, materials);
  const right = createSideFrame(1, materials);
  const panel = createPanel(materials);
  walker.add(left, right, panel);

  function apply(state) {
    const halfWidth = THREE.MathUtils.lerp(DIM.halfWidth, DIM.foldHalfWidth, state.fold);
    left.position.x = -halfWidth;
    right.position.x = halfWidth;

    for (const frame of [left, right]) {
      frame.userData.setHandleHeight(state.handleHeight);
      frame.userData.setHandleAngle(state.handleAngle);
      frame.userData.setLock(state.lock);
      frame.userData.setFold(state.fold);
    }

    panel.userData.setWidth(2 * halfWidth - 2 * DIM.collarRadius - 0.006);
    panel.userData.setOpen(state.panelOpen);
  }

  return {
    group: walker,
    materials,
    apply,
    anchors: {
      handle: left.userData.anchors.grip,
      control: right.userData.anchors.control,
      panel: panel.userData.anchor,
      heightLock: left.userData.anchors.heightLock,
      feet: left.userData.anchors.foot,
    },
    grips: { left: left.userData.anchors.grip, right: right.userData.anchors.grip },
  };
}
