import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { loadingManager } from '../loader.js';

// Optional downloaded models. Drop a .glb in public/models/ with one of the
// names below and it replaces the procedural version; if the file is missing
// the procedural one stays. Every model is rescaled so its WIDTH matches the
// real dimension in dims.js and its base sits on y = 0, so scale stays honest
// no matter what units the author exported in.
export const MODEL_FILES = {
  snes: '/models/snes.glb',
  crt: '/models/crt.glb',
  cartridge: '/models/cartridge.glb',
  controller: '/models/controller.glb',
  boxes: ['/models/boxes/mario-world.glb', '/models/boxes/zelda.glb', '/models/boxes/tmnt.glb'],
};

const gltfLoader = new GLTFLoader(loadingManager);
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
gltfLoader.setDRACOLoader(draco);

async function exists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && !(r.headers.get('content-type') || '').includes('text/html');
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @param {{ width?: number, height?: number, depth?: number, rotationY?: number, hide?: string[] }} fit
 *   exactly one of width/height/depth: the real size to match, in meters.
 *   rotationY: applied before measuring, for models exported facing sideways.
 *   hide: node or material name fragments to remove before measuring (cables, stands, props).
 *   longest: alternative to width/height/depth: fit the largest dimension, whichever axis it is.
 * @returns {Promise<THREE.Group|null>} centred on x/z, base on y=0, or null if missing
 */
export async function tryLoadModel(url, fit) {
  if (!(await exists(url))) return null;
  const gltf = await gltfLoader.loadAsync(url);
  const root = gltf.scene;
  if (fit.hide?.length) {
    const doomed = [];
    root.traverse((o) => {
      const mat = o.material?.name || '';
      if (fit.hide.some((h) => o.name.includes(h) || mat.includes(h))) doomed.push(o);
    });
    doomed.forEach((o) => o.parent?.remove(o));
  }
  if (fit.rotationY) root.rotation.y = fit.rotationY;
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  let axis = fit.width ? 'x' : fit.height ? 'y' : 'z';
  if (fit.longest) axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
  const target = fit.width ?? fit.height ?? fit.depth ?? fit.longest;
  const s = target / size[axis];

  const wrapper = new THREE.Group();
  wrapper.add(root);
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const center = box2.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -box2.min.y, -center.z);

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material && o.material.map) o.material.map.anisotropy = 8;
    }
  });
  wrapper.userData.size = box2.getSize(new THREE.Vector3());
  wrapper.userData.source = url;
  return wrapper;
}

/**
 * Clone a fitted model, rotate it, and seat it so its bounding box is centred
 * on (x, z) with its bottom on yBase. Used for the shelf boxes, which stand
 * in orientations different from how they were measured.
 */
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
export function placeClone(model, { rotation = [0, 0, 0], x = 0, yBase = 0, z = 0 } = {}) {
  const g = new THREE.Group();
  const c = model.clone(true);
  c.rotation.set(rotation[0], rotation[1], rotation[2]);
  g.add(c);
  c.updateMatrixWorld(true);
  _box.setFromObject(c);
  _box.getCenter(_center);
  _box.getSize(_size);
  c.position.set(-_center.x, -_box.min.y, -_center.z);
  g.position.set(x, yBase, z);
  g.userData.size = _size.clone();
  return g;
}

export async function loadBoxModels() {
  const loaded = await Promise.all(MODEL_FILES.boxes.map((url) => tryLoadModel(url, { longest: 0.19 })));
  return loaded.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Spine variants. Sketchfab only has three real SNES boxes, and a shelf of
// the same three repeated looks fake. The standing boxes only show their
// spine, so we copy the box's texture atlas and repaint just the spine
// faces with a new title and colour. Geometry, print quality and the real
// covers stay untouched.
// ---------------------------------------------------------------------------
function spineUvRects(mesh) {
  // Per-triangle UV boxes for the faces that point ±X in geometry space (the
  // long thin sides), merged into islands. Only spine-shaped islands
  // (long and narrow) are returned, so bevels and stray triangles are ignored.
  const geo = mesh.geometry;
  const pos = geo.attributes.position, uv = geo.attributes.uv, idx = geo.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const boxes = [];
  for (let t = 0; t < triCount; t++) {
    const ids = [0, 1, 2].map((k) => (idx ? idx.getX(t * 3 + k) : t * 3 + k));
    a.fromBufferAttribute(pos, ids[0]); b.fromBufferAttribute(pos, ids[1]); c.fromBufferAttribute(pos, ids[2]);
    n.crossVectors(b.sub(a), c.sub(a)).normalize();
    if (Math.abs(n.x) < 0.9) continue;
    const r = { minU: 1, maxU: 0, minV: 1, maxV: 0 };
    for (const i of ids) {
      const u = uv.getX(i), v = uv.getY(i);
      r.minU = Math.min(r.minU, u); r.maxU = Math.max(r.maxU, u);
      r.minV = Math.min(r.minV, v); r.maxV = Math.max(r.maxV, v);
    }
    boxes.push(r);
  }
  // merge boxes that touch
  const eps = 0.002;
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < boxes.length && !merged; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const p = boxes[i], q = boxes[j];
        if (p.minU <= q.maxU + eps && q.minU <= p.maxU + eps && p.minV <= q.maxV + eps && q.minV <= p.maxV + eps) {
          p.minU = Math.min(p.minU, q.minU); p.maxU = Math.max(p.maxU, q.maxU);
          p.minV = Math.min(p.minV, q.minV); p.maxV = Math.max(p.maxV, q.maxV);
          boxes.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
  }
  return boxes.filter((r) => {
    const w = r.maxU - r.minU, h = r.maxV - r.minV;
    const aspect = Math.max(w, h) / Math.max(1e-6, Math.min(w, h));
    return aspect > 3.5 && aspect < 12 && Math.max(w, h) > 0.08;
  });
}

function paintSpine(ctx, x, y, w, h, title, accent, seed) {
  ctx.save();
  ctx.translate(x, y);
  const along = w >= h; // text runs along the long side
  const L = along ? w : h, T = along ? h : w;
  if (!along) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
  // the atlas maps the spine upside down relative to the model, so paint rotated 180°
  ctx.translate(L / 2, T / 2); ctx.rotate(Math.PI); ctx.translate(-L / 2, -T / 2);
  // black spine with a grey system band at one end, like the PAL boxes
  ctx.fillStyle = '#111114';
  ctx.fillRect(0, 0, L, T);
  ctx.fillStyle = '#d9d9de';
  ctx.fillRect(0, 0, L * 0.16, T);
  ctx.fillStyle = '#3a3a44';
  ctx.font = `bold ${Math.round(T * 0.28)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SUPER GG', L * 0.08, T * 0.5);
  ctx.fillStyle = accent;
  ctx.fillRect(L * 0.16, 0, L * 0.012, T);
  const rnd = seed % 3;
  ctx.fillStyle = accent;
  ctx.font = `900 ${Math.round(T * 0.5)}px ${rnd === 0 ? 'Impact, system-ui' : rnd === 1 ? '"Arial Black", system-ui' : 'Georgia, serif'}`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,255,255,0.18)';
  ctx.shadowBlur = T * 0.1;
  ctx.fillText(title.toUpperCase(), L * 0.56, T * 0.52, L * 0.5);
  ctx.restore();
}

export const SPINE_TITLES = [
  ['Star Pilot', '#7fb2ff'], ['Kart Rush', '#ffb03a'], ['Dragon Vale', '#8ee08a'],
  ['Mecha Force', '#c8ced9'], ['Puzzle Pop', '#ff7ab8'], ['Sky Racer', '#6fe0ff'],
  ['Ninja Path', '#e05a8a'], ['Gold Rush', '#f2cf5b'], ['Blast Zone', '#ff7d4a'],
  ['Moon Quest', '#b8c6ff'], ['Turbo Hop', '#b6f26b'], ['Iron Wing', '#d8dde6'],
  ['Cave Story II', '#c9a2ff'], ['Volt Kid', '#ffe45a'], ['Deep Sea', '#57c9d8'],
  ['Castle Run', '#ff9a5a'], ['Robo Land', '#9ad6ff'], ['Fire Fist', '#ff5f5f'],
  ['Wild West', '#e3b56b'], ['Pixel Cup', '#7fe3b0'], ['Jet Set', '#ff8ad4'],
  ['Time Loop', '#a6ffe0'], ['Sword Saga', '#ffd28a'], ['Bug Hunt', '#c2ff7a'],
];

export function makeSpineVariants(model, titles = SPINE_TITLES) {
  let mesh = null;
  model.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
  if (!mesh || !mesh.material?.map?.image) return [];
  const rects = spineUvRects(mesh);
  if (!rects.length) return [];
  const img = mesh.material.map.image;
  const W = img.width, H = img.height;
  const flipY = mesh.material.map.flipY; // glTF textures: false, v=0 is the top row

  return titles.map(([title, accent], i) => {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    for (const r of rects) {
      const x = r.minU * W, w = (r.maxU - r.minU) * W;
      const y = (flipY ? 1 - r.maxV : r.minV) * H, h = (r.maxV - r.minV) * H;
      paintSpine(ctx, x, y, w, h, title, accent, i);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = flipY;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const variant = model.clone(true);
    variant.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.map = tex;
        o.material.needsUpdate = true;
      }
    });
    variant.userData = { ...model.userData, spine: title };
    return variant;
  });
}
