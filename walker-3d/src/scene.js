import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { COLORS } from './constants.js';

export const ORBIT_TARGET = new THREE.Vector3(0, 0.45, 0);

/** Width of the control panel strip the model should stay clear of (wide screens only). */
export const getViewInset = (width) => (width >= 900 ? 292 : 0);

/** Renderer, camera, orbit controls, studio lighting and the ground that catches shadows. */
export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps the #F26B1D orange honest
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'label-layer';
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.15;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  camera.userData.container = container;
  camera.position.set(-1.4, 0.95, 1.75);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(ORBIT_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.6;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.autoRotateSpeed = 1.2;
  controls.update();

  // One soft key light with shadows, a faint hemisphere fill; the RoomEnvironment does the rest.
  const key = new THREE.DirectionalLight(0xfff3e6, 2.4);
  key.position.set(0.7, 4.2, 1.1);
  key.target.position.set(0, 0.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1;
  key.shadow.camera.right = 1;
  key.shadow.camera.top = 1;
  key.shadow.camera.bottom = -1;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 8;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.008;
  key.shadow.radius = 6;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bdc6, 0.25));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.17 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'Ground';
  scene.add(ground);

  // `left` and `bottom` keep the model clear of UI that sits over the canvas; null means the default for this width.
  const layout = { fov: null, left: null, bottom: 0 };

  function applyView() {
    const { clientWidth: width, clientHeight: height } = container;
    camera.aspect = width / height;
    // Keep the whole walker in frame on portrait screens.
    camera.fov = layout.fov ?? (camera.aspect < 1 ? 46 : 32);
    const left = layout.left ?? getViewInset(width);
    if (left > 0 || layout.bottom > 0) camera.setViewOffset(width, height, -left / 2, layout.bottom / 2, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = container;
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
    applyView();
  }
  window.addEventListener('resize', resize);
  resize();
  controls.update();

  function setLayout(next) {
    Object.assign(layout, next);
    applyView();
  }

  return { renderer, labelRenderer, scene, camera, controls, setLayout };
}
