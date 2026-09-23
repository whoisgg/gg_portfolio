// Three.js experiments. Public ones link to the repo; the rest are named
// only, they live in private repos.
const PUBLIC = [
  { name: 'Physics playground', url: 'https://github.com/whoisgg/threejs_physics' },
  { name: 'Baked scene', url: 'https://github.com/whoisgg/threejs_bakescene' },
  { name: 'Zoom parallax', url: 'https://github.com/whoisgg/zoom-parallax' },
  { name: 'Cinematic transition', url: 'https://github.com/whoisgg/cinematictransition' },
];
const MORE = [
  'Particle morph', 'GPGPU flow field', 'Terrain shader', 'Hologram', 'Halftone shading',
  'Fireworks', 'Galaxy', 'Raging sea', 'Earth', 'Haunted house', 'Coffee smoke', 'Sliced model',
];

export function getLabHTML() {
  const links = PUBLIC.map((p, i) => `
    <li>
      <a href="${p.url}" target="_blank" rel="noopener">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="name">${p.name}</span>
        <span class="arrow">&gt;</span>
      </a>
    </li>
  `).join('');
  const tags = MORE.map((m) => `<span class="tag">${m}</span>`).join('');
  return `
    <div class="section-content">
      <h2>Lab</h2>
      <p class="dim">Three.js and shader experiments. Videos on YouTube @gasprlab.</p>
      <ul class="list compact">${links}</ul>
      <p class="tags">${tags}</p>
      <p class="hint">
        <a href="https://www.youtube.com/@gasprlab" target="_blank" rel="noopener">Watch on YouTube &rarr;</a>
      </p>
    </div>
  `;
}
