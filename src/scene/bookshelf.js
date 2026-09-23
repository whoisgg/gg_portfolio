import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS } from './materials.js';
import { cartridgeLabelTexture, snesBoxCoverTexture, snesBoxSpineTexture, caseSpineTexture, menuCoverTexture, seeded } from './textures.js';
import { DIMS } from './dims.js';
import { placeClone } from './models.js';

// The game library, like a collector's shelf: real boxes standing spine-out
// with the untidiness of a real shelf, and four boxes facing the room. Those
// four are the menus; each hides a cartridge that comes out when clicked.
const SH = DIMS.shelf;
export const SHELF_POSITION = new THREE.Vector3(1.02, 0, DIMS.room.wallZ + SH.d / 2 + 0.01);
const SHELF_W = SH.w;
const SHELF_D = SH.d;
const PLANK_T = SH.plank;
const SHELF_YS = [0.06, 0.06 + SH.pitch, 0.06 + SH.pitch * 2, 0.06 + SH.pitch * 3]; // plank centres, bottom to top
const CASE = { ...DIMS.gameCase, gap: 0.001 };

const TITLES = [
  ['Star Pilot', '#7fb2ff'], ['Kart Rush', '#ffb03a'], ['Dragon Vale', '#8ee08a'],
  ['Mecha Force', '#c8ced9'], ['Puzzle Pop', '#ff7ab8'], ['Sky Racer', '#6fe0ff'],
  ['Ninja Path', '#e05a8a'], ['Gold Rush', '#f2cf5b'], ['Blast Zone', '#ff7d4a'],
  ['Moon Quest', '#b8c6ff'], ['Turbo Hop', '#b6f26b'], ['Iron Wing', '#d8dde6'],
];

// Row layouts: numbers are runs of spines, strings are menu boxes / props.
const ROWS = [
  [4, 'ABOUT', 6, 'PROJECTS', 3],
  [6, 'LAB', 4, 'CONTACT', 5],
  [7, 'STACK', 4],
];

// Rennau's boxes load with the thin side along X, height along Y and the long
// side along Z (cover facing ±X). Rotations below are relative to that.
const BOX_STAND_ROT = [-Math.PI / 2, 0, 0];  // spine out: 30 wide, 190 tall, 133 deep
const BOX_FRONT_ROT = [0, -Math.PI / 2, 0];   // cover facing the room
const BOX_FLAT_ROT = [0, 0, -Math.PI / 2];    // lying flat, cover up

