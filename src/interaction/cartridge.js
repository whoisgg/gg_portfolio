import gsap from 'gsap';
import * as THREE from 'three';

let currentCartridge = null;
let isAnimating = false;

// Console is at (0, -1.15, -2.2), slot is at relative (0, 0.15, -0.1)
// So absolute slot position = (0, -1.0, -2.3)
// Cartridge should sit in the slot with upper half sticking out
const SLOT_X = 0;
const SLOT_Z = -2.3;
const SLOT_Y_INSERTED = -1.05; // push deep so only the wide upper label area shows above console

export function isCartridgeInserted() {
  return currentCartridge !== null;
}

export function getCurrentCartridge() {
  return currentCartridge;
}

export function isCartridgeAnimating() {
  return isAnimating;
}

export function insertCartridge(cartridge, screenMaterial, onComplete) {
  if (isAnimating || currentCartridge) return;
  isAnimating = true;
  currentCartridge = cartridge;
  cartridge.userData.isInserted = true;

  const startPos = cartridge.position.clone();

  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false;
      if (onComplete) onComplete();
    },
  });

  // Float up from shelf
  tl.to(cartridge.position, {
    y: startPos.y + 0.6,
    duration: 0.3,
    ease: 'power2.out',
  });

  // Rotate to face console (ensure flat orientation)
  tl.to(cartridge.rotation, {
    y: 0,
    x: 0,
    z: 0,
    duration: 0.2,
    ease: 'power1.inOut',
  }, '<');

  // Fly to above the console slot
  tl.to(cartridge.position, {
    x: SLOT_X,
    y: SLOT_Y_INSERTED + 0.5,
    z: SLOT_Z,
    duration: 0.5,
    ease: 'power2.inOut',
  });

  // Push down into the slot
  tl.to(cartridge.position, {
    y: SLOT_Y_INSERTED,
    duration: 0.3,
    ease: 'power3.in',
  });

  // Activate screen with flicker
  tl.call(() => {
    activateScreen(screenMaterial, cartridge.userData.color);
  });

  // Small click/settle
  tl.to(cartridge.position, {
    y: SLOT_Y_INSERTED + 0.02,
    duration: 0.08,
    ease: 'power1.out',
  });
  tl.to(cartridge.position, {
    y: SLOT_Y_INSERTED,
    duration: 0.06,
    ease: 'power1.in',
  });
}

export function ejectCartridge(screenMaterial, onComplete) {
  if (isAnimating || !currentCartridge) return;
  isAnimating = true;
  const cartridge = currentCartridge;

  const tl = gsap.timeline({
    onComplete: () => {
      cartridge.userData.isInserted = false;
      currentCartridge = null;
      isAnimating = false;
      if (onComplete) onComplete();
    },
  });

  // Deactivate screen
  tl.call(() => {
    deactivateScreen(screenMaterial);
  });

  // Pop up from slot (spring eject feel)
  tl.to(cartridge.position, {
    y: SLOT_Y_INSERTED + 0.8,
    duration: 0.25,
    ease: 'back.out(2)',
  });

  // Fly back to shelf position
  tl.to(cartridge.position, {
    x: cartridge.userData.originalPosition.x,
    y: cartridge.userData.originalPosition.y,
    z: cartridge.userData.originalPosition.z,
    duration: 0.5,
    ease: 'power2.inOut',
  });
}

function activateScreen(material, color) {
  material.uniforms.uActive.value = 1;
  material.uniforms.uColor.value.set(color);

  // Flicker effect
  let flickerCount = 0;
  const flickerInterval = setInterval(() => {
    material.uniforms.uActive.value = flickerCount % 2 === 0 ? 1 : 0;
    flickerCount++;
    if (flickerCount > 5) {
      clearInterval(flickerInterval);
      material.uniforms.uActive.value = 1;
    }
  }, 60);
}

function deactivateScreen(material) {
  gsap.to(material.uniforms.uActive, {
    value: 0,
    duration: 0.3,
  });
}
