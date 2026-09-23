import * as THREE from 'three';

// Keeps the HTML overlay glued to the CRT screen: projects the four corners
// of the screen rectangle and sizes the element to their bounding box.
export function createScreenTracker(screenMesh, size, element) {
  // size is read on every update so a swapped-in TV model can change it
  const tmp = new THREE.Vector3();

  function update(camera) {
    const corners = [
      [-size.w / 2, -size.h / 2], [size.w / 2, -size.h / 2], [size.w / 2, size.h / 2], [-size.w / 2, size.h / 2],
    ];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [cx, cy] of corners) {
      tmp.set(cx, cy, 0);
      screenMesh.localToWorld(tmp);
      tmp.project(camera);
      const x = (tmp.x + 1) / 2 * window.innerWidth;
      const y = (1 - tmp.y) / 2 * window.innerHeight;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    // Inset slightly so the picture sits inside the glass curvature
    const insetX = (maxX - minX) * 0.035;
    const insetY = (maxY - minY) * 0.04;
    element.style.left = `${minX + insetX}px`;
    element.style.top = `${minY + insetY}px`;
    element.style.width = `${maxX - minX - insetX * 2}px`;
    element.style.height = `${maxY - minY - insetY * 2}px`;
  }

  return { update };
}