export function createBookshelf(scene, boxModels = [], spineVariants = []) {
  const rng = seeded(2026);
  const useBoxes = boxModels.length > 0;
  let boxIndex = 0;
  const nextBox = () => boxModels[(boxIndex++) % boxModels.length]; // real covers
  // standing spines: mostly repainted variants, a real one now and then
  const pool = spineVariants.length ? [...spineVariants, ...boxModels] : boxModels;
  let spineIndex = Math.floor(rng() * 7);
  const nextSpine = () => pool[(spineIndex += 5 + Math.floor(rng() * 3)) % pool.length];

  const shelfGroup = new THREE.Group();
  shelfGroup.position.copy(SHELF_POSITION);

  const wood = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.6 });
  const woodDark = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.65 });
  const back = new THREE.MeshStandardMaterial({ color: 0x24180f, roughness: 0.9 });

  const totalH = SHELF_YS[SHELF_YS.length - 1] - SHELF_YS[0] + 0.12;
  const midY = (SHELF_YS[0] + SHELF_YS[SHELF_YS.length - 1]) / 2;
  for (const x of [-SHELF_W / 2, SHELF_W / 2]) {
    const side = new THREE.Mesh(new RoundedBoxGeometry(0.02, totalH, SHELF_D, 2, 0.004), wood);
    side.position.set(x, midY, 0);
    side.castShadow = true;
    side.receiveShadow = true;
    shelfGroup.add(side);
  }
  for (const y of SHELF_YS) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(SHELF_W, PLANK_T, SHELF_D), woodDark);
    plank.position.y = y;
    plank.receiveShadow = true;
    plank.castShadow = true;
    shelfGroup.add(plank);
  }
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(SHELF_W, totalH, 0.008), back);
  backPanel.position.set(0, midY, -SHELF_D / 2 + 0.004);
  backPanel.receiveShadow = true;
  shelfGroup.add(backPanel);

  // Procedural fallback cases (used only when the box models are missing)
  const spineMats = TITLES.map(([title, accent], i) =>
    new THREE.MeshStandardMaterial({ map: caseSpineTexture(title, accent, i % 3 === 0 ? 'red' : 'grey'), roughness: 0.6 })
  );
  const caseBlack = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55 });
  const caseGeo = new THREE.BoxGeometry(CASE.w, CASE.h, CASE.d);
  let caseIndex = 0;

  const spineW = useBoxes ? DIMS.box.d : CASE.w;
  const boxW = DIMS.box.w, boxH = DIMS.box.h, boxD = DIMS.box.d;

  // One spine. Small random lean, gap and depth so the row does not look machined.
  function addSpine(x, plankY) {
    const lean = (rng() - 0.5) * 0.05;
    const zJitter = (rng() - 0.5) * 0.016;
    if (useBoxes) {
      const g = placeClone(nextSpine(), { rotation: BOX_STAND_ROT, x, yBase: plankY + PLANK_T / 2, z: SHELF_D / 2 - boxH / 2 - 0.012 + zJitter });
      g.rotation.z = lean;
      shelfGroup.add(g);
      return;
    }
    const mats = [caseBlack, caseBlack, caseBlack, caseBlack, spineMats[caseIndex % spineMats.length], caseBlack];
    caseIndex += 7;
    const m = new THREE.Mesh(caseGeo, mats);
    m.position.set(x, plankY + PLANK_T / 2 + CASE.h / 2, SHELF_D / 2 - CASE.d / 2 - 0.01 + zJitter);
    m.rotation.z = lean;
    m.castShadow = true;
    shelfGroup.add(m);
  }

  // A run of spines; the last one sometimes leans on the run like a tired book.
  const innerRight = SHELF_W / 2 - 0.015;
  function addRun(x, count, plankY) {
    for (let i = 0; i < count; i++) {
      if (x + spineW > innerRight) return x; // never past the side panel
      addSpine(x + spineW / 2, plankY);
      x += spineW + 0.002 + rng() * 0.006;
    }
    if (useBoxes && count > 2 && rng() > 0.55 && x + spineW + 0.04 < innerRight) {
      // leaning box: rotated ~12°, rests against the run
      const tilt = 0.2;
      const g = placeClone(nextSpine(), { rotation: BOX_STAND_ROT, x: x + spineW / 2 + 0.02, yBase: plankY + PLANK_T / 2, z: SHELF_D / 2 - boxH / 2 - 0.012 });
      g.rotation.z = tilt;
      g.position.x -= 0.03;
      shelfGroup.add(g);
      x += spineW + 0.035;
    }
    return x + 0.004 + rng() * 0.02;
  }

  // Menu slots: a gap in the row where the cartridge stands, facing the room
  const menuSlots = {};
  ROWS.forEach((row, r) => {
    const plankY = SHELF_YS[SHELF_YS.length - 2 - r]; // rows from the top down
    let x = -SHELF_W / 2 + 0.015 + rng() * 0.02;
    for (const item of row) {
      if (typeof item === 'number') {
        x = addRun(x, item + Math.floor(rng() * 2), plankY);
      } else if (item === 'STACK') {
        x += 0.01;
        const n = 2 + Math.floor(rng() * 2);
        for (let i = 0; i < n; i++) {
          if (useBoxes) {
            const g = placeClone(nextBox(), { rotation: [BOX_FLAT_ROT[0], (rng() - 0.5) * 0.25, BOX_FLAT_ROT[2]], x: x + boxW / 2 + (rng() - 0.5) * 0.02, yBase: plankY + PLANK_T / 2 + i * (boxD + 0.001), z: (rng() - 0.5) * 0.02 });
            shelfGroup.add(g);
          } else {
            const box = createSnesBox('Gold Rush', '#5a3a12', '#e0b34a', boxW, boxH, boxD, i + 9);
            box.rotation.x = -Math.PI / 2;
            box.rotation.z = (i - 1) * 0.05;
            box.position.set(x + boxW / 2, plankY + PLANK_T / 2 + boxD / 2 + i * (boxD + 0.001), 0.005);
            shelfGroup.add(box);
          }
        }
        x += boxW + 0.02;
      } else {
        x += 0.01;
        if (x + CART.W > innerRight) x = innerRight - CART.W;
        menuSlots[item] = { x: x + CART.W / 2, plankY };
        x += CART.W + 0.012;
      }
    }
  });

  scene.add(shelfGroup);
  shelfGroup.userData.menuSlots = menuSlots;
  return shelfGroup;
}

function createSnesBox(title, hueA, hueB, w, h, d, seed) {
  const g = new THREE.Group();
  const cover = snesBoxCoverTexture(title, hueA, hueB, seed);
  const spine = snesBoxSpineTexture(title, hueA);
  const card = new THREE.MeshStandardMaterial({ color: 0xe4e2e6, roughness: 0.85 });
  const mats = [
    new THREE.MeshStandardMaterial({ map: spine, roughness: 0.8 }), // +x
    new THREE.MeshStandardMaterial({ map: spine, roughness: 0.8 }), // -x
    card, card,                                                       // +y -y
    new THREE.MeshStandardMaterial({ map: cover, roughness: 0.75 }), // +z front
    new THREE.MeshStandardMaterial({ color: 0xd0cdd2, roughness: 0.85 }), // -z back
  ];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  mesh.castShadow = true;
  g.add(mesh);
  return g;
}

// US SNES cartridge at console scale (137 x 86 mm -> 0.79 x 0.5).
export const CART = DIMS.cart;

