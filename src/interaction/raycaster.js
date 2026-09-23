import * as THREE from 'three';
import gsap from 'gsap';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);
let hovered = null;
let onClickCallback = null;
let onHoverCallback = null;
let meshes = [];
let enabled = true;

export function initRaycaster(camera, canvas, cartridges, onClick, onHover) {
  onClickCallback = onClick;
  onHoverCallback = onHover;
  meshes = [];
  for (const group of cartridges) {
    group.traverse((child) => { if (child.isMesh) meshes.push(child); });
  }

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  canvas.addEventListener('click', (e) => {
    // On touch there is no hover, so pick from the tap position directly.
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    const hit = pick(camera);
    if (hit) onClickCallback(hit);
  });
}

export function setRaycasterEnabled(v) {
  enabled = v;
  if (!v) clearHover();
}

export function getPointer() {
  return pointer;
}

function pick(camera) {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return null;
  const parent = findCartridge(hits[0].object);
  return parent && !parent.userData.cartridge?.userData.isInserted ? parent : null;
}

function clearHover() {
  if (hovered) {
    setEmissive(hovered, 0x000000, 0);
    const o = hovered.userData.originalPosition;
    gsap.to(hovered.position, { z: o.z, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    document.body.classList.remove('pointer');
    hovered = null;
    onHoverCallback?.(null);
  }
}

export function updateRaycaster(camera) {
  if (!enabled) return;
  const hit = pick(camera);
  if (hit === hovered) return;
  clearHover();
  if (hit) {
    hovered = hit;
    setEmissive(hit, hit.userData.color, 0.25);
    const o = hit.userData.originalPosition;
    gsap.to(hit.position, { z: o.z + 0.03, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    document.body.classList.add('pointer');
    onHoverCallback?.(hit);
  }
}

function findCartridge(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.isMenu) return current;
    current = current.parent;
  }
  return null;
}

function setEmissive(group, color, intensity) {
  group.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive && !child.material.map) {
      child.material.emissive.set(color);
      child.material.emissiveIntensity = intensity;
    }
  });
}
