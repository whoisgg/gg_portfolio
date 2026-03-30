import * as THREE from 'three';
import { COLORS } from './materials.js';

export function createBookshelf(scene) {
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(3.2, -0.5, -3);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.7 });
  const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.75 });
  const woodEdgeMat = new THREE.MeshStandardMaterial({ color: 0x6a4520, roughness: 0.8 });

  // Vertical sides
  const shelfW = 2.4; // wider shelf
  const sideGeo = new THREE.BoxGeometry(0.1, 3.2, 0.85);
  for (const x of [-shelfW / 2, shelfW / 2]) {
    const side = new THREE.Mesh(sideGeo, woodMat);
    side.position.set(x, 0.05, 0);
    side.castShadow = true;
    shelfGroup.add(side);

    const edgeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 3.2, 0.02),
      woodEdgeMat
    );
    edgeStrip.position.set(x + (x > 0 ? -0.04 : 0.04), 0.05, 0.42);
    shelfGroup.add(edgeStrip);
  }

  // Horizontal shelves
  const shelfYPositions = [-1.5, -0.3, 0.9, 1.6];
  for (const y of shelfYPositions) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(shelfW + 0.1, 0.07, 0.85),
      woodDarkMat
    );
    plank.position.y = y;
    plank.receiveShadow = true;
    shelfGroup.add(plank);

    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(shelfW + 0.1, 0.1, 0.03),
      woodMat
    );
    lip.position.set(0, y + 0.04, 0.43);
    shelfGroup.add(lip);
  }

  // Back panel
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(shelfW + 0.1, 3.2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 })
  );
  backPanel.position.set(0, 0.05, -0.42);
  shelfGroup.add(backPanel);

  // Crown molding
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(shelfW + 0.3, 0.08, 0.95),
    woodMat
  );
  crown.position.set(0, 1.68, 0);
  shelfGroup.add(crown);

  // --- Bottom shelf: WoW game boxes (facing forward, spread across shelf) ---
  const boxH = 0.75, boxW = 0.55, boxD = 0.05;
  const wowImages = ['/wow-classic.jpg', '/wow-tbc.jpg', '/wow-wotlk.jpg'];
  const wowSpineColors = [0x2a2a10, 0x0a2a10, 0x1a3355];
  const texLoader = new THREE.TextureLoader();

  for (let b = 0; b < 3; b++) {
    const boxGroup = new THREE.Group();

    // Box body (thin, facing forward)
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxD),
      new THREE.MeshStandardMaterial({ color: wowSpineColors[b], roughness: 0.6 })
    );
    boxGroup.add(box);

    // Front cover (loaded image, facing the camera)
    texLoader.load(wowImages[b], (tex) => {
      const cover = new THREE.Mesh(
        new THREE.PlaneGeometry(boxW, boxH),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })
      );
      cover.position.z = boxD / 2 + 0.001;
      boxGroup.add(cover);
    });

    // Spread across the shelf width, centered
    const spacing = 0.72;
    const startX = -spacing;
    boxGroup.position.set(startX + b * spacing, -1.18, 0.1);
    boxGroup.rotation.y = -0.05 + b * 0.05; // very slight angle
    shelfGroup.add(boxGroup);
  }

  scene.add(shelfGroup);
  return shelfGroup;
}

