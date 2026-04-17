uniform float time;
uniform vec3 color;

varying vec2 vUv;

void main() {
  float border = 0.07;
  float d = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float ring  = 1.0 - smoothstep(0.0, border, d);
  float pulse = 0.55 + 0.45 * sin(time * 4.0);
  gl_FragColor = vec4(color, ring * pulse * 0.9);
}
