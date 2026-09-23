import * as THREE from 'three';

// Shared loading manager: every texture goes through here so the loading
// screen reflects real progress instead of a fake timer.
export const loadingManager = new THREE.LoadingManager();
export const textureLoader = new THREE.TextureLoader(loadingManager);

export function loadColorTexture(path) {
  const tex = textureLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
