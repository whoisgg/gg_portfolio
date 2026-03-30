import * as THREE from 'three';
import { COLORS, createTVScreenMaterial } from './materials.js';

// Helper: rounded box using ExtrudeGeometry
function createRoundedBox(w, h, d, radius, segments) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const extrudeSettings = { depth: d, bevelEnabled: true, bevelThickness: radius * 0.3, bevelSize: radius * 0.3, bevelSegments: segments || 3 };
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

export function createTV(scene) {
  const tvGroup = new THREE.Group();
  tvGroup.position.set(0, 0, -3);

  // --- TV Stand (modern low cabinet) ---
  const standMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const standTopMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });

  // Main cabinet body (low, wide, modern)
  const cabinet = new THREE.Mesh(
    createRoundedBox(3.8, 0.5, 1.2, 0.04, 2),
    standMat
  );
  cabinet.position.set(0, -1.55, -0.6);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  tvGroup.add(cabinet);

  // Cabinet top surface
  const cabinetTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.75, 0.02, 1.15),
    standTopMat
  );
  cabinetTop.position.set(0, -1.28, 0);
  tvGroup.add(cabinetTop);

  // Cabinet legs (short modern feet)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
  for (const [x, z] of [[-1.6, 0.35], [1.6, 0.35], [-1.6, -0.55], [1.6, -0.55]]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.08),
      legMat
    );
    leg.position.set(x, -2.0, z);
    tvGroup.add(leg);
  }

  // --- Modern Flat TV ---
  const tvBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.1 });
  const tvFrame = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });

  // Thin panel body
  const panelW = 3.2, panelH = 2.0, panelD = 0.12;
  const panel = new THREE.Mesh(
    createRoundedBox(panelW, panelH, panelD, 0.03, 2),
    tvBlack
  );
  panel.position.set(0, 0.15, -panelD / 2);
  panel.castShadow = true;
  tvGroup.add(panel);

  // Thin bezel frame (front face)
  const bezelW = panelW + 0.04, bezelH = panelH + 0.04;
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(bezelW, bezelH, 0.02),
    tvFrame
  );
  bezel.position.set(0, 0.15, 0.01);
  tvGroup.add(bezel);

  // Screen (slightly inset)
  const screenW = panelW - 0.12, screenH = panelH - 0.12;
  const screenMaterial = createTVScreenMaterial();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    screenMaterial
  );
  screen.position.set(0, 0.15, 0.02);
  screen.name = 'tvScreen';
  tvGroup.add(screen);

  // Screen glow light
  const screenGlow = new THREE.PointLight(0x00ff44, 0, 3);
  screenGlow.position.set(0, 0.15, 1.0);
  screenGlow.name = 'screenGlow';
  tvGroup.add(screenGlow);

  // Bottom chin (slightly thicker bezel at bottom — brand area)
  const chin = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, 0.08, 0.03),
    tvFrame
  );
  chin.position.set(0, -0.82, 0.01);
  tvGroup.add(chin);

  // Brand logo plate (centered on chin)
  const brandPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.03, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 })
  );
  brandPlate.position.set(0, -0.82, 0.03);
  tvGroup.add(brandPlate);

  // Power LED on bottom right
  const tvLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0x222222,
      emissiveIntensity: 0.3,
    })
  );
  tvLed.position.set(panelW / 2 - 0.15, -0.82, 0.025);
  tvLed.name = 'tvLed';
  tvGroup.add(tvLed);

  // Stand neck (connects TV to cabinet)
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.35, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.1 })
  );
  neck.position.set(0, -1.05, -0.05);
  tvGroup.add(neck);

  // Stand base plate (on top of cabinet)
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.04, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35, metalness: 0.15 })
  );
  basePlate.position.set(0, -1.25, -0.05);
  tvGroup.add(basePlate);

  scene.add(tvGroup);
  return { tvGroup, screenMaterial, screen };
}

export function createConsole(scene) {
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, -1.15, -2.2);

  const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.console, roughness: 0.35, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: COLORS.consoleDark, roughness: 0.5 });
  const accentMat = new THREE.MeshStandardMaterial({ color: COLORS.consoleAccent, roughness: 0.4 });

  // Main body
  const body = new THREE.Mesh(
    createRoundedBox(1.8, 0.2, 0.95, 0.06, 2),
    bodyMat
  );
  body.position.set(0, 0, -0.475);
  body.castShadow = true;
  consoleGroup.add(body);

  // Top plate
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.04, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x9090b0, roughness: 0.4 })
  );
  topPlate.position.set(0, 0.12, 0);
  consoleGroup.add(topPlate);

  // Cartridge slot well
  const slotWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.06, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.9 })
  );
  slotWell.position.set(0, 0.15, -0.1);
  slotWell.name = 'cartridgeSlot';
  consoleGroup.add(slotWell);

  // Slot rails
  for (const x of [-0.42, 0.42]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.08, 0.2),
      darkMat
    );
    rail.position.set(x, 0.16, -0.1);
    consoleGroup.add(rail);
  }

  // Eject lever
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.04, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x707090, metalness: 0.2 })
  );
  lever.position.set(0.55, 0.15, -0.1);
  consoleGroup.add(lever);

  // Purple/indigo accent stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.04, 0.02),
    accentMat
  );
  stripe.position.set(0, 0.02, 0.48);
  consoleGroup.add(stripe);

  const thinStripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.015, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x8080c0 })
  );
  thinStripe.position.set(0, -0.02, 0.48);
  consoleGroup.add(thinStripe);

  // Power button
  const powerBtnRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.01, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x444460 })
  );
  powerBtnRing.position.set(-0.7, 0.14, 0.38);
  powerBtnRing.rotation.x = Math.PI / 2;
  consoleGroup.add(powerBtnRing);

  const powerBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0x555575, roughness: 0.3 })
  );
  powerBtn.position.set(-0.7, 0.14, 0.38);
  powerBtn.rotation.x = Math.PI / 2;
  consoleGroup.add(powerBtn);

  // Reset button
  const resetBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8),
    new THREE.MeshStandardMaterial({ color: 0x555575, roughness: 0.3 })
  );
  resetBtn.position.set(-0.55, 0.14, 0.38);
  resetBtn.rotation.x = Math.PI / 2;
  consoleGroup.add(resetBtn);

  // Power LED
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0x330000,
      emissiveIntensity: 0.3,
    })
  );
  led.position.set(0.7, 0.14, 0.38);
  led.name = 'powerLed';
  consoleGroup.add(led);

  // Controller ports
  const portMat = new THREE.MeshStandardMaterial({ color: 0x15151f, roughness: 0.8 });
  for (let i = 0; i < 2; i++) {
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.09, 0.04),
      portMat
    );
    recess.position.set(-0.15 + i * 0.3, -0.06, 0.48);
    consoleGroup.add(recess);

    for (let p = -3; p <= 3; p++) {
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.02, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      pin.position.set(-0.15 + i * 0.3 + p * 0.02, -0.06, 0.49);
      pin.rotation.x = Math.PI / 2;
      consoleGroup.add(pin);
    }
  }

  // Logo plate
  const logoPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xccaa55, metalness: 0.7, roughness: 0.2 })
  );
  logoPlate.position.set(0, 0.06, 0.485);
  consoleGroup.add(logoPlate);

  scene.add(consoleGroup);
  return { consoleGroup, slot: slotWell };
}
