import gsap from 'gsap';
import * as THREE from 'three';

// Desktop defaults
let HOME_POSITION = new THREE.Vector3(1.5, 0.5, 6.5);
let HOME_LOOKAT = new THREE.Vector3(1, -0.2, -2);

// Adjust for mobile portrait
function updateHomeForAspect() {
  if (window.innerWidth < window.innerHeight) {
    HOME_POSITION = new THREE.Vector3(1.8, 0.8, 6.5);
    HOME_LOOKAT = new THREE.Vector3(1.2, 0.2, -2);
  } else {
    HOME_POSITION = new THREE.Vector3(1.5, 0.5, 6.5);
    HOME_LOOKAT = new THREE.Vector3(1, -0.2, -2);
  }
}
updateHomeForAspect();
window.addEventListener('resize', updateHomeForAspect);

const SECTION_CAMERAS = {
  about: {
    position: new THREE.Vector3(-5, 0.5, 1),
    lookAt: new THREE.Vector3(-5, 0, -2),
  },
  projects: {
    position: new THREE.Vector3(5, 0.5, 1),
    lookAt: new THREE.Vector3(5, 0, -2),
  },
  experience: {
    position: new THREE.Vector3(0, -3, 1),
    lookAt: new THREE.Vector3(0, -3.5, -2),
  },
  contact: {
    position: new THREE.Vector3(0, 0.3, -1),
    lookAt: new THREE.Vector3(0, -0.3, -4),
  },
};

let currentLookAt = HOME_LOOKAT.clone();

export function setupCamera(camera) {
  camera.position.copy(HOME_POSITION);
  currentLookAt.copy(HOME_LOOKAT);
  camera.lookAt(currentLookAt);
}

export function transitionToSection(camera, sectionName, onComplete) {
  const target = SECTION_CAMERAS[sectionName.toLowerCase()];
  if (!target) return;

  const tl = gsap.timeline({ onComplete });

  tl.to(camera.position, {
    x: target.position.x,
    y: target.position.y,
    z: target.position.z,
    duration: 1.2,
    ease: 'power2.inOut',
  });

  tl.to(currentLookAt, {
    x: target.lookAt.x,
    y: target.lookAt.y,
    z: target.lookAt.z,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(currentLookAt),
  }, '<');
}

export function transitionToHome(camera, onComplete) {
  const tl = gsap.timeline({ onComplete });

  tl.to(camera.position, {
    x: HOME_POSITION.x,
    y: HOME_POSITION.y,
    z: HOME_POSITION.z,
    duration: 1,
    ease: 'power2.inOut',
  });

  tl.to(currentLookAt, {
    x: HOME_LOOKAT.x,
    y: HOME_LOOKAT.y,
    z: HOME_LOOKAT.z,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(currentLookAt),
  }, '<');
}

export function updateCamera(camera) {
  camera.lookAt(currentLookAt);
}
