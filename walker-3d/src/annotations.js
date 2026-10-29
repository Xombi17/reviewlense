import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Label offsets in CSS pixels at an 850 px tall viewport (scaled with the viewport height).
const NOTES = [
  { key: 'handle', text: 'Ergonomic adjustable handle', offset: [-190, -130] },
  { key: 'control', text: 'Control interface (stop/lock)', offset: [200, -120] },
  { key: 'panel', text: 'Integrated fold-down rest panel', offset: [230, 30] },
  { key: 'heightLock', text: 'Height adjustment (with lock)', offset: [-210, 10] },
  { key: 'feet', text: 'Wide base with non-slip rubber feet', offset: [-190, 110] },
];
const REFERENCE_HEIGHT = 850;
const EDGE_MARGIN = 12;

const worldAnchor = new THREE.Vector3();
const projected = new THREE.Vector3();

/**
 * CSS2D labels with 3D leader lines. The label position is chosen in screen space (clamped to the viewport and
 * kept clear of the control panel) and then un-projected onto the camera-facing plane through the anchor.
 */
export function createAnnotations(scene, anchors, camera, container) {
  const group = new THREE.Group();
  group.name = 'Annotations';
  scene.add(group);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x2a2a30, depthTest: false, transparent: true, opacity: 0.85 });

  const items = NOTES.map((note) => {
    const isLeft = note.offset[0] < 0;
    const label = document.createElement('div');
    label.className = `annotation ${isLeft ? 'annotation--left' : 'annotation--right'}`;
    label.textContent = note.text;
    const labelObject = new CSS2DObject(label);
    labelObject.center.set(isLeft ? 1 : 0, 0.5);

    const dot = document.createElement('div');
    dot.className = 'annotation-dot';
    const dotObject = new CSS2DObject(dot);

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geometry, lineMaterial);
    line.frustumCulled = false;
    line.renderOrder = 999;

    group.add(labelObject, dotObject, line);
    return { anchor: anchors[note.key], offset: note.offset, isLeft, label, labelObject, dotObject, line };
  });

  const controlPanel = () => container.querySelector('.control-panel');

  function update() {
    if (!group.visible) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale = height / REFERENCE_HEIGHT;
    const panelBox = controlPanel()?.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();
    camera.updateMatrixWorld();

    for (const item of items) {
      item.anchor.getWorldPosition(worldAnchor);
      item.dotObject.position.copy(worldAnchor);

      projected.copy(worldAnchor).project(camera);
      const anchorX = ((projected.x + 1) / 2) * width;
      const anchorY = ((1 - projected.y) / 2) * height;

      const labelWidth = item.label.offsetWidth || 190;
      const labelHalfHeight = (item.label.offsetHeight || 24) / 2;
      let x = anchorX + item.offset[0] * scale;
      const y = THREE.MathUtils.clamp(anchorY + item.offset[1] * scale, labelHalfHeight + EDGE_MARGIN, height - labelHalfHeight - EDGE_MARGIN);

      let minX = EDGE_MARGIN;
      if (panelBox && panelBox.width > 0) {
        const touchesPanel = y + labelHalfHeight > panelBox.top - containerBox.top - 8 && y - labelHalfHeight < panelBox.bottom - containerBox.top + 8;
        if (touchesPanel) minX = panelBox.right - containerBox.left + EDGE_MARGIN;
      }
      x = item.isLeft
        ? Math.max(x, minX + labelWidth) // right edge is the attach point
        : Math.min(x, width - EDGE_MARGIN - labelWidth); // left edge is the attach point
      x = item.isLeft ? Math.min(x, width - EDGE_MARGIN) : Math.max(x, minX);

      projected.set((x / width) * 2 - 1, -((y / height) * 2 - 1), projected.z).unproject(camera);
      item.labelObject.position.copy(projected);

      const positions = item.line.geometry.attributes.position;
      positions.setXYZ(0, worldAnchor.x, worldAnchor.y, worldAnchor.z);
      positions.setXYZ(1, projected.x, projected.y, projected.z);
      positions.needsUpdate = true;
    }
  }

  function setVisible(visible) {
    group.visible = visible;
    // CSS2DRenderer only looks at each object's own visibility flag.
    for (const item of items) {
      item.labelObject.visible = visible;
      item.dotObject.visible = visible;
    }
  }

  setVisible(false);
  return { update, setVisible, group };
}
