import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS } from './materials.js';

// Small props that read well at low poly. Each returns a Group; some also
// return an update(t) for idle animation.

const std = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.5, ...opts });

export function createGameBoy() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.165, 0.022, 3, 0.008), std({ color: 0xc9c6bd }));
  body.castShadow = true;
  g.add(body);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.082, 0.062, 0.003, 2, 0.004), std({ color: 0x4a4d58 }));
  bezel.position.set(0, 0.04, 0.012);
  g.add(bezel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.002), std({ color: 0x8a9a52, emissive: 0x3a4a1a, emissiveIntensity: 0.2 }));
  screen.position.set(0, 0.04, 0.0145);
  g.add(screen);
  const dark = std({ color: 0x24242a });
  const dpadH = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.009, 0.005), dark);
  dpadH.position.set(-0.028, -0.02, 0.013);
  g.add(dpadH);
  const dpadV = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.03, 0.005), dark);
  dpadV.position.set(-0.028, -0.02, 0.013);
  g.add(dpadV);
  const btn = std({ color: 0x8b2a5a });
  for (const [bx, by] of [[0.02, -0.024], [0.036, -0.012]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.005, 12), btn);
    b.rotation.x = Math.PI / 2;
    b.position.set(bx, by, 0.013);
    g.add(b);
  }
  for (const sx of [-0.01, 0.008]) {
    const pill = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.005, 0.003, 1, 0.002), std({ color: 0x55555c }));
    pill.rotation.z = -0.45;
    pill.position.set(sx, -0.055, 0.012);
    g.add(pill);
  }
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.02, 0.002), dark);
    line.rotation.z = -0.5;
    line.position.set(0.02 + i * 0.006, -0.065, 0.012);
    g.add(line);
  }
  return g;
}

export function createRubiksCube(size = 0.09) {
  const g = new THREE.Group();
  const n = 3;
  const gap = 0.004;
  const s = (size - gap * (n - 1)) / n;
  const faceColors = [0xd83b3b, 0xf08a1e, 0xf2f2ea, 0xf5d020, 0x2fae4a, 0x2a5fd4]; // +x -x +y -y +z -z
  const black = std({ color: 0x0d0d0f, roughness: 0.4 });
  const mats = faceColors.map((c) => std({ color: c, roughness: 0.35 }));
  const geo = new RoundedBoxGeometry(s, s, s, 1, 0.004);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const m = [
          x === n - 1 ? mats[0] : black,
          x === 0 ? mats[1] : black,
          y === n - 1 ? mats[2] : black,
          y === 0 ? mats[3] : black,
          z === n - 1 ? mats[4] : black,
          z === 0 ? mats[5] : black,
        ];
        const cubelet = new THREE.Mesh(geo, m);
        cubelet.position.set(
          (x - 1) * (s + gap),
          (y - 1) * (s + gap),
          (z - 1) * (s + gap)
        );
        cubelet.castShadow = true;
        g.add(cubelet);
      }
    }
  }
  return g;
}

export function createLavaLamp() {
  const g = new THREE.Group();
  const metal = std({ color: 0xa08a58, metalness: 0.8, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.06, 20), metal);
  base.position.y = 0.03;
  base.castShadow = true;
  g.add(base);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.04, 0.17, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xff6a2a,
      transparent: true,
      opacity: 0.32,
      roughness: 0.15,
      clearcoat: 1,
      depthWrite: false,
    })
  );
  glass.position.y = 0.145;
  g.add(glass);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.024, 0.035, 20), metal);
  cap.position.y = 0.245;
  g.add(cap);
  const blobMat = std({ color: 0xff4a1a, emissive: 0xff3c10, emissiveIntensity: 1.8, roughness: 0.3 });
  const blobs = [];
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.012 + i * 0.005, 12, 12), blobMat);
    blob.position.y = 0.09 + i * 0.045;
    blob.userData.phase = i * 2.1;
    g.add(blob);
    blobs.push(blob);
  }
  const light = new THREE.PointLight(0xff6a2a, 0.9, 1.6, 2);
  light.position.y = 0.15;
  g.add(light);
  const update = (t) => {
    blobs.forEach((b, i) => {
      b.position.y = 0.09 + i * 0.04 + Math.sin(t * 0.35 + b.userData.phase) * 0.035;
      const s = 1 + Math.sin(t * 0.5 + b.userData.phase) * 0.18;
      b.scale.set(s, 1 / s, s);
    });
    light.intensity = 0.8 + Math.sin(t * 0.7) * 0.15;
  };
  return { group: g, update };
}

export function createVHSStack() {
  const g = new THREE.Group();
  const tape = std({ color: 0x111114, roughness: 0.55 });
  const paper = std({ color: 0xe8e0c8, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.19, 0.026, 0.105, 1, 0.003), tape);
    body.castShadow = true;
    t.add(body);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.012), paper);
    label.position.set(0, 0, 0.0535);
    t.add(label);
    t.position.y = 0.013 + i * 0.027;
    t.rotation.y = (i - 1) * 0.12;
    t.position.x = (i - 1) * 0.006;
    g.add(t);
  }
  return g;
}

export function createCrystal() {
  const g = new THREE.Group();
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.06, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0x4b8cff,
      emissive: 0x1b46c8,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
      roughness: 0.05,
      clearcoat: 1,
    })
  );
  crystal.position.y = 0.09;
  crystal.rotation.y = Math.PI / 4;
  crystal.scale.y = 1.4;
  g.add(crystal);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 6), std({ color: 0x2f2f3d, roughness: 0.6 }));
  base.position.y = 0.015;
  g.add(base);
  const light = new THREE.PointLight(0x4b8cff, 0.7, 1.4, 2);
  light.position.y = 0.1;
  g.add(light);
  const update = (t) => {
    crystal.rotation.y = Math.PI / 4 + t * 0.3;
    crystal.position.y = 0.09 + Math.sin(t * 1.3) * 0.006;
  };
  return { group: g, update };
}

