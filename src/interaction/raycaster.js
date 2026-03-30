import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let hoveredObject = null;
let onClickCallback = null;
let interactiveObjects = [];

export function initRaycaster(camera, canvas, objects, onClick) {
  interactiveObjects = objects;
  onClickCallback = onClick;

  canvas.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  canvas.addEventListener('click', () => {
    if (hoveredObject) {
      onClickCallback(hoveredObject);
    }
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = getAllMeshes(interactiveObjects);
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const parent = findCartridgeParent(intersects[0].object);
        if (parent) onClickCallback(parent);
      }
    }
  });
}

export function updateRaycaster(camera) {
  raycaster.setFromCamera(mouse, camera);
  const meshes = getAllMeshes(interactiveObjects);
  const intersects = raycaster.intersectObjects(meshes, false);

  // Reset previous hover
  if (hoveredObject) {
    setEmissive(hoveredObject, 0x000000, 0);
    document.body.classList.remove('pointer');
    hoveredObject = null;
  }

  if (intersects.length > 0) {
    const parent = findCartridgeParent(intersects[0].object);
    if (parent && !parent.userData.isInserted) {
      hoveredObject = parent;
      setEmissive(parent, parent.userData.color, 0.3);
      document.body.classList.add('pointer');
    }
  }
}

function getAllMeshes(groups) {
  const meshes = [];
  for (const group of groups) {
    group.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
  }
  return meshes;
}

function findCartridgeParent(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.label !== undefined) return current;
    current = current.parent;
  }
  return null;
}

function setEmissive(group, color, intensity) {
  group.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive) {
      child.material.emissive.set(color);
      child.material.emissiveIntensity = intensity;
    }
  });
}
