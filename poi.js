import * as THREE from 'three';
import { pois, POI_HITBOX_SCALE } from './config.js';

// POI geometry
const poiGeometry = new THREE.CircleGeometry(3, 32);

// POI glow shader
const glowVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const glowFragmentShader = `
    uniform vec3 color;
    uniform float time;
    varying vec2 vUv;
    void main() {
        float dist = length(vUv - vec2(0.5));
        float strength = smoothstep(1.0, 0.0, dist * 2.0);
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        gl_FragColor = vec4(color, strength * pulse);
    }
`;

// Create a single POI group
export function createPOI(poiData) {
    const group = new THREE.Group();
    const scale = 0.3;

    // Main POI circle
    const material = new THREE.MeshBasicMaterial({ 
        color: poiData.color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(poiGeometry, material);
    mesh.scale.setScalar(scale);
    group.add(mesh);

    // Hitbox (slightly larger than visible circle)
    const hitboxGeometry = new THREE.CircleGeometry(3 * POI_HITBOX_SCALE, 32);
    const hitboxMaterial = new THREE.MeshBasicMaterial({ 
        color: poiData.color,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthTest: false
    });
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.scale.setScalar(scale);
    group.add(hitbox);

    // Dashed ring
    const ringGeometry = new THREE.BufferGeometry();
    const segments = 32;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * 3, Math.sin(theta) * 3, 0));
    }
    ringGeometry.setFromPoints(points);
    const ringMaterial = new THREE.LineDashedMaterial({
        color: poiData.color,
        dashSize: 1,
        gapSize: 0.5,
        transparent: true,
        opacity: 0.5
    });
    const ring = new THREE.Line(ringGeometry, ringMaterial);
    ring.computeLineDistances();
    ring.userData.baseWidth = 0.5;
    ring.userData.hoverWidth = 1.0;

    // Glow effect
    const glowGeometry = new THREE.CircleGeometry(40, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(poiData.color) },
            time: { value: 0 }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.setScalar(scale);
    group.add(ring);
    group.add(glow);

    group.position.copy(poiData.position);
    group.userData = poiData;
    return group;
}

// Create all POIs and add to scene
export function createAllPOIs(pois, scene) {
    const poiObjects = pois.map(poi => {
        const poiGroup = createPOI(poi);
        scene.add(poiGroup);
        return poiGroup;
    });
    return poiObjects;
}

// Create connecting lines between POIs
export function createConnectingLines(pois) {
    const lineGroup = new THREE.Group();
    for (let i = 0; i < pois.length - 1; i++) {
        const start = pois[i].position;
        const end = pois[i + 1].position;
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        const line = new THREE.Line(geometry, material);
        lineGroup.add(line);
    }
    return lineGroup;
}

// Update POIs (hover, glow, ring animation)
export function updatePOIs(poiObjects, elapsedTime, raycaster) {
    poiObjects.forEach(poiGroup => {
        // Animate glow
        const glow = poiGroup.children.find(child => child.material && child.material.uniforms && child.material.uniforms.time);
        if (glow) {
            glow.material.uniforms.time.value = elapsedTime;
        }
        // Animate ring width (hover effect)
        const ring = poiGroup.children.find(child => child.type === 'Line');
        if (ring) {
            // Raycast for hover
            let isHovered = false;
            if (raycaster) {
                const intersects = raycaster.intersectObject(poiGroup, true);
                isHovered = intersects.length > 0;
            }
            const targetWidth = isHovered ? ring.userData.hoverWidth : ring.userData.baseWidth;
            ring.material.linewidth = targetWidth; // Note: linewidth only works in WebGL (not all browsers)
            ring.material.opacity = isHovered ? 1.0 : 0.5;
            ring.material.needsUpdate = true;
            // Optionally scale POI on hover
            const mesh = poiGroup.children.find(child => child.type === 'Mesh');
            if (mesh) {
                const targetScale = isHovered ? 0.4 : 0.3;
                mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
            }
        }
    });
}