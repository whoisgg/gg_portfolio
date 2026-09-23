import gsap from 'gsap';
import * as THREE from 'three';
import { CART } from '../scene/bookshelf.js';

let currentCartridge = null;
let isAnimating = false;
const slot = new THREE.Vector3();

// Inserted height: lower shell hidden inside the console.
function insertedY() {
  return slot.y + (CART.Hu + CART.Hl) / 2 - CART.Hl + 0.002;
}

export function setSlotPosition(v) {
  slot.copy(v);
}
export function isCartridgeInserted() { return currentCartridge !== null; }
export function getCurrentCartridge() { return currentCartridge; }
export function isCartridgeAnimating() { return isAnimating; }

export function insertCartridge(cartridge, screenMaterial, onComplete) {
  if (isAnimating || currentCartridge) return;
  isAnimating = true;
  currentCartridge = cartridge;
  cartridge.userData.isInserted = true;

  gsap.killTweensOf(cartridge.position);
  const yIn = insertedY();
  const start = cartridge.position.clone();
  const tl = gsap.timeline({ onComplete: () => { isAnimating = false; onComplete?.(); } });

  // Lift off the shelf and square up
  tl.to(cartridge.position, { y: start.y + 0.09, z: start.z + 0.07, duration: 0.35, ease: 'power2.out' }, 0);
  tl.to(cartridge.rotation, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power1.inOut' }, 0);
  // Arc over to the console
  tl.to(cartridge.position, { x: slot.x, y: yIn + 0.16, z: slot.z, duration: 0.7, ease: 'power2.inOut' });
  tl.to(cartridge.rotation, { y: Math.PI * 2, duration: 0.7, ease: 'power2.inOut' }, '<');
  // Drop into the slot
  tl.to(cartridge.position, { y: yIn, duration: 0.35, ease: 'power3.in' });
  tl.call(() => bootScreen(screenMaterial, cartridge.userData.color));
  // Click / settle
  tl.to(cartridge.position, { y: yIn + 0.003, duration: 0.08, ease: 'power1.out' });
  tl.to(cartridge.position, { y: yIn, duration: 0.06, ease: 'power1.in' });
}

export function ejectCartridge(screenMaterial, onComplete) {
  if (isAnimating || !currentCartridge) return;
  isAnimating = true;
  const cartridge = currentCartridge;
  const o = cartridge.userData.originalPosition;
  const tl = gsap.timeline({
    onComplete: () => {
      cartridge.userData.isInserted = false;
      currentCartridge = null;
      isAnimating = false;
      onComplete?.(cartridge);
    },
  });
  tl.call(() => powerOffScreen(screenMaterial));
  tl.to(cartridge.position, { y: insertedY() + 0.12, duration: 0.3, ease: 'back.out(2.2)' });
  tl.to(cartridge.position, { x: o.x, y: o.y + 0.05, z: o.z + 0.07, duration: 0.6, ease: 'power2.inOut' });
  tl.to(cartridge.rotation, { y: cartridge.userData.originalRotationY, x: cartridge.userData.originalRotationX ?? 0, duration: 0.6, ease: 'power2.inOut' }, '<');
  tl.to(cartridge.position, { y: o.y, z: o.z, duration: 0.3, ease: 'power2.in' });
}

function bootScreen(material, color) {
  const u = material.uniforms;
  u.uColor.value.set(color);
  const tl = gsap.timeline();
  // White flash, then the picture fades in with a couple of flickers
  tl.to(u.uBoot, { value: 0.5, duration: 0.05 });
  tl.to(u.uBoot, { value: 0, duration: 0.35, ease: 'power2.out' });
  tl.to(u.uActive, { value: 1, duration: 0.12 }, 0.1);
  tl.to(u.uActive, { value: 0.3, duration: 0.06 });
  tl.to(u.uActive, { value: 1, duration: 0.08 });
  tl.to(u.uActive, { value: 0.6, duration: 0.05 });
  tl.to(u.uActive, { value: 1, duration: 0.15 });
}

function powerOffScreen(material) {
  const u = material.uniforms;
  const tl = gsap.timeline();
  tl.to(u.uBoot, { value: 0.25, duration: 0.05 });
  tl.to(u.uBoot, { value: 0, duration: 0.2 });
  tl.to(u.uActive, { value: 0, duration: 0.15, ease: 'power3.in' }, 0);
}