export function createMillenniumPuzzle() {
  const g = new THREE.Group();
  const gold = std({ color: 0xddaa33, metalness: 0.85, roughness: 0.25 });
  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.1, 4), gold);
  pyramid.rotation.x = Math.PI;
  pyramid.rotation.y = Math.PI / 4;
  pyramid.position.y = 0.06;
  pyramid.castShadow = true;
  g.add(pyramid);
  const eye = new THREE.Mesh(
    new THREE.ConeGeometry(0.014, 0.028, 3),
    std({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 0.9 })
  );
  eye.position.set(0, 0.075, 0.032);
  eye.rotation.x = Math.PI;
  g.add(eye);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 16), gold);
  ring.position.y = 0.118;
  g.add(ring);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 12), std({ color: 0x2a2a30 }));
  stand.position.y = 0.006;
  g.add(stand);
  return g;
}

export function createCardStack() {
  const g = new THREE.Group();
  for (let c = 0; c < 8; c++) {
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.004, 0.09),
      std({ color: c % 2 ? 0x2a1a1a : 0x1a1a2a, roughness: 0.7 })
    );
    card.position.y = c * 0.0045;
    card.rotation.y = c * 0.03;
    g.add(card);
  }
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.082), std({ color: 0x8a6a2a, roughness: 0.5 }));
  top.rotation.x = -Math.PI / 2;
  top.rotation.z = 0.24;
  top.position.y = 0.038;
  g.add(top);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.04), std({ color: 0x2244aa }));
  art.rotation.x = -Math.PI / 2;
  art.rotation.z = 0.24;
  art.position.set(0.002, 0.0385, -0.01);
  g.add(art);
  return g;
}

export function createBusterSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.012), std({ color: 0xb4bcc8, metalness: 0.85, roughness: 0.2 }));
  blade.position.y = 0.2;
  g.add(blade);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.28, 0.013), std({ color: 0xe6ecf4, metalness: 0.9, roughness: 0.1 }));
  edge.position.set(0.021, 0.2, 0);
  g.add(edge);
  const guard = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.02, 0.025, 1, 0.005), std({ color: 0xd9a63a, metalness: 0.7, roughness: 0.3 }));
  guard.position.y = 0.05;
  g.add(guard);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 10), std({ color: 0x4a2a10, roughness: 0.7 }));
  handle.position.y = 0.01;
  g.add(handle);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.05), std({ color: 0x2a2a30 }));
  stand.position.y = -0.02;
  g.add(stand);
  g.rotation.z = 0.12;
  return g;
}

// SNES controller lying on the carpet (145 x 60 x 20 mm), cable to the console port.
export function createController(portWorld) {
  const g = new THREE.Group();
  const gray = std({ color: 0xc9c8cd, roughness: 0.5 });
  const dark = std({ color: 0x1d1a18 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.145, 0.02, 0.06, 4, 0.008), gray);
  body.castShadow = true;
  g.add(body);
  for (const gx of [-0.055, 0.055]) {
    const grip = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.02, 0.075, 4, 0.012), gray);
    grip.position.set(gx, 0, 0.008);
    grip.castShadow = true;
    g.add(grip);
  }
  const dpadH = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.005, 0.008), dark);
  dpadH.position.set(-0.047, 0.012, 0);
  g.add(dpadH);
  const dpadV = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.024), dark);
  dpadV.position.set(-0.047, 0.012, 0);
  g.add(dpadV);
  const purple = std({ color: 0x5c4d9e, roughness: 0.4 });
  const lavender = std({ color: 0x9d93cc, roughness: 0.4 });
  const buttons = [
    [0.047, -0.012, purple], [0.058, 0.0, purple],
    [0.036, 0.0, lavender], [0.047, 0.012, lavender],
  ];
  for (const [bx, bz, m] of buttons) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.005, 14), m);
    b.position.set(bx, 0.011, bz);
    g.add(b);
  }
  for (const sx of [-0.009, 0.009]) {
    const pill = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.003, 0.005, 1, 0.0015), dark);
    pill.rotation.y = -0.5;
    pill.position.set(sx, 0.011, 0.013);
    g.add(pill);
  }
  const buildCable = () => {
    g.updateWorldMatrix(true, false);
    const start = g.localToWorld(new THREE.Vector3(0, 0.004, -0.03));
    const mid1 = start.clone().add(new THREE.Vector3(0.06, 0.0, -0.15));
    const mid2 = portWorld.clone().add(new THREE.Vector3(-0.12, -0.42, 0.25));
    const mid3 = portWorld.clone().add(new THREE.Vector3(-0.02, -0.06, 0.08));
    const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, mid3, portWorld.clone()]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0025, 8, false), std({ color: 0x2a2a2e, roughness: 0.6 }));
    tube.castShadow = true;
    return tube;
  };
  return { group: g, buildCable };
}

export function createBeanbag(r = 0.4) {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), std({ color: 0x5e3a2c, roughness: 1 }));
  bag.scale.set(1, 0.55, 1);
  bag.castShadow = true;
  bag.receiveShadow = true;
  g.add(bag);
  const dent = new THREE.Mesh(new THREE.SphereGeometry(r * 0.64, 20, 14), std({ color: 0x4e2f24, roughness: 1 }));
  dent.scale.set(1, 0.25, 1);
  dent.position.y = r * 0.42;
  g.add(dent);
  return g;
}
