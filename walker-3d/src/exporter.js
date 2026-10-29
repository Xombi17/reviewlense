import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Exports the walker in its current pose as a binary glTF, leaving out helper objects. */
export async function exportGLB(root, filename = 'redesigned-walker.glb') {
  const hidden = [];
  const geometries = new Set();
  root.traverse((object) => {
    const isAnchor = object.type === 'Object3D' && object.children.length === 0;
    if ((object.userData.excludeFromExport || isAnchor) && object.visible) {
      object.visible = false;
      hidden.push(object);
    }
    if (object.isMesh) geometries.add(object.geometry);
  });
  for (const geometry of geometries) geometry.normalizeNormals(); // exporter warns about non-unit normals otherwise

  try {
    const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true });
    download(new Blob([result], { type: 'model/gltf-binary' }), filename);
    return result.byteLength;
  } finally {
    for (const object of hidden) object.visible = true;
  }
}
