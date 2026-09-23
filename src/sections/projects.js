const PROJECTS = [
  {
    name: 'Nefuen Trading',
    desc: 'Site for a European hazelnut nursery. 3D hero and product pages.',
    stack: 'Vite · React · Three.js',
    url: 'https://github.com/whoisgg/Nefuen-Trading-Web',
  },
  {
    name: 'Hijuelas CRM',
    desc: 'Sales contracts and opportunity tracking for Viveros Hijuelas.',
    stack: 'Next.js 16 · Supabase · Tailwind · shadcn',
    url: 'https://github.com/whoisgg/hijuelas-crm',
  },
  {
    name: 'Okane Finance',
    desc: 'Bank statement import and expense matching for Chilean banks.',
    stack: 'TypeScript · Next.js · Supabase',
    url: 'https://github.com/whoisgg/okane-finance',
  },
  {
    name: 'Omiya Clinic',
    desc: 'Well-aging clinic website.',
    stack: 'TypeScript · React',
    url: 'https://github.com/whoisgg/omiyaclinic',
  },
];

export function getProjectsHTML() {
  const items = PROJECTS.map((p, i) => `
    <li>
      <a href="${p.url}" target="_blank" rel="noopener">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="name">${p.name}</span>
        <span class="arrow">&gt;</span>
      </a>
      <p class="desc">${p.desc}</p>
      <p class="stack">${p.stack}</p>
    </li>
  `).join('');
  return `
    <div class="section-content">
      <h2>Projects</h2>
      <ul class="list">${items}</ul>
      <p class="hint">More on github.com/whoisgg</p>
    </div>
  `;
}
