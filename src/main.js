import * as THREE from 'three';
import gsap from 'gsap';
import { createRoom } from './scene/room.js';
import { createTV, createConsole } from './scene/tv.js';
import { createBookshelf, createCartridges } from './scene/bookshelf.js';
import { initRaycaster, updateRaycaster } from './interaction/raycaster.js';
import {
  insertCartridge,
  ejectCartridge,
  isCartridgeAnimating,
  isCartridgeInserted,
  getCurrentCartridge,
} from './interaction/cartridge.js';
import { setupCamera, transitionToSection, transitionToHome, updateCamera } from './interaction/camera.js';
import { getAboutHTML } from './sections/about.js';
import { getProjectsHTML } from './sections/projects.js';
import { getExperienceHTML } from './sections/experience.js';
import { getContactHTML } from './sections/contact.js';

// --- Setup ---
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1825);
scene.fog = new THREE.Fog(0x1a1825, 12, 30);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
setupCamera(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

// --- Lighting ---
// Strong ambient so nothing is pitch black
const ambientLight = new THREE.AmbientLight(0x8888aa, 1.2);
scene.add(ambientLight);

// Hemisphere light (sky/ground fill)
const hemiLight = new THREE.HemisphereLight(0xccbbdd, 0x443322, 0.8);
scene.add(hemiLight);

// Main overhead light — bright warm
const overheadLight = new THREE.PointLight(0xffeedd, 40, 18);
overheadLight.position.set(0, 4, 0);
overheadLight.castShadow = true;
overheadLight.shadow.mapSize.set(512, 512);
scene.add(overheadLight);

// Fill from front — brighter
const fillLight = new THREE.PointLight(0x8888cc, 8, 12);
fillLight.position.set(-1, 2, 5);
scene.add(fillLight);

// Warm accent from right — light the bookshelf
const accentLight = new THREE.PointLight(0xddaa66, 12, 10);
accentLight.position.set(4, 2, -1);
scene.add(accentLight);

// Extra fill from left
const leftFill = new THREE.PointLight(0x6666aa, 5, 10);
leftFill.position.set(-4, 1, 0);
scene.add(leftFill);

// --- Scene Objects ---
createRoom(scene);
const { tvGroup, screenMaterial } = createTV(scene);
const { consoleGroup } = createConsole(scene);
const shelfGroup = createBookshelf(scene);
const cartridges = createCartridges(scene, shelfGroup);

// --- Section Content ---
const sectionContainer = document.getElementById('section-container');
const hintText = document.getElementById('hint-text');
const backBtn = document.getElementById('back-btn');

const sectionContent = {
  about: getAboutHTML(),
  projects: getProjectsHTML(),
  experience: getExperienceHTML(),
  contact: getContactHTML(),
};

function showSection(name) {
  sectionContainer.innerHTML = sectionContent[name.toLowerCase()];
  sectionContainer.classList.remove('hidden');
  const content = sectionContainer.querySelector('.section-content');
  if (content) {
    gsap.fromTo(content,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.8, ease: 'power2.out' }
    );
  }
}

function hideSection() {
  const content = sectionContainer.querySelector('.section-content');
  if (content) {
    gsap.to(content, {
      opacity: 0, y: -20, duration: 0.3,
      onComplete: () => {
        sectionContainer.classList.add('hidden');
        sectionContainer.innerHTML = '';
      }
    });
  } else {
    sectionContainer.classList.add('hidden');
  }
}

// --- Interaction ---
function onCartridgeClick(cartridge) {
  if (isCartridgeAnimating() || isCartridgeInserted()) return;

  hintText.style.display = 'none';

  // Activate power LED
  const led = consoleGroup.getObjectByName('powerLed');
  if (led) {
    led.material.emissive.set(0x00ff00);
    led.material.emissiveIntensity = 2;
  }

  // Activate screen glow
  const glow = tvGroup.getObjectByName('screenGlow');
  if (glow) {
    gsap.to(glow, { intensity: 1.5, duration: 0.5, delay: 0.8 });
  }

  insertCartridge(cartridge, screenMaterial, () => {
    // After insert animation, wait then transition camera
    setTimeout(() => {
      const sectionName = cartridge.userData.label.toLowerCase();
      transitionToSection(camera, sectionName, () => {
        showSection(sectionName);
        backBtn.classList.remove('hidden');
      });
    }, 800);
  });
}

backBtn.addEventListener('click', () => {
  if (isCartridgeAnimating()) return;

  backBtn.classList.add('hidden');
  hideSection();

  transitionToHome(camera, () => {
    // Deactivate power LED
    const led = consoleGroup.getObjectByName('powerLed');
    if (led) {
      led.material.emissive.set(0x330000);
      led.material.emissiveIntensity = 0.3;
    }

    // Deactivate screen glow
    const glow = tvGroup.getObjectByName('screenGlow');
    if (glow) {
      gsap.to(glow, { intensity: 0, duration: 0.3 });
    }

    ejectCartridge(screenMaterial, () => {
      hintText.style.display = 'block';
    });
  });
});

initRaycaster(camera, canvas, cartridges, onCartridgeClick);

// --- Loading Screen ---
const loadingScreen = document.getElementById('loading-screen');
const loaderFill = document.querySelector('.loader-fill');
gsap.to(loaderFill, {
  width: '100%',
  duration: 1.2,
  ease: 'power1.inOut',
  onComplete: () => {
    gsap.to(loadingScreen, {
      opacity: 0,
      duration: 0.5,
      delay: 0.3,
      onComplete: () => {
        loadingScreen.style.display = 'none';
      },
    });
  },
});

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animate ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Update screen shader
  screenMaterial.uniforms.uTime.value = elapsed;

  // Update raycaster hover
  if (!isCartridgeInserted() && !isCartridgeAnimating()) {
    updateRaycaster(camera);
  }

  updateCamera(camera);
  renderer.render(scene, camera);
}

animate();
