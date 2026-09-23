import * as THREE from 'three';

// Procedural canvas textures: no image downloads, deterministic, tiny.

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function finish(canvas, repeatX, repeatY, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Wood planks with grain, staggered joints.
export function woodFloorTexture() {
  const size = 1024;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const r = seeded(7);
  const plankH = 128;
  const plankW = 512;

  ctx.fillStyle = '#2a1c12';
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < size / plankH; row++) {
    const offset = (row % 2) * 256 + Math.floor(r() * 120);
    for (let x = -plankW; x < size + plankW; x += plankW) {
      const px = x + offset;
      const py = row * plankH;
      const tone = 0.8 + r() * 0.35;
      const rr = Math.round(78 * tone);
      const gg = Math.round(52 * tone);
      const bb = Math.round(34 * tone);
      ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
      ctx.fillRect(px, py + 2, plankW - 4, plankH - 4);

      // grain lines
      ctx.globalAlpha = 0.16;
      for (let g = 0; g < 22; g++) {
        ctx.strokeStyle = r() > 0.5 ? '#1e120a' : '#9a7350';
        ctx.lineWidth = 1 + r() * 2.5;
        ctx.beginPath();
        const gy = py + 4 + r() * (plankH - 8);
        ctx.moveTo(px, gy);
        ctx.bezierCurveTo(
          px + plankW * 0.3, gy + (r() - 0.5) * 14,
          px + plankW * 0.6, gy + (r() - 0.5) * 14,
          px + plankW, gy + (r() - 0.5) * 8
        );
        ctx.stroke();
      }
      // knots
      if (r() > 0.6) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#1a0f08';
        ctx.beginPath();
        ctx.ellipse(px + r() * plankW, py + plankH / 2 + (r() - 0.5) * 40, 10 + r() * 12, 5 + r() * 6, r(), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  return finish(c, 4, 4);
}

// Fine plaster noise for the walls (used as a map, tinted by material.color).
export function plasterTexture() {
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const r = seeded(21);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 215 + Math.floor(r() * 40);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, 8, 2.5);
}

// Carpet: coarse fiber noise with a faint woven pattern.
export function carpetTexture() {
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const r = seeded(99);
  ctx.fillStyle = '#4a2820';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 26000; i++) {
    const x = r() * size, y = r() * size;
    const v = 60 + Math.floor(r() * 80);
    ctx.fillStyle = `rgb(${v + 22},${Math.floor(v * 0.55)},${Math.floor(v * 0.42)})`;
    ctx.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#8a5a48';
  for (let y = 0; y < size; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finish(c, 4, 3);
}

// Cartridge label in the gaspr.dev style: warm black card, serif title,
// the "g" mark in terracotta and one accent stripe per section.
export function cartridgeLabelTexture(label, accentHex) {
  const w = 512, h = 256;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const accent = '#' + new THREE.Color(accentHex).getHexString();

  ctx.fillStyle = '#100e0d';
  ctx.fillRect(0, 0, w, h);

  // subtle paper grain
  const r = seeded(5);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.globalAlpha = 1;

  // accent stripe down the left edge
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 18, h);

  // hairline rules
  ctx.fillStyle = '#2c2522';
  ctx.fillRect(40, 58, w - 70, 2);
  ctx.fillRect(40, h - 58, w - 70, 2);

  // "g" mark and site name on the top row
  ctx.fillStyle = accent;
  ctx.font = 'italic 40px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('g', 44, 30);
  ctx.fillStyle = '#9a938c';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('gaspr.dev', 78, 32);
  ctx.textAlign = 'right';
  ctx.fillText('SUPER GG', w - 32, 32);

  // title
  ctx.fillStyle = '#e9e4df';
  ctx.font = '400 74px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.charAt(0) + label.slice(1).toLowerCase(), 44, h / 2 + 4);

  // bottom row
  ctx.fillStyle = '#9a938c';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('CARTRIDGE ' + label, 44, h - 30);
  ctx.textAlign = 'right';
  ctx.fillText('16-BIT  ·  CHILE', w - 32, h - 30);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Generic SNES-style box front (landscape): white/grey header strip with the
// system name, big art panel with a title, tiny rating box. No real IP.
export function snesBoxCoverTexture(title, hueA, hueB, seed = 1) {
  const w = 512, h = 352;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const r = seeded(seed);

  // art panel
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, hueA);
  grad.addColorStop(1, hueB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // abstract "art": overlapping circles and diagonal beams
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.arc(r() * w, 90 + r() * (h - 120), 40 + r() * 110, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const x = r() * w;
    ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x - 120, h); ctx.lineTo(x - 180, h);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // header strip (the grey SNES band)
  ctx.fillStyle = '#d9d9de';
  ctx.fillRect(0, 0, w, 58);
  ctx.fillStyle = '#8f8f97';
  ctx.fillRect(0, 58, w, 4);
  ctx.fillStyle = '#4b4b55';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('SUPER GG', 18, 22);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('ENTERTAINMENT SYSTEM', 18, 42);
  // four colored dots, SNES style
  const dots = ['#d23b3b', '#2f6fd6', '#d9a52a', '#2fae6a'];
  dots.forEach((d, i) => { ctx.fillStyle = d; ctx.beginPath(); ctx.arc(w - 120 + i * 26, 30, 9, 0, Math.PI * 2); ctx.fill(); });

  // title
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.font = '900 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.toUpperCase(), w / 2, h / 2 + 30);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // rating box + bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, h - 46, w, 46);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GAME PAK  ·  1 PLAYER', 18, h - 23);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(w - 70, h - 40, 52, 34);
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('E', w - 44, h - 23);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Box spine (thin side) for boxes stood on end
export function snesBoxSpineTexture(title, hue) {
  const w = 64, h = 352;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = hue;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d9d9de';
  ctx.fillRect(0, 0, w, 58);
  ctx.save();
  ctx.translate(w / 2, h / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), 0, 0);
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Console deck print: system name on the left of the front deck
export function consoleDeckTexture() {
  const w = 512, h = 96;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#3a3a44';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('SUPER GG', 10, 30);
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('ENTERTAINMENT SYSTEM', 12, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Small text plates (POWER / RESET / EJECT)
export function plateTexture(text, fg = '#3a3a44') {
  const w = 128, h = 40;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Game case spine (the thin edge you see when cases stand on a shelf):
// black plastic, a small system band at the top, the title running down.
export function caseSpineTexture(title, accent, band = 'grey') {
  const w = 96, h = 400;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#121214';
  ctx.fillRect(0, 0, w, h);
  // top band
  ctx.fillStyle = band === 'red' ? '#b8262a' : '#cfcfd4';
  ctx.fillRect(6, 8, w - 12, 44);
  ctx.fillStyle = band === 'red' ? '#ffffff' : '#3a3a44';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SUPER GG', w / 2, 24);
  ctx.font = '8px system-ui, sans-serif';
  ctx.fillText('ENTERTAINMENT SYSTEM', w / 2, 40);
  // thin rule
  ctx.fillStyle = accent;
  ctx.fillRect(6, 60, w - 12, 3);
  // vertical title
  ctx.save();
  ctx.translate(w / 2, 70 + (h - 100) / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = accent;
  ctx.font = '900 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,255,255,0.15)';
  ctx.shadowBlur = 6;
  ctx.fillText(title.toUpperCase(), 0, 0);
  ctx.restore();
  // bottom mark
  ctx.fillStyle = '#5a5a64';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GG', w / 2, h - 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Menu box cover (190 x 133): SNES box layout in the gaspr.dev palette.
export function menuCoverTexture(label, accentHex) {
  const w = 512, h = 358;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const accent = '#' + new THREE.Color(accentHex).getHexString();

  ctx.fillStyle = '#100e0d';
  ctx.fillRect(0, 0, w, h);
  const r = seeded(11);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.globalAlpha = 1;

  // grey system band, like the real boxes
  ctx.fillStyle = '#d9d9de';
  ctx.fillRect(0, 0, w, 56);
  ctx.fillStyle = '#8f8f97';
  ctx.fillRect(0, 56, w, 3);
  ctx.fillStyle = '#3a3a44';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('SUPER GG', 18, 22);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('ENTERTAINMENT SYSTEM', 18, 42);
  ctx.fillStyle = accent;
  ctx.font = 'italic 34px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'right';
  ctx.fillText('g', w - 22, 30);

  // accent panel
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - 22, w, 22);
  ctx.fillRect(0, 59, 14, h - 81);

  // title
  ctx.fillStyle = '#e9e4df';
  ctx.font = '400 92px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.charAt(0) + label.slice(1).toLowerCase(), 40, h / 2 + 8);

  ctx.fillStyle = '#9a938c';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('gaspr.dev  ·  ' + label + ' cartridge inside', 40, h - 50);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
