import * as THREE from 'three';
import { COLORS } from './materials.js';

export function createRoom(scene) {
  // Floor with wood-plank feel
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x4a3e35,
    roughness: 0.85,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.3;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor plank lines
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x1e1a16, roughness: 0.9 });
  for (let i = -8; i <= 8; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.005, 0.02),
      plankMat
    );
    line.position.set(0, -2.295, i * 1.2);
    line.rotation.y = Math.PI / 4;
    scene.add(line);
  }

  // Back wall
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2e2838, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
  backWall.position.set(0, 3, -4);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Baseboard
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 });
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 0.05),
    baseboardMat
  );
  baseboard.position.set(0, -2.2, -3.97);
  scene.add(baseboard);

  // Side walls
  for (const [x, rotY] of [[-10, Math.PI / 2], [10, -Math.PI / 2]]) {
    const sideWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x282230, roughness: 0.9 })
    );
    sideWall.position.set(x, 3, 1);
    sideWall.rotation.y = rotY;
    sideWall.receiveShadow = true;
    scene.add(sideWall);
  }

  // (carpet removed)

  // Ceiling (dark)
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6;
  scene.add(ceiling);

  // Overhead light fixture (simple pendant)
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4 });
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 1.5, 6),
    fixtureMat
  );
  cord.position.set(0, 5.2, -1);
  scene.add(cord);

  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.2, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide })
  );
  shade.position.set(0, 4.45, -1);
  scene.add(shade);

  // === WALL POSTERS (90s kid room — cover the wall!) ===
  const posterFrameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  const textureLoader = new THREE.TextureLoader();

  function addPoster(imgPath, x, y, w, h) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.03),
      posterFrameMat
    );
    frame.position.set(x, y, -3.97);
    scene.add(frame);

    textureLoader.load(imgPath, (tex) => {
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })
      );
      art.position.set(x, y, -3.94);
      scene.add(art);
    });
  }

  // Layout: back wall spans roughly x=-6 to x=6
  // Floating shelves at x=-2.8, TV at x=0, bookshelf at x=3.2
  //
  // TOP ROW (y ~2.5-3.0):
  //   All Valley (tall)  |  Rush (square)  |  FF7 (tall)  |  WC3/Arthas
  //
  // MIDDLE ROW (y ~1.0-1.5):
  //   Iron Maiden  |  [shelves]  |  [TV]  |  Ghibli  |  [bookshelf]
  //
  // Arrange around the furniture:

  // --- TOP ROW ---
  // All Valley Tournament — above floating shelves area
  addPoster('/poster-allvalley.jpg', 0, 2.8, 1.0, 1.4);

  // Iron Maiden - Fear of the Dark — left of shelves, mid height
  addPoster('/poster-ironmaiden.jpg', -4.2, 1.0, 0.7, 0.7);

  // Rush - Fly By Night — above/between shelves and TV
  addPoster('/poster-rush.jpg', -1.3, 2.5, 0.75, 0.75);

  // Black Lotus (MTG) — next to All Valley, same line as Warcraft
  addPoster('/poster-blacklotus.webp', 1.3, 2.5, 0.8, 0.8);

  // FF7 (Cloud) — pushed up higher
  addPoster('/poster-ff7.jpg', 1.8, 3.6, 0.6, 0.9);

  // Warcraft 3 Arthas — MAIN poster, big, above bookshelf
  addPoster('/poster.avif', 3.2, 2.5, 1.6, 1.1);

  // Ghibli (lunar) — above the floating shelves on the left
  addPoster('/poster-yugi.jpg', -2.8, 3.0, 1.0, 0.7);

  // --- FILL MORE GAPS ---
  // Ghibli lower right
  addPoster('/poster-ghibli.jpg', 5.0, 1.0, 0.7, 0.5);

  // --- PLACEHOLDER POSTERS (replace images later) ---
  // Helper for empty colored poster placeholders
  function addPlaceholder(x, y, w, h, color) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.03),
      posterFrameMat
    );
    frame.position.set(x, y, -3.97);
    scene.add(frame);

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
    );
    art.position.set(x, y, -3.94);
    scene.add(art);
  }

  // Far left column
  addPlaceholder(-5.5, 2.5, 0.6, 0.8, 0x1a2a1a);  // slot for future poster
  addPlaceholder(-5.5, 1.2, 0.55, 0.55, 0x2a1a2a); // slot for future poster

  // (removed — was hidden behind TV)

  // Right of bookshelf, lower
  addPlaceholder(5.0, 0.5, 0.65, 0.65, 0x2a2a1a);  // slot for future poster

  // === 3 FLOATING WALL SHELVES (repisas) on the left side ===
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 });
  const shelfBracketMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.5 });

  const repisaX = -2.8;
  const repisaYs = [0.0, 1.0, 2.0]; // 3 shelves at different heights

  for (const ry of repisaYs) {
    // Shelf plank
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.3),
      shelfMat
    );
    plank.position.set(repisaX, ry, -3.8);
    plank.castShadow = true;
    scene.add(plank);

    // L-brackets
    for (const bx of [-0.4, 0.4]) {
      // Vertical part
      const bracketV = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.15, 0.03),
        shelfBracketMat
      );
      bracketV.position.set(repisaX + bx, ry - 0.1, -3.65);
      scene.add(bracketV);

      // Horizontal part
      const bracketH = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.2),
        shelfBracketMat
      );
      bracketH.position.set(repisaX + bx, ry - 0.02, -3.75);
      scene.add(bracketH);
    }
  }

  // === FIGURES on the repisas ===

  // --- Bottom shelf (y=0.0): FINAL FANTASY — Buster Sword + Crystal ---

  // Buster Sword (iconic FF7 weapon)
  const swordGroup = new THREE.Group();
  swordGroup.position.set(repisaX - 0.15, 0.18, -3.8);
  swordGroup.rotation.z = 0.15; // slight lean

  // Blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.3, 0.015),
    new THREE.MeshStandardMaterial({ color: 0xaabbcc, metalness: 0.7, roughness: 0.2 })
  );
  swordGroup.add(blade);

  // Blade edge highlight
  const bladeEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.28, 0.016),
    new THREE.MeshStandardMaterial({ color: 0xddddee, metalness: 0.8, roughness: 0.1 })
  );
  bladeEdge.position.x = 0.018;
  swordGroup.add(bladeEdge);

  // Guard (crosspiece)
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.02, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.6, roughness: 0.3 })
  );
  guard.position.y = -0.16;
  swordGroup.add(guard);

  // Handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.7 })
  );
  handle.position.y = -0.21;
  swordGroup.add(handle);

  // Handle wrap
  for (let w = 0; w < 3; w++) {
    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.013, 0.003, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    wrap.position.y = -0.19 + w * 0.025;
    wrap.rotation.x = Math.PI / 2;
    swordGroup.add(wrap);
  }

  scene.add(swordGroup);

  // FF Crystal (glowing blue crystal)
  const crystalGroup = new THREE.Group();
  crystalGroup.position.set(repisaX + 0.3, 0.13, -3.8);

  // Crystal body (octahedron)
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.06, 0),
    new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      emissive: 0x2244aa,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.2,
    })
  );
  crystal.rotation.y = Math.PI / 4;
  crystalGroup.add(crystal);

  // Crystal base (small pedestal)
  const crystalBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.03, 6),
    new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.6 })
  );
  crystalBase.position.y = -0.06;
  crystalGroup.add(crystalBase);

  // Crystal glow
  const crystalGlow = new THREE.PointLight(0x4488ff, 0.5, 1);
  crystalGlow.position.y = 0.05;
  crystalGroup.add(crystalGlow);

  scene.add(crystalGroup);

  // --- Middle shelf (y=1.0): WORLD OF WARCRAFT — Alliance Shield + Potion ---

  // Alliance Shield (blue and gold, lion-inspired)
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(repisaX + 0.15, 1.12, -3.75);
  shieldGroup.rotation.x = -0.15;

  const allianceBlue = new THREE.MeshStandardMaterial({ color: 0x1a3366, roughness: 0.45 });
  const allianceGold = new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.7, roughness: 0.2 });

  // Shield body (kite shape — taller than wide)
  const shieldBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.22, 0.02),
    allianceBlue
  );
  shieldGroup.add(shieldBody);

  // Gold rim
  const shieldRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.155, 0.235, 0.01),
    allianceGold
  );
  shieldRim.position.z = -0.005;
  shieldGroup.add(shieldRim);

  // Lion head emblem (simplified — circle head + triangle mane)
  const lionHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    allianceGold
  );
  lionHead.position.set(0, 0.02, 0.015);
  shieldGroup.add(lionHead);

  // Mane points (triangles around lion head)
  for (let a = 0; a < 6; a++) {
    const manePoint = new THREE.Mesh(
      new THREE.ConeGeometry(0.01, 0.025, 3),
      allianceGold
    );
    const angle = (a * Math.PI * 2) / 6 + Math.PI / 6;
    manePoint.position.set(
      Math.cos(angle) * 0.035,
      0.02 + Math.sin(angle) * 0.035,
      0.015
    );
    manePoint.rotation.z = angle - Math.PI / 2;
    shieldGroup.add(manePoint);
  }

  // Gold cross on shield
  const crossV = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.18, 0.005),
    allianceGold
  );
  crossV.position.z = 0.012;
  shieldGroup.add(crossV);

  const crossH = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.015, 0.005),
    allianceGold
  );
  crossH.position.set(0, 0.02, 0.012);
  shieldGroup.add(crossH);

  scene.add(shieldGroup);

  // Yoshi figure (green dinosaur)
  const yoshiGroup = new THREE.Group();
  yoshiGroup.position.set(repisaX - 0.3, 1.08, -3.78);

  const yoshiGreen = new THREE.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.5 });
  const yoshiWhite = new THREE.MeshStandardMaterial({ color: 0xf0f0e0, roughness: 0.5 });
  const yoshiRed = new THREE.MeshStandardMaterial({ color: 0xdd4422, roughness: 0.5 });
  const yoshiOrange = new THREE.MeshStandardMaterial({ color: 0xdd8833, roughness: 0.5 });

  // Body (round, white belly)
  const yoshiBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    yoshiGreen
  );
  yoshiGroup.add(yoshiBody);

  // White belly
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    yoshiWhite
  );
  belly.position.set(0, -0.01, 0.02);
  belly.scale.set(0.8, 0.9, 0.6);
  yoshiGroup.add(belly);

  // Head (larger, elongated snout)
  const yoshiHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    yoshiGreen
  );
  yoshiHead.position.set(0, 0.07, 0.02);
  yoshiGroup.add(yoshiHead);

  // Snout/nose (white, extended forward)
  const snout = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    yoshiWhite
  );
  snout.position.set(0, 0.06, 0.06);
  snout.scale.set(0.8, 0.7, 1.2);
  yoshiGroup.add(snout);

  // Eyes (big, white with black pupils)
  for (const ex of [-0.02, 0.02]) {
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 8, 8),
      yoshiWhite
    );
    eyeWhite.position.set(ex, 0.09, 0.04);
    yoshiGroup.add(eyeWhite);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    pupil.position.set(ex, 0.09, 0.055);
    yoshiGroup.add(pupil);
  }

  // Red shell/saddle on back
  const saddle = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    yoshiRed
  );
  saddle.position.set(0, 0.03, -0.04);
  saddle.scale.set(1, 0.7, 0.8);
  yoshiGroup.add(saddle);

  // Shoes (orange)
  for (const sx of [-0.025, 0.025]) {
    const shoe = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 6, 6),
      yoshiOrange
    );
    shoe.position.set(sx, -0.065, 0.01);
    shoe.scale.set(0.8, 0.5, 1.2);
    yoshiGroup.add(shoe);
  }

  // Tail (small cone pointing back)
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.015, 0.05, 6),
    yoshiGreen
  );
  tail.position.set(0, -0.02, -0.07);
  tail.rotation.x = Math.PI / 3;
  yoshiGroup.add(tail);

  scene.add(yoshiGroup);

  // Horde emblem / axe on shelf
  const axeGroup = new THREE.Group();
  axeGroup.position.set(repisaX - 0.05, 1.1, -3.82);
  axeGroup.rotation.z = -0.3;

  // Axe handle
  const axeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 })
  );
  axeGroup.add(axeHandle);

  // Axe head
  const axeHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.05, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.6, roughness: 0.3 })
  );
  axeHead.position.set(0.02, 0.08, 0);
  axeGroup.add(axeHead);

  scene.add(axeGroup);

  // --- Top shelf (y=2.0): MTG / YUGIOH — Card deck + Millennium Puzzle ---

  // Stack of cards (MTG style)
  const cardStack = new THREE.Group();
  cardStack.position.set(repisaX - 0.25, 2.06, -3.8);

  // Multiple cards stacked
  for (let c = 0; c < 6; c++) {
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.005, 0.09),
      new THREE.MeshStandardMaterial({
        color: c % 2 === 0 ? 0x1a1a2a : 0x2a1a1a,
        roughness: 0.7,
      })
    );
    card.position.y = c * 0.006;
    card.rotation.y = c * 0.02; // slight splay
    cardStack.add(card);
  }

  // Top card (face up, colored)
  const topCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.005, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x886622, roughness: 0.5 })
  );
  topCard.position.y = 0.038;
  cardStack.add(topCard);

  // Card art (tiny colored rectangle on top)
  const cardArt = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.065),
    new THREE.MeshStandardMaterial({ color: 0x2244aa })
  );
  cardArt.rotation.x = -Math.PI / 2;
  cardArt.position.y = 0.042;
  cardStack.add(cardArt);

  scene.add(cardStack);

  // Single propped up card (like a showcase card)
  const standingCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.09, 0.003),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.6 })
  );
  standingCard.position.set(repisaX - 0.05, 2.08, -3.88);
  standingCard.rotation.x = -0.15;
  scene.add(standingCard);

  // Card face art
  const standingArt = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.065),
    new THREE.MeshStandardMaterial({ color: 0x6633aa })
  );
  standingArt.position.set(repisaX - 0.05, 2.08, -3.877);
  standingArt.rotation.x = -0.15;
  scene.add(standingArt);

  // Millennium Puzzle (Yugioh - pyramid shape, golden)
  const puzzleGroup = new THREE.Group();
  puzzleGroup.position.set(repisaX + 0.3, 2.1, -3.8);

  // Inverted pyramid body
  const pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.1, 4),
    new THREE.MeshStandardMaterial({
      color: 0xddaa33,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  pyramid.rotation.x = Math.PI; // inverted
  pyramid.rotation.y = Math.PI / 4;
  puzzleGroup.add(pyramid);

  // Eye of Horus detail (small triangle on front)
  const eyeDetail = new THREE.Mesh(
    new THREE.ConeGeometry(0.015, 0.03, 3),
    new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.4,
    })
  );
  eyeDetail.position.set(0, 0.01, 0.04);
  eyeDetail.rotation.x = Math.PI;
  puzzleGroup.add(eyeDetail);

  // Ring at top (for the chain)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.015, 0.004, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xddaa33, metalness: 0.7, roughness: 0.2 })
  );
  ring.position.y = 0.055;
  puzzleGroup.add(ring);

  // Puzzle glow
  const puzzleGlow = new THREE.PointLight(0xffaa33, 0.3, 0.8);
  puzzleGroup.add(puzzleGlow);

  scene.add(puzzleGroup);
}