// Build a clean SNES cartridge — proper 3D shape, simple label
function createSNESCartridge(accentColor, label) {
  const cartGroup = new THREE.Group();
  const accent = new THREE.Color(accentColor);

  // Shared materials
  const gray = new THREE.MeshStandardMaterial({ color: 0xbcbcbc, roughness: 0.45 });
  const grayDark = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.5 });
  const grayEdge = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5 });

  // --- Dimensions ---
  const W = 0.65;
  const D = 0.1;
  const upperH = 0.35;
  const lowerH = 0.18;
  const totalH = upperH + lowerH;
  const lowerW = W * 0.88;

  // === UPPER SHELL (label area) ===
  const upper = new THREE.Mesh(new THREE.BoxGeometry(W, upperH, D), gray);
  upper.position.y = lowerH / 2;
  upper.castShadow = true;
  cartGroup.add(upper);

  // === LOWER SHELL (narrower, connector area) ===
  const lower = new THREE.Mesh(new THREE.BoxGeometry(lowerW, lowerH, D * 0.8), grayDark);
  lower.position.y = -upperH / 2;
  lower.castShadow = true;
  cartGroup.add(lower);

  // === TOP EDGE (rounded) ===
  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.03, 0.02, D - 0.02),
    gray
  );
  topEdge.position.y = lowerH / 2 + upperH / 2 + 0.005;
  cartGroup.add(topEdge);

  // Top corners
  for (const xc of [-1, 1]) {
    const corner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, D - 0.02, 8),
      gray
    );
    corner.rotation.x = Math.PI / 2;
    corner.position.set(xc * (W / 2 - 0.012), lowerH / 2 + upperH / 2, 0);
    cartGroup.add(corner);
  }

  // === SIDE GRIP RIDGES ===
  for (const xSide of [-1, 1]) {
    for (let r = 0; r < 5; r++) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.015, D * 0.9),
        grayEdge
      );
      ridge.position.set(
        xSide * (W / 2 - 0.004),
        lowerH / 2 - upperH / 2 + 0.06 + r * 0.04,
        0
      );
      cartGroup.add(ridge);
    }
  }

  // === SCREW HOLE ===
  const screw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 })
  );
  screw.rotation.x = Math.PI / 2;
  screw.position.set(W / 2 - 0.06, -upperH / 2 + 0.04, D / 2 + 0.002);
  cartGroup.add(screw);

  // === LABEL STICKER (clean, just the title) ===
  const labelW = W * 0.75;
  const labelH = upperH * 0.7;

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  // Colored background
  const hex = '#' + accent.getHexString();
  const darkHex = '#' + accent.clone().multiplyScalar(0.5).getHexString();
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, hex);
  grad.addColorStop(1, darkHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 200);

  // Thin border
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 392, 192);

  // Section title — clean, centered
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, 200, 100);
  ctx.shadowBlur = 0;

  const labelTex = new THREE.CanvasTexture(canvas);
  labelTex.anisotropy = 4;
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(labelW, labelH),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75 })
  );
  labelMesh.position.set(0, lowerH / 2 + 0.01, D / 2 + 0.001);
  cartGroup.add(labelMesh);

  // === BOTTOM CONNECTOR (gold pins) ===
  const connW = lowerW * 0.7;
  const pinStrip = new THREE.Mesh(
    new THREE.BoxGeometry(connW, 0.04, D * 0.4),
    new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.7, roughness: 0.15 })
  );
  pinStrip.position.y = -upperH / 2 - lowerH / 2 - 0.02;
  cartGroup.add(pinStrip);

  return cartGroup;
}

export function createCartridges(scene, shelfGroup) {
  const cartridges = [];
  const labels = COLORS.cartridgeLabels;
  const colors = COLORS.cartridgeColors;
  const shelfPos = shelfGroup.position.clone();

  // Shelf Y positions: [-1.5, -0.3, 0.9, 1.6]
  // Place 2 carts on the second shelf (y=-0.3) and 2 on the third shelf (y=0.9)
  const placements = [
    { shelfY: 0.9, xOffset: -0.5 },   // ABOUT — top shelf, left
    { shelfY: -0.3, xOffset: -0.5 },  // PROJECTS — bottom shelf, left
    { shelfY: 0.9, xOffset: 0.5 },    // EXPERIENCE — top shelf, right
    { shelfY: -0.3, xOffset: 0.5 },   // CONTACT — bottom shelf, right
  ];

  for (let i = 0; i < 4; i++) {
    const cartGroup = createSNESCartridge(colors[i], labels[i]);
    const p = placements[i];

    const x = shelfPos.x + p.xOffset;
    const y = shelfPos.y + p.shelfY + 0.38; // offset up from shelf surface
    const z = shelfPos.z + 0.1;
    cartGroup.position.set(x, y, z);

    cartGroup.userData = {
      index: i,
      label: labels[i],
      color: colors[i],
      originalPosition: new THREE.Vector3(x, y, z),
      isInserted: false,
    };
    cartGroup.name = `cartridge_${labels[i].toLowerCase()}`;

    scene.add(cartGroup);
    cartridges.push(cartGroup);
  }

  return cartridges;
}
