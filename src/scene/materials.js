import * as THREE from 'three';

// Retro color palette
export const COLORS = {
  tvBody: 0x2a2a2a,
  tvBezel: 0x1a1a1a,
  screenOff: 0x0a1a0a,
  screenOn: 0x00ff44,
  console: 0x8080a0,
  consoleDark: 0x505068,
  consoleAccent: 0x6060b0,
  shelf: 0x5a3a1a,
  shelfDark: 0x3a2510,
  floor: 0x1a1820,
  wallBack: 0x12101a,
  wallSide: 0x0e0c14,
  ambient: 0x201830,
  cartridgeColors: [0xcc3333, 0x3366cc, 0xccaa33, 0x33aa66],
  cartridgeLabels: ['ABOUT', 'PROJECTS', 'EXPERIENCE', 'CONTACT'],
};

export function createTVScreenMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uColor: { value: new THREE.Color(0x00ff44) },
      uTitle: { value: 0 }, // 0 = off, 1-4 = section index
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
      uniform vec3 uColor;
      uniform float uTitle;
      varying vec2 vUv;

      float scanline(vec2 uv) {
        return sin(uv.y * 300.0 + uTime * 2.0) * 0.04;
      }

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;

        // CRT curvature
        vec2 centered = uv * 2.0 - 1.0;
        centered *= 1.0 + 0.02 * dot(centered, centered);
        uv = centered * 0.5 + 0.5;

        // Off state - dark with slight noise
        if (uActive < 0.5) {
          float n = noise(uv * 100.0 + uTime) * 0.03;
          gl_FragColor = vec4(vec3(0.01 + n), 1.0);
          return;
        }

        // Active state
        float scan = scanline(uv);
        float n = noise(uv * 200.0 + uTime * 10.0) * 0.02;
        float vignette = 1.0 - 0.4 * dot(centered, centered);

        vec3 col = uColor * 0.15 * vignette;
        col += scan + n;

        // Flicker on activation
        float flicker = 1.0 - 0.05 * sin(uTime * 30.0);
        col *= flicker;

        // Edge fade
        float edgeFade = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x)
                       * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
        col *= edgeFade;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
