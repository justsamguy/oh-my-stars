import * as THREE from 'three';
import { pois, BASE_STAR_COUNT, MOBILE_STAR_COUNT, MAX_INTERACTION_RADIUS, MIN_INTERACTION_RADIUS, MOBILE_BREAKPOINT } from './config.js';

// Star shaders (as string constants)
const vertexShader = `
    uniform float cameraY;
    uniform bool isMobile;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vRandomSeed;
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
        vUv = uv;
        vRandomSeed = hash(position.xy);
        vec3 pos = position;
        float parallaxStrength = 0.0075 * (180.0 + position.z) / 60.0;
        if (isMobile) {
            parallaxStrength *= 6.0;
        }
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        worldPos.y -= cameraY * parallaxStrength;
        vWorldPosition = worldPos;
        vec4 mvPosition = viewMatrix * vec4(vWorldPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
const fragmentShader = `
    uniform vec3 color;
    uniform float time;
    uniform vec3 mousePosition;
    uniform float twinkleFrequency;
    uniform float twinklePhase;
    uniform float touchFade;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vRandomSeed;
    const float MAX_INTERACTION_RADIUS = 75.0;
    const float MIN_INTERACTION_RADIUS = 15.0;
    const float BASE_GLOW_RADIUS = 0.2;
    const float MAX_GLOW_RADIUS = 0.45;
    const float BASE_GLOW_ALPHA = 0.7;
    const float MAX_GLOW_ALPHA = 1.0;
    const float TWINKLE_AMPLITUDE = 0.35;
    void main() {
        float mouseDist = length(vWorldPosition.xy - mousePosition.xy);
        float mouseProximity = smoothstep(MAX_INTERACTION_RADIUS, MIN_INTERACTION_RADIUS, mouseDist) * touchFade;
        float coreDist = length(vUv - vec2(0.5));
        float coreAlpha = smoothstep(0.15, 0.05, coreDist);
        vec3 coreColor = vec3(1.0);
        float twinkle = 0.0;
        if (mouseProximity > 0.0) {
            twinkle = 0.5 + 0.5 * sin(time * twinkleFrequency + twinklePhase);
        }
        float glowRadius = mix(BASE_GLOW_RADIUS, MAX_GLOW_RADIUS, mouseProximity * (0.7 + 0.3 * twinkle));
        float glowShape = smoothstep(glowRadius, 0.0, coreDist);
        float glowAlpha = mix(BASE_GLOW_ALPHA, MAX_GLOW_ALPHA, mouseProximity * (0.7 + 0.3 * twinkle));
        glowAlpha *= glowShape;
        vec3 finalColor = mix(coreColor, color, mouseProximity);
        float combinedAlpha = mix(coreAlpha * 0.5, coreAlpha, 1.0 - mouseProximity) + glowAlpha;
        combinedAlpha = clamp(combinedAlpha, 0.0, 1.0);
        gl_FragColor = vec4(finalColor, combinedAlpha);
    }
`;

// Create all stars
export function createAllStars(_, pois, viewportWidth, viewportHeight) {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const count = isMobile ? MOBILE_STAR_COUNT : BASE_STAR_COUNT;
    const group = new THREE.Group();
    const sortedPOIs = [...pois].sort((a, b) => b.position.y - a.position.y);
    const highestY = sortedPOIs[0].position.y + 80; // Extend higher into header
    const lowestY = sortedPOIs[sortedPOIs.length - 1].position.y - 80; // Extend lower into footer
    const edgeMargin = 120; // Larger transition zone

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * viewportWidth * 2;
        let y = lowestY + (Math.random() * (highestY - lowestY));
        
        // Gradient probability for star creation
        let skipProbability = 0;
        
        if (y > (highestY - edgeMargin)) {
            // Smooth transition at top
            const dist = (y - (highestY - edgeMargin)) / edgeMargin;
            skipProbability = Math.pow(dist, 1.5); // Softer curve
        } else if (y < (lowestY + edgeMargin)) {
            // Smooth transition at bottom
            const dist = ((lowestY + edgeMargin) - y) / edgeMargin;
            skipProbability = Math.pow(dist, 1.5); // Softer curve
        }

        // Skip based on calculated probability
        if (Math.random() < skipProbability) continue;

        // Add distance-based size variation for better depth
        const z = -120 - Math.random() * 60;
        
        const geometry = new THREE.CircleGeometry(4, 32);
        let colorIndex = 0;
        const normalizedY = Math.min(Math.max(y, lowestY), highestY);
        for (let j = 0; j < sortedPOIs.length - 1; j++) {
            if (normalizedY <= sortedPOIs[j].position.y && normalizedY > sortedPOIs[j + 1].position.y) {
                colorIndex = j;
                break;
            }
        }
        if (normalizedY <= sortedPOIs[sortedPOIs.length - 1].position.y) {
            colorIndex = sortedPOIs.length - 2;
        }
        const upperPOI = sortedPOIs[colorIndex];
        const lowerPOI = sortedPOIs[colorIndex + 1];
        const segmentHeight = upperPOI.position.y - lowerPOI.position.y;
        const blendFactor = (normalizedY - lowerPOI.position.y) / segmentHeight;
        const color1 = new THREE.Color(upperPOI.color);
        const color2 = new THREE.Color(lowerPOI.color);
        const finalColor = color2.clone().lerp(color1, blendFactor);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: finalColor },
                time: { value: 0 },
                cameraY: { value: 0 },
                mousePosition: { value: new THREE.Vector3(-10000, -10000, 0) },
                twinkleFrequency: { value: 2.5 + Math.random() * 1.5 },
                twinklePhase: { value: Math.random() * Math.PI * 2 },
                touchFade: { value: 1.0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const star = new THREE.Mesh(geometry, material);
        star.position.set(x, y, z);
        const size = (0.5 + Math.random() * (2.25 - Math.abs(z + 150) / 60)) * 0.5;
        star.userData.originalScale = size;
        star.scale.set(size / 3, size / 3, 1);
        star.rotation.z = Math.random() * Math.PI;
        group.add(star);
    }
    return group;
}

// Update stars in animation loop
export function updateStars(starsGroup, elapsedTime, cameraY, mouseWorldPosition, touchFade = 1.0) {
    starsGroup.children.forEach(star => {
        star.material.uniforms.time.value = elapsedTime;
        star.material.uniforms.cameraY.value = cameraY;
        star.material.uniforms.mousePosition.value.copy(mouseWorldPosition);
        star.material.uniforms.touchFade.value = touchFade;
        const originalScale = star.userData.originalScale;
        if (originalScale) {
            const starPos = star.position;
            const dx = starPos.x - mouseWorldPosition.x;
            const dy = starPos.y - mouseWorldPosition.y;
            const mouseDist = Math.sqrt(dx * dx + dy * dy);
            const factor = Math.max(0.0, Math.min(1.0, (mouseDist - MIN_INTERACTION_RADIUS) / (MAX_INTERACTION_RADIUS - MIN_INTERACTION_RADIUS)));
            const mouseProximityFactor = 1.0 - factor;
            const targetScale = (originalScale / 3) + (originalScale * 2 / 3) * mouseProximityFactor;
            const lerpFactor = 0.1;
            star.scale.x += (targetScale - star.scale.x) * lerpFactor;
            star.scale.y += (targetScale - star.scale.y) * lerpFactor;
        }
    });
}
