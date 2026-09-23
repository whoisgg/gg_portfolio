import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { loadingManager } from './loader.js';
import { createRoom } from './scene/room.js';
import { createTV, createConsole } from './scene/tv.js';
import { createBookshelf, createCartridges } from './scene/bookshelf.js';
import { createController } from './scene/props.js';
import { tryLoadModel, loadBoxModels, makeSpineVariants, MODEL_FILES } from './scene/models.js';
import { DIMS } from './scene/dims.js';
import { initRaycaster, updateRaycaster, setRaycasterEnabled } from './interaction/raycaster.js';
import {
  insertCartridge, ejectCartridge, isCartridgeAnimating, isCartridgeInserted, setSlotPosition,
} from './interaction/cartridge.js';
import {
  setupCamera, transitionToScreen, transitionToHome, updateCamera, setParallax, refitCamera, getMode,
} from './interaction/camera.js';
import { createScreenTracker } from './interaction/screen.js';
import { getAboutHTML } from './sections/about.js';
import { getProjectsHTML } from './sections/projects.js';
import { getLabHTML } from './sections/lab.js';
import { getContactHTML } from './sections/contact.js';

// --- Renderer / scene ---
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0c0b);
scene.fog = new THREE.Fog(0x0d0c0b, 5, 12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 15);
setupCamera(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// Image-based lighting so plastics, metals and the glass actually reflect
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.28;
pmrem.dispose();

// --- Lights ---
scene.add(new THREE.AmbientLight(0x6a5a50, 0.22));

const pendant = new THREE.PointLight(0xffcf9a, 9, 6, 2);
pendant.position.set(0, 2.05, -1);
pendant.castShadow = true;
pendant.shadow.mapSize.set(1024, 1024);
pendant.shadow.bias = -0.0005;
pendant.shadow.normalBias = 0.004;
pendant.shadow.radius = 4;
scene.add(pendant);

// Cool moonlight from the left window (off-screen) for rim and contrast
const moon = new THREE.DirectionalLight(0x7f8fc8, 0.5);
moon.position.set(-3, 2.2, 1.5);
scene.add(moon);

// Warm bounce near the bookshelf
const shelfFill = new THREE.PointLight(0xffa868, 1.2, 2.5, 2);
shelfFill.position.set(1.5, 1.4, -1.2);
scene.add(shelfFill);

// --- Scene objects ---
const room = createRoom(scene);
const { tvGroup, screenMaterial, screenMesh, screenCenter, screenSize } = createTV(scene);
const { consoleGroup, slotWorld, portWorld } = createConsole(scene);

// --- Downloaded models (optional, see public/models/CREDITS.md) ---
// Each one swaps the procedural body but keeps the named helpers (LED, slot,
// screen) so the interaction and the overlay keep working.
const KEEP = new Set(['powerLed', 'cartridgeSlot', 'tvScreen', 'tvGlass', 'screenGlow', 'tvLed']);
const hideProcedural = (group) => group.children.forEach((c) => { if (!KEEP.has(c.name)) c.visible = false; });

tryLoadModel(MODEL_FILES.snes, { width: DIMS.snes.w, hide: ['cable', 'Plug', 'NurbsPath', 'Cube.005', 'material'] }).then((model) => {
  if (!model) return;
  hideProcedural(consoleGroup);
  consoleGroup.add(model);
  console.info('[models] snes', model.userData.size);
});

tryLoadModel(MODEL_FILES.crt, { width: DIMS.tv.w, rotationY: Math.PI }).then((model) => {
  if (!model) return;
  hideProcedural(tvGroup);
  // tvGroup origin is at the procedural TV's centre height; the model's base goes on the cabinet top
  model.position.y = -DIMS.tv.h / 2;
  tvGroup.add(model);
  tvGroup.updateWorldMatrix(true, true); // the model can land before the first frame
  const size = model.userData.size;

  // If the model names its screen, seat the phosphor exactly on it; otherwise guess the front.
  const screenNode = model.getObjectByName('Screen');
  let sw = DIMS.tv.screenW, sh = DIMS.tv.screenH;
  const local = new THREE.Vector3(0, -DIMS.tv.h / 2 + size.y * 0.55, size.z / 2 + 0.002);
  if (screenNode) {
    const bb = new THREE.Box3().setFromObject(screenNode);
    const c = bb.getCenter(new THREE.Vector3());
    const sz = bb.getSize(new THREE.Vector3());
    sw = sz.x * 0.96; sh = sz.y * 0.96;
    tvGroup.worldToLocal(local.set(c.x, c.y, bb.max.z + 0.003));
  }
  screenSize.w = sw;
  screenSize.h = sh;
  screenMesh.geometry.dispose();
  screenMesh.geometry = new THREE.PlaneGeometry(sw, sh, 40, 30);
  const glassMesh = tvGroup.getObjectByName('tvGlass');
  if (glassMesh) glassMesh.visible = false;
  screenMesh.position.copy(local);
  screenMesh.getWorldPosition(screenCenter);
  tvGroup.getObjectByName('screenGlow').position.set(local.x, local.y, local.z + 0.18);
  console.info('[models] crt', size, 'screen', sw.toFixed(3), sh.toFixed(3));
});

// Real game boxes (optional) decide the shelf layout, so they load first
const boxModels = await loadBoxModels();
console.info('[models] boxes', boxModels.length, boxModels[0]?.userData.size);
const spineVariants = boxModels.length ? makeSpineVariants(boxModels[0]) : [];
console.info('[models] spine variants', spineVariants.length);
const shelfGroup = createBookshelf(scene, boxModels, spineVariants);
const cartridges = createCartridges(scene, shelfGroup);
setSlotPosition(slotWorld);

tryLoadModel(MODEL_FILES.cartridge, { width: DIMS.cart.W }).then((model) => {
  if (!model) return;
  const half = (DIMS.cart.Hu + DIMS.cart.Hl) / 2;
  const frontZ = model.userData.size.z / 2 + 0.0015;
  for (const cart of cartridges) {
    cart.children.forEach((c) => {
      if (c.userData.isLabel) c.position.z = frontZ; // the real shell is thicker than the procedural one
      else c.visible = false;
    });
    const m = model.clone(true);
    m.position.y = -half;
    cart.add(m);
  }
  console.info('[models] cartridge', model.userData.size);
});

const controller = createController(portWorld);
controller.group.position.set(0.15, 0.012, -1.05);
controller.group.rotation.y = -0.35;
scene.add(controller.group);
scene.add(controller.buildCable());

tryLoadModel(MODEL_FILES.controller, { width: DIMS.pad.w }).then((model) => {
  if (!model) return;
  controller.group.children.forEach((c) => { c.visible = false; });
  controller.group.add(model);
  console.info('[models] controller', model.userData.size);
});


// --- Post-processing (bloom for the CRT, LEDs and the lava lamp) ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.5, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// --- UI ---
const tvScreenEl = document.getElementById('tv-screen');
const sectionContainer = document.getElementById('section-container');
const bootLine = document.getElementById('boot-line');
const hintText = document.getElementById('hint-text');
const backBtn = document.getElementById('back-btn');
const screenTracker = createScreenTracker(screenMesh, screenSize, tvScreenEl);

const sectionContent = {
  about: getAboutHTML,
  projects: getProjectsHTML,
  lab: getLabHTML,
  contact: getContactHTML,
};

let bootTween = null;

function typeBootLine(text, duration) {
  bootLine.textContent = '';
  const state = { n: 0 };
  bootTween?.kill();
  bootTween = gsap.to(state, {
    n: text.length,
    duration,
    ease: 'none',
    onUpdate: () => { bootLine.textContent = text.slice(0, Math.floor(state.n)) + (state.n < text.length ? '_' : ''); },
  });
}

function showSection(name, color) {
  tvScreenEl.style.setProperty('--phos', '#' + new THREE.Color(color).getHexString());
  sectionContainer.innerHTML = '';
  tvScreenEl.classList.remove('hidden');
  tvScreenEl.classList.add('on');
  gsap.to(tvScreenEl, { opacity: 1, duration: 0.4 });
  typeBootLine(`gaspr.dev  ·  loading ${name}.rom`, 0.8);

  gsap.delayedCall(1.15, () => {
    bootLine.textContent = '';
    sectionContainer.innerHTML = sectionContent[name]();
    const content = sectionContainer.querySelector('.section-content');
    gsap.fromTo(content, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
    backBtn.focus({ preventScroll: true });
  });
}

function hideSection(onDone) {
  bootTween?.kill();
  gsap.to(tvScreenEl, {
    opacity: 0, duration: 0.2,
    onComplete: () => {
      tvScreenEl.classList.add('hidden');
      tvScreenEl.classList.remove('on');
      sectionContainer.innerHTML = '';
      bootLine.textContent = '';
      onDone?.();
    },
  });
}

const led = consoleGroup.getObjectByName('powerLed');
const tvLed = tvGroup.getObjectByName('tvLed');
const screenGlow = tvGroup.getObjectByName('screenGlow');

function setPower(on, color) {
  if (on) {
    led.material.emissive.set(0x33ff55);
    led.material.emissiveIntensity = 3;
    tvLed.material.emissive.set(0xff3030);
    tvLed.material.emissiveIntensity = 2.5;
    screenGlow.color.set(color);
    gsap.to(screenGlow, { intensity: 0.9, duration: 0.6, delay: 0.2 });
  } else {
    led.material.emissive.set(0x330000);
    led.material.emissiveIntensity = 0.3;
    tvLed.material.emissive.set(0x330000);
    tvLed.material.emissiveIntensity = 0.4;
    gsap.to(screenGlow, { intensity: 0, duration: 0.3 });
  }
}

function onMenuClick(box) {
  if (isCartridgeAnimating() || isCartridgeInserted()) return;
  setRaycasterEnabled(false);
  tooltip.classList.remove('on');
  hintText.classList.add('hidden');
  hintText.textContent = 'Pick a cartridge';
  const cartridge = box.userData.cartridge;
  const name = cartridge.userData.label.toLowerCase();
  const color = cartridge.userData.color;

  insertCartridge(cartridge, screenMaterial, () => {
    setPower(true, color);
    transitionToScreen(camera, screenCenter, screenSize, () => showSection(name, color));
  });
}

function goHome() {
  if (isCartridgeAnimating() || !isCartridgeInserted() || getMode() !== 'screen') return;
  hideSection();
  transitionToHome(camera, () => {
    setPower(false);
    ejectCartridge(screenMaterial, () => {
      hintText.classList.remove('hidden');
      setRaycasterEnabled(true);
    });
  });
}

backBtn.addEventListener('click', goHome);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') goHome(); });

const MENU_BLURB = {
  ABOUT: 'Who I am',
  PROJECTS: "Things I've built",
  LAB: 'Three.js experiments',
  CONTACT: 'Say hi',
};
const tooltip = document.getElementById('tooltip');
const tooltipTitle = tooltip.querySelector('.tt-title');
const tooltipSub = tooltip.querySelector('.tt-sub');
const pointerPx = { x: 0, y: 0 };

// Hover: tooltip by the cursor, the hint line names the menu, and the TV
// glows in the menu's colour like a channel preview.
function onMenuHover(cart) {
  const u = screenMaterial.uniforms;
  if (cart) {
    const { label, color } = cart.userData;
    tooltipTitle.textContent = label.charAt(0) + label.slice(1).toLowerCase();
    tooltipSub.textContent = MENU_BLURB[label] || '';
    tooltip.style.setProperty('--phos', '#' + new THREE.Color(color).getHexString());
    tooltip.classList.add('on');
    hintText.textContent = `${label.charAt(0) + label.slice(1).toLowerCase()} · click to insert`;
    u.uColor.value.set(color);
    gsap.to(u.uActive, { value: 0.28, duration: 0.35, overwrite: true });
    screenGlow.color.set(color);
    gsap.to(screenGlow, { intensity: 0.25, duration: 0.35, overwrite: true });
  } else {
    tooltip.classList.remove('on');
    hintText.textContent = 'Pick a cartridge';
    if (!isCartridgeInserted() && !isCartridgeAnimating()) {
      gsap.to(u.uActive, { value: 0, duration: 0.4, overwrite: true });
      gsap.to(screenGlow, { intensity: 0, duration: 0.4, overwrite: true });
    }
  }
}

initRaycaster(camera, canvas, cartridges, onMenuClick, onMenuHover);

// Parallax follows the pointer while at home
window.addEventListener('pointermove', (e) => {
  setParallax((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  pointerPx.x = e.clientX; pointerPx.y = e.clientY;
  tooltip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY - 12}px)`;
});

// --- Loading screen: real texture progress + fonts ---
const loadingScreen = document.getElementById('loading-screen');
const loaderFill = document.querySelector('.loader-fill');
const loadStart = performance.now();
loadingManager.onProgress = (_url, loaded, total) => {
  loaderFill.style.width = `${Math.round((loaded / total) * 100)}%`;
};
const texturesDone = new Promise((resolve) => {
  loadingManager.onLoad = resolve;
  // If nothing is pending (cache), onLoad never fires: guard with a timeout
  setTimeout(resolve, 4000);
});
Promise.all([texturesDone, document.fonts?.ready ?? Promise.resolve()]).then(() => {
  loaderFill.style.width = '100%';
  const minShow = Math.max(0, 700 - (performance.now() - loadStart));
  gsap.to(loadingScreen, {
    opacity: 0, duration: 0.5, delay: minShow / 1000,
    onComplete: () => { loadingScreen.style.display = 'none'; },
  });
});

// --- Resize ---
function handleResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.fov = w < h ? 68 : 50;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
  refitCamera(camera, screenCenter, screenSize);
}
window.addEventListener('resize', handleResize);
handleResize();

// --- Loop ---
const timer = new THREE.Timer();
if (import.meta.env.DEV) { window.__gsap = gsap; window.__scene = scene; window.__THREE = THREE; window.__raycast = () => updateRaycaster(camera); }

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const t = timer.getElapsed();

  screenMaterial.uniforms.uTime.value = t;
  room.update(t);

  if (getMode() === 'home') updateRaycaster(camera);
  updateCamera(camera);
  if (!tvScreenEl.classList.contains('hidden')) screenTracker.update(camera);

  composer.render();
}

animate();
