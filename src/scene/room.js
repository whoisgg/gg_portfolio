import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodFloorTexture, plasterTexture, carpetTexture } from './textures.js';
import { createBeanbag } from './props.js';
import { DIMS } from './dims.js';

export const FLOOR_Y = 0;
export const WALL_Z = DIMS.room.wallZ;

export function createRoom(scene) {
  const updaters = [];

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ map: woodFloorTexture(), roughness: 0.75 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls
  const plaster = plasterTexture();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2f2724, map: plaster, roughness: 0.95 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, DIMS.room.h), wallMat);
  backWall.position.set(0, DIMS.room.h / 2, WALL_Z);
  backWall.receiveShadow = true;
  scene.add(backWall);
  for (const [x, rotY] of [[-DIMS.room.w / 2, Math.PI / 2], [DIMS.room.w / 2, -Math.PI / 2]]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(6, DIMS.room.h), wallMat);
    side.position.set(x, DIMS.room.h / 2, 1);
    side.rotation.y = rotY;
    side.receiveShadow = true;
    scene.add(side);
  }
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f0d0c, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = DIMS.room.h;
  scene.add(ceiling);

  // Baseboard
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.08, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.7 })
  );
  baseboard.position.set(0, FLOOR_Y + 0.04, WALL_Z + 0.006);
  scene.add(baseboard);

  // Carpet
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(DIMS.carpet.w, DIMS.carpet.d),
    new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 1 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0.1, FLOOR_Y + 0.006, -0.85);
  carpet.receiveShadow = true;
  scene.add(carpet);
  const border = new THREE.Mesh(
    new THREE.PlaneGeometry(DIMS.carpet.w + 0.08, DIMS.carpet.d + 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2e1a14, roughness: 1 })
  );
  border.rotation.x = -Math.PI / 2;
  border.position.set(0.1, FLOOR_Y + 0.004, -0.85);
  border.receiveShadow = true;
  scene.add(border);

  // Pendant lamp fixture (the actual light is created in main.js)
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.5, roughness: 0.4 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.4, 6), fixtureMat);
  cord.position.set(0, DIMS.room.h - 0.2, -1);
  scene.add(cord);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.13, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x3a2f2a, side: THREE.DoubleSide, roughness: 0.6 })
  );
  shade.position.set(0, DIMS.room.h - 0.4, -1);
  scene.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe9c4, emissive: 0xffd9a0, emissiveIntensity: 0.9 })
  );
  bulb.position.set(0, DIMS.room.h - 0.46, -1);
  scene.add(bulb);

  // TV cabinet: low walnut credenza (1.30 x 0.45 x 0.50 m). Body, overhanging
  // top, three door fronts sitting slightly proud, brass pulls, recessed plinth.
  const C = DIMS.cabinet;
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x3d2a1c, roughness: 0.55 });
  const cabinetFrontMat = new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.5 });
  const cabinetTopMat = new THREE.MeshStandardMaterial({ color: 0x55391f, roughness: 0.42 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb8925a, metalness: 0.85, roughness: 0.3 });
  const cab = { x: -0.25, z: WALL_Z + C.d / 2 + 0.03, w: C.w, d: C.d };
  const plinthH = 0.06, topT = 0.02;
  const bodyH = C.h - plinthH - topT;
  const body = new THREE.Mesh(new RoundedBoxGeometry(cab.w, bodyH, cab.d, 3, 0.004), cabinetMat);
  body.position.set(cab.x, plinthH + bodyH / 2, cab.z);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);
  const cabinetTop = new THREE.Mesh(new RoundedBoxGeometry(cab.w + 0.03, topT, cab.d + 0.02, 3, 0.004), cabinetTopMat);
  cabinetTop.position.set(cab.x, C.h - topT / 2, cab.z);
  cabinetTop.castShadow = true;
  cabinetTop.receiveShadow = true;
  scene.add(cabinetTop);
  const doorW = (cab.w - 0.04) / 3;
  for (let i = 0; i < 3; i++) {
    const dx = cab.x - cab.w / 2 + 0.02 + doorW / 2 + i * doorW;
    const door = new THREE.Mesh(new RoundedBoxGeometry(doorW - 0.008, bodyH - 0.03, 0.012, 2, 0.002), cabinetFrontMat);
    door.position.set(dx, plinthH + bodyH / 2, cab.z + cab.d / 2 + 0.003);
    door.castShadow = true;
    scene.add(door);
    const pull = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.008, 0.01, 2, 0.003), brass);
    pull.position.set(dx, plinthH + bodyH - 0.07, cab.z + cab.d / 2 + 0.014);
    scene.add(pull);
  }
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cab.w - 0.08, plinthH, cab.d - 0.08), new THREE.MeshStandardMaterial({ color: 0x1e150e, roughness: 0.8 }));
  plinth.position.set(cab.x, plinthH / 2, cab.z);
  scene.add(plinth);

  // Beanbag on the left
  const beanbag = createBeanbag(DIMS.beanbag.r);
  beanbag.position.set(-1.05, FLOOR_Y + DIMS.beanbag.r * 0.4, -0.75);
  scene.add(beanbag);

  return { update: (t) => updaters.forEach((u) => u(t)) };
}
