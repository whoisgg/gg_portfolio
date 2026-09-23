import * as THREE from 'three';

// gaspr.dev palette: warm near-black, bone white, muted, terracotta accent.
export const BRAND = {
  bg: 0x0d0c0b,
  fg: 0xe9e4df,
  muted: 0x9a938c,
  accent: 0xd37452,
  rule: 0x241f1c,
};

export const COLORS = {
  // one accent per cartridge, all in the same warm family
  cartridgeColors: [0xd37452, 0xc9a87c, 0x8fa08a, 0x8a96ad],
  cartridgeLabels: ['ABOUT', 'PROJECTS', 'LAB', 'CONTACT'],
  bone: 0xd9d3c8,
  boneDark: 0xc4bdb0,
  charcoal: 0x2a2624,
  charcoalLight: 0x37322f,
  accent: BRAND.accent,
  wood: 0x4a3524,
  woodDark: 0x352417,
};

// CRT phosphor shader. uActive fades the picture in, uBoot is a white
// flash at power-on, uColor is the section tint. The HTML overlay draws the
// actual content on top; this only provides the glow that bloom picks up.
export function createTVScreenMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uBoot: { value: 0 },
      uColor: { value: new THREE.Color(0x33ff66) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uActive;
      uniform float uBoot;
      uniform vec3 uColor;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        vec2 centered = uv * 2.0 - 1.0;
        float r2 = dot(centered, centered);
        float vignette = 1.0 - 0.55 * r2;

        // Off: near-black glass with faint static and a soft reflection band
        float staticN = hash(uv * 180.0 + floor(uTime * 24.0)) * 0.018;
        float band = smoothstep(0.55, 0.75, uv.y) * smoothstep(0.95, 0.8, uv.y) * 0.05;
        vec3 off = vec3(0.01) + staticN + band;

        // On: tinted phosphor with scanlines and a slow rolling bar
        float scan = 0.85 + 0.15 * sin(uv.y * 520.0);
        float roll = 0.08 * smoothstep(0.0, 0.08, abs(fract(uTime * 0.12) - uv.y)) ;
        float grain = hash(uv * 300.0 + uTime) * 0.06;
        float flicker = 0.97 + 0.03 * sin(uTime * 40.0);
        vec3 on = uColor * (0.5 * vignette * scan * flicker) + grain * 0.6 - roll;

        vec3 col = mix(off, on, uActive);
        col += vec3(uBoot) * 1.6;

        float edge = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x)
                   * smoothstep(0.0, 0.04, uv.y) * smoothstep(1.0, 0.96, uv.y);
        col *= mix(1.0, edge, 0.9);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