function cartridgeShellGeometry() {
  const { W, Hu, Hl, Wl, D } = CART;
  const top = (Hu + Hl) / 2;
  const shoulder = top - Hu;
  const bottom = -top;
  const r = 0.007;
  const s = new THREE.Shape();
  s.moveTo(-W / 2 + r, top);
  s.lineTo(W / 2 - r, top);
  s.quadraticCurveTo(W / 2, top, W / 2, top - r);
  s.lineTo(W / 2, shoulder);
  s.lineTo(Wl / 2, shoulder);
  s.lineTo(Wl / 2, bottom + 0.0025);
  s.lineTo(Wl / 2 - 0.0025, bottom);
  s.lineTo(-Wl / 2 + 0.0025, bottom);
  s.lineTo(-Wl / 2, bottom + 0.0025);
  s.lineTo(-Wl / 2, shoulder);
  s.lineTo(-W / 2, shoulder);
  s.lineTo(-W / 2, top - r);
  s.quadraticCurveTo(-W / 2, top, -W / 2 + r, top);
  const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: true, bevelThickness: 0.0017, bevelSize: 0.0017, bevelSegments: 2 });
  g.translate(0, 0, -D / 2);
  return g;
}

const shellGeometry = cartridgeShellGeometry();

function createSNESCartridge(accentColor, label) {
  const { W, Hu, Hl, Wl, D } = CART;
  const cart = new THREE.Group();
  const grey = new THREE.MeshStandardMaterial({ color: 0xc4c3c9, roughness: 0.5 });
  const greyEdge = new THREE.MeshStandardMaterial({ color: 0xa3a2aa, roughness: 0.55 });

  const shell = new THREE.Mesh(shellGeometry, grey);
  shell.castShadow = true;
  cart.add(shell);

  const top = (Hu + Hl) / 2;
  const shoulderY = top - Hu;

  // Finger groove along the top edge
  const groove = new THREE.Mesh(new THREE.BoxGeometry(W - 0.024, 0.0024, D + 0.0035), greyEdge);
  groove.position.y = top - 0.008;
  cart.add(groove);

  // Grip ridges on the lower shell
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.0024, 0.002, D * 0.8), greyEdge);
      ridge.position.set(side * (Wl / 2 + 0.0009), shoulderY - 0.006 - i * 0.0052, 0);
      cart.add(ridge);
    }
  }

  // Label recess + label
  const labelW = W * 0.82, labelH = Hu * 0.74;
  const recess = new THREE.Mesh(new THREE.BoxGeometry(labelW + 0.0035, labelH + 0.0035, 0.001), greyEdge);
  recess.position.set(0, shoulderY + Hu * 0.5 - 0.0009, D / 2 + 0.0014);
  cart.add(recess);
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(labelW, labelH),
    new THREE.MeshStandardMaterial({ map: cartridgeLabelTexture(label, accentColor), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
  );
  labelMesh.position.set(0, shoulderY + Hu * 0.5 - 0.0009, D / 2 + 0.0021);
  labelMesh.userData.isLabel = true;
  cart.add(labelMesh);

  const backSticker = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, Hu * 0.4), new THREE.MeshStandardMaterial({ color: 0x100e0d, roughness: 0.85 }));
  backSticker.position.set(0, shoulderY + Hu * 0.5, -D / 2 - 0.0019);
  backSticker.rotation.y = Math.PI;
  cart.add(backSticker);

  const pins = new THREE.Mesh(
    new THREE.BoxGeometry(Wl * 0.72, 0.005, D * 0.35),
    new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 0.85, roughness: 0.25 })
  );
  pins.position.y = -top - 0.002;
  cart.add(pins);

  return cart;
}

export function createCartridges(scene, shelfGroup) {
  const cartridges = [];
  const labels = COLORS.cartridgeLabels;
  const colors = COLORS.cartridgeColors;
  const half = (CART.Hu + CART.Hl) / 2;
  const slots = shelfGroup.userData.menuSlots;
  const tilt = -0.06;

  for (let i = 0; i < labels.length; i++) {
    const slot = slots[labels[i]];
    if (!slot) continue;
    const cart = createSNESCartridge(colors[i], labels[i]);
    const x = SHELF_POSITION.x + slot.x;
    const y = SHELF_POSITION.y + slot.plankY + PLANK_T / 2 + half + 0.002;
    const z = SHELF_POSITION.z + SHELF_D / 2 - CART.D / 2 - 0.004; // a touch proud of the spines
    cart.position.set(x, y, z);
    cart.rotation.x = tilt;
    cart.userData = {
      index: i,
      label: labels[i],
      color: colors[i],
      isMenu: true,
      originalPosition: new THREE.Vector3(x, y, z),
      originalRotationY: 0,
      originalRotationX: tilt,
      isInserted: false,
    };
    cart.userData.cartridge = cart; // the menu object is the cartridge itself
    cart.name = `cartridge_${labels[i].toLowerCase()}`;
    scene.add(cart);
    cartridges.push(cart);
  }
  return cartridges;
}
