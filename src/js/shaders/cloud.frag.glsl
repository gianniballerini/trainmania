precision highp float;

uniform sampler2D uCloudTex;
uniform sampler2D uNoiseTex;
uniform float     uTime;
uniform float     uNoiseScale;
uniform float     uDispStrength;   // how far UVs get pushed  (~0.01–0.04)
uniform float     uDispSpeed;      // how fast the warp shifts (~0.02–0.06)

varying vec2 vUv;

void main() {
  // Sample noise at two different offsets for X and Y displacement.
  // Using different offsets prevents the warp being perfectly diagonal.
  vec2 noiseUvX = vUv * uNoiseScale + vec2(uTime * uDispSpeed, 0.0);
  vec2 noiseUvY = vUv * uNoiseScale + vec2(0.0, uTime * uDispSpeed * 0.7);

  float dispX = texture2D(uNoiseTex, fract(noiseUvX)).r * 2.0 - 1.0; // → [-1, 1]
  float dispY = texture2D(uNoiseTex, fract(noiseUvY)).r * 2.0 - 1.0;

  // Displace the UVs and sample the cloud texture once.
  // Alpha comes directly from the cloud texture — no erosion.
  vec2 warpedUv = vUv + vec2(dispX, dispY) * uDispStrength;
  vec4 cloud    = texture2D(uCloudTex, warpedUv);

  gl_FragColor  = vec4(cloud.rgb, cloud.a);
}
