precision highp float;
// Billboard vertex shader — the mesh position defines the world-space anchor,
// but the quad always faces the camera by applying the vertex offset in view space.
uniform vec2 uSize;   // (width, height) in world units

varying vec2 vUv;

void main() {
  vUv = uv;

  // Transform the mesh center (0,0,0) into view space — this carries world translation
  // but none of the mesh's local rotation, giving us a camera-facing quad for free.
  vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

  // Apply the vertex offset in view space, scaled to the desired world-unit size.
  mvCenter.xyz += vec3(position.x * uSize.x, position.y * uSize.y, 0.0);

  gl_Position = projectionMatrix * mvCenter;
}
