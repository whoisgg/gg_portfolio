import gsap from 'gsap';
import * as THREE from 'three';

// Camera has a base position (animated by gsap) plus a small parallax
// offset that follows the pointer while idle at home.
const HOME = { position: new THREE.Vector3(0.5, 0.85, 0.55), lookAt: new THREE.Vector3(0.3, 0.55, -1.75) };
const HOME_PORTRAIT = { position: new THREE.Vector3(0.55, 1.0, 1.35), lookAt: new THREE.Vector3(0.35, 0.5, -1.75) };

const base = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const parallax = new THREE.Vector3();
const parallaxTarget = new THREE.Vector3();
let mode = 'home'; // 'home' | 'moving' | 'screen'

function home() {
  return window.innerWidth < window.innerHeight ? HOME_PORTRAIT : HOME;
}

export function setupCamera(camera) {
  base.copy(home().position);
  lookAt.copy(home().lookAt);
  camera.position.copy(base);
  camera.lookAt(lookAt);
}

export function setParallax(nx, ny) {
  parallaxTarget.set(nx * 0.08, ny * 0.04, 0);
}

export function getMode() {
  return mode;
}

// Distance so the screen fills ~78% of the viewport height (or 88% width on
// narrow screens), whichever needs the camera further back.
function fitDistance(camera, screenSize) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dH = (screenSize.h / 0.78) / (2 * Math.tan(vFov / 2));
  const hTan = Math.tan(vFov / 2) * camera.aspect;
  const dW = (screenSize.w / 0.88) / (2 * hTan);
  return Math.max(dH, dW);
}

export function transitionToScreen(camera, screenCenter, screenSize, onComplete) {
  mode = 'moving';
  const d = fitDistance(camera, screenSize);
  const target = screenCenter.clone().add(new THREE.Vector3(0, 0, d));
  const tl = gsap.timeline({ onComplete: () => { mode = 'screen'; onComplete?.(); } });
  tl.to(parallax, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' }, 0);
  tl.to(base, { x: target.x, y: target.y, z: target.z, duration: 1.5, ease: 'power3.inOut' }, 0);
  tl.to(lookAt, { x: screenCenter.x, y: screenCenter.y, z: screenCenter.z, duration: 1.5, ease: 'power3.inOut' }, 0);
}

export function transitionToHome(camera, onComplete) {
  mode = 'moving';
  const h = home();
  const tl = gsap.timeline({ onComplete: () => { mode = 'home'; onComplete?.(); } });
  tl.to(base, { x: h.position.x, y: h.position.y, z: h.position.z, duration: 1.2, ease: 'power3.inOut' }, 0);
  tl.to(lookAt, { x: h.lookAt.x, y: h.lookAt.y, z: h.lookAt.z, duration: 1.2, ease: 'power3.inOut' }, 0);
}

export function updateCamera(camera) {
  if (mode === 'home') {
    parallax.lerp(parallaxTarget, 0.04);
  }
  camera.position.copy(base).add(parallax);
  camera.lookAt(lookAt);
}

export function refitCamera(camera, screenCenter, screenSize) {
  // Called on resize while a section is open so the screen keeps fitting.
  if (mode !== 'screen') return;
  const d = fitDistance(camera, screenSize);
  base.set(screenCenter.x, screenCenter.y, screenCenter.z + d);
}
