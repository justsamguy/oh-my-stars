# Slither.io-Style Glowing, Pulsing Orb Effect for Three.js

## Summary
This reference describes a modular, reusable effect for Three.js that replicates the glowing, pulsing orb visuals from Slither.io. The effect combines a radial gradient halo (using a sprite), an emissive mesh core, and a smoothly animated pulse. All parameters (color, size, pulse speed, etc.) are exposed for easy adjustment. The implementation is ES6+ and designed for direct use by LLMs or developers.

---

## Feature Description
- **Radial Gradient Halo:** A sprite with a radial gradient texture (center color to transparent edge) is attached to the mesh, creating a soft, additive glow that always faces the camera.
- **Emissive Core:** The mesh uses an emissive material to appear self-illuminated, ensuring the core remains bright regardless of scene lighting.
- **Pulse Animation:** Both the halo's opacity and the mesh's emissive intensity are smoothly animated (sine wave) to create a continuous, eye-catching pulse.
- **Modularity:** The effect is encapsulated in a class. Initialization and per-frame updates are handled via class methods. All key parameters are exposed.

---

## Implementation (ES6+)

```js
import * as THREE from 'three';

/**
 * SlitherGlowEffect: Adds a glowing, pulsing halo to a Three.js mesh.
 * - Attach to any THREE.Mesh instance.
 * - Call update() each frame to animate the pulse.
 */
class SlitherGlowEffect {
  /**
   * @param {THREE.Mesh} mesh - The mesh to enhance.
   * @param {Object} options - Configuration options.
   *   @param {THREE.Color|number|string} options.color - Glow color.
   *   @param {number} options.glowSize - Halo sprite scale (world units).
   *   @param {number} options.pulseSpeed - Pulse frequency (radians/sec).
   *   @param {number} options.opacityMin - Minimum halo opacity (0-1).
   *   @param {number} options.opacityMax - Maximum halo opacity (0-1).
   *   @param {number} options.emissiveMin - Minimum emissive intensity.
   *   @param {number} options.emissiveMax - Maximum emissive intensity.
   */
  constructor(mesh, {
    color = 0xffffff,
    glowSize = 1.0,
    pulseSpeed = 2.0,
    opacityMin = 0.7,
    opacityMax = 1.0,
    emissiveMin = 0.8,
    emissiveMax = 1.0
  } = {}) {
    this.mesh = mesh;
    this.color = new THREE.Color(color);
    this.glowSize = glowSize;
    this.pulseSpeed = pulseSpeed;
    this.opacityMin = opacityMin;
    this.opacityMax = opacityMax;
    this.emissiveMin = emissiveMin;
    this.emissiveMax = emissiveMax;
    this.startTime = performance.now();

    // Create and attach the glow sprite
    this.glowSprite = this._createGlowSprite();
    mesh.add(this.glowSprite);

    // Ensure mesh uses an emissive material
    this._setupEmissiveMaterial();
  }

  /**
   * Creates a radial gradient texture for the glow sprite.
   * @returns {THREE.Texture}
   */
  _createGlowTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    const [r, g, b] = this.color.toArray().map(c => Math.floor(c * 255));
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Creates the glow sprite and configures its material.
   * @returns {THREE.Sprite}
   */
  _createGlowSprite() {
    const texture = this._createGlowTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: this.color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(this.glowSize, this.glowSize, 1);
    return sprite;
  }

  /**
   * Ensures the mesh uses an emissive-capable material.
   * Converts to MeshStandardMaterial if needed.
   */
  _setupEmissiveMaterial() {
    const mat = this.mesh.material;
    if (!mat.emissive) {
      this.mesh.material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: this.color,
        emissiveIntensity: this.emissiveMax,
        transparent: true
      });
    } else {
      mat.emissive.set(this.color);
      mat.emissiveIntensity = this.emissiveMax;
    }
  }

  /**
   * Updates the glow and emissive intensity. Call once per frame.
   */
  update() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    // Sine-based pulse (oscillates between 0 and 1)
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * this.pulseSpeed);
    // Interpolate opacity and emissive intensity
    const opacity = this.opacityMin + (this.opacityMax - this.opacityMin) * pulse;
    const emissive = this.emissiveMin + (this.emissiveMax - this.emissiveMin) * pulse;
    if (this.glowSprite && this.glowSprite.material) {
      this.glowSprite.material.opacity = opacity;
    }
    if (this.mesh.material && this.mesh.material.emissive) {
      this.mesh.material.emissiveIntensity = emissive;
    }
  }
}
```

---

**Note:** To animate the effect, call the `update()` method of the `SlitherGlowEffect` instance once per frame (e.g., in your render loop). Integration specifics depend on your project structure.