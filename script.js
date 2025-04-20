import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Add this style block at the start
document.head.insertAdjacentHTML('beforeend', `
    <style>
        * { margin: 0; padding: 0; }
        body, html { 
            overflow: hidden; 
            background: #000;
            height: 100vh;
            width: 100vw;
        }
        canvas { 
            position: fixed;
            top: 0;
            left: 0;
        }
        .info-box {
            font-family: 'Courier New', monospace !important;
        }
        .info-box h3 {
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        .info-box .timestamp {
            font-size: 0.8em;
            color: #666;
            margin-top: 10px;
        }
        .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            color: #666;
            width: 20px;
            height: 20px;
            text-align: center;
            line-height: 20px;
            transition: color 0.2s;
        }
        .close-btn:hover {
            color: #fff;
        }
    </style>
`);

// Scene Setup
const scene = new THREE.Scene();

// Generate colors across spectrum for POIs
const generateSpectralColors = (count) => {
    return Array.from({length: count}, (_, i) => {
        const hue = (i / count);
        const color = new THREE.Color().setHSL(hue, 0.7, 0.7);
        return color.getHex();
    });
};

// Define POIs first
const poiColors = generateSpectralColors(7);
const pois = [
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'Solara Prime', description: 'Ancient homeworld of the Lumina civilization.' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Nebula X-7', description: 'Dense stellar nursery, home to new star formation.' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: 'K\'tharr Station', description: 'Major trade hub and diplomatic center.' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'Void Gate Alpha', description: 'Primary FTL transit point for the sector.' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'Research Post 7', description: 'Advanced xenoarchaeological research facility.' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Mining Colony Beta', description: 'Rich in rare earth elements and deuterium.' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Frontier Station', description: 'Last outpost before uncharted space.' }
];

// Calculate viewport dimensions after POIs are defined
const poiHeight = Math.abs(pois[pois.length - 1].position.y - pois[0].position.y);
const viewportHeight = poiHeight * 1.1; // Change from 1.2 to 1.1 (10% padding)
const aspect = window.innerWidth / window.innerHeight;
const viewportWidth = viewportHeight * aspect;

// Camera setup with corrected viewport
const camera = new THREE.OrthographicCamera(
    viewportWidth / -2,
    viewportWidth / 2,
    viewportHeight / 2,
    viewportHeight / -2,
    -1000,
    1000
);

// Set camera position relative to POI range
camera.position.set(0, (pois[0].position.y + pois[pois.length - 1].position.y) / 2, 100);
camera.lookAt(0, camera.position.y, 0);

// Remove header by adjusting renderer setup
const canvas = document.createElement('canvas');
canvas.id = 'bg';
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.sortObjects = true;  // Enable depth sorting
renderer.autoClear = false;   // Manual scene clearing
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(renderer.domElement);

// Info box container
const infoBoxContainer = document.createElement('div');
infoBoxContainer.id = 'infoBoxContainer';
infoBoxContainer.style.position = 'absolute';
infoBoxContainer.style.top = '0';
infoBoxContainer.style.left = '0';
infoBoxContainer.style.width = '100%';
infoBoxContainer.style.height = '100%';
infoBoxContainer.style.pointerEvents = 'none';
document.body.appendChild(infoBoxContainer);

// Background - Update size to match full scrollable area
const scrollHeight = Math.abs(pois[pois.length - 1].position.y - pois[0].position.y);
const bgGeometry = new THREE.PlaneGeometry(viewportWidth * 2, viewportHeight * 1.5);
const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const background = new THREE.Mesh(bgGeometry, bgMaterial);
background.position.z = -200;  // Move further back
scene.add(background);

// Stars - Modify creation function
function createAllStars(count = 9000) { // Reduced to 75% of original count
    const group = new THREE.Group();
    
    // Sort POIs by Y position and get bounds
    const sortedPOIs = [...pois].sort((a, b) => b.position.y - a.position.y);
    const highestY = sortedPOIs[0].position.y + 50; // Add padding
    const lowestY = sortedPOIs[sortedPOIs.length - 1].position.y - 50; // Add padding
    
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.CircleGeometry(4, 32); // first integer controls radius of glow canvas
        
        // Generate positions across full range
        const x = (Math.random() - 0.5) * viewportWidth * 2;
        const y = lowestY + (Math.random() * (highestY - lowestY));
        const z = -120 - Math.random() * 60;
        
        // Find the nearest POI segment for color interpolation
        let colorIndex = 0;
        const normalizedY = Math.min(Math.max(y, lowestY), highestY);
        
        // Find appropriate color segment
        for (let j = 0; j < sortedPOIs.length - 1; j++) {
            if (normalizedY <= sortedPOIs[j].position.y && normalizedY > sortedPOIs[j + 1].position.y) {
                colorIndex = j;
                break;
            }
        }
        
        // Handle edge case for lowest segment
        if (normalizedY <= sortedPOIs[sortedPOIs.length - 1].position.y) {
            colorIndex = sortedPOIs.length - 2;
        }
        
        // Get the two POIs to blend between
        const upperPOI = sortedPOIs[colorIndex];
        const lowerPOI = sortedPOIs[colorIndex + 1];
        
        // Calculate blend factor
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
                mousePosition: { value: new THREE.Vector3(-10000, -10000, 0) }
            },
            vertexShader: `
                uniform float cameraY;
                varying vec2 vUv;
                varying vec3 vWorldPosition; // Pass world position
                varying float vRandomSeed; // Pass random seed per star

                // Simple hash function for pseudo-randomness in vertex shader
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vUv = uv;
                    // Calculate a random seed based on initial position (before parallax)
                    vRandomSeed = hash(position.xy);

                    vec3 pos = position; // Use original position for parallax calculation relative to cameraY
                    float parallaxStrength = 0.0075 * (180.0 + position.z) / 60.0; // Keep original Z for parallax strength
                    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz; // Calculate base world position

                    // Apply parallax offset in world space Y based on cameraY
                    worldPos.y -= cameraY * parallaxStrength;

                    vWorldPosition = worldPos; // Pass final world position

                    vec4 mvPosition = viewMatrix * vec4(vWorldPosition, 1.0); // Calculate model-view position
                    gl_Position = projectionMatrix * mvPosition; // Calculate final screen position
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float time;
                uniform vec3 mousePosition; // World space position of mouse on z=0 plane
                varying vec2 vUv;
                varying vec3 vWorldPosition; // Star's world position
                varying float vRandomSeed; // Receive random seed

                // Define interaction radii
                const float MAX_INTERACTION_RADIUS = 75.0;
                const float MIN_INTERACTION_RADIUS = 15.0; // Radius for maximum effect

                void main() {
                    // --- Calculate distance from mouse ---
                    // Use only X and Y for 2D screen distance
                    float mouseDist = length(vWorldPosition.xy - mousePosition.xy);

                    // --- Calculate mouse proximity factor (0 = far, 1 = close) ---
                    // smoothstep(edge0, edge1, x): 0 if x <= edge0, 1 if x >= edge1, smooth transition between
                    // We want the opposite: 1 if dist <= MIN, 0 if dist >= MAX
                    // So, use smoothstep(MAX, MIN, mouseDist)
                    float mouseProximityFactor = smoothstep(MAX_INTERACTION_RADIUS, MIN_INTERACTION_RADIUS, mouseDist);

                    // --- Calculate base dot appearance (small, sharp white dot) ---
                    float coreDist = length(vUv - vec2(0.5)); // Distance from center of the star's geometry UVs
                    float coreAlpha = smoothstep(0.15, 0.05, coreDist); // Sharp falloff for a small dot
                    vec3 coreColor = vec3(1.0); // White

                    // --- Calculate base glow shape ---
                    float glowShape = smoothstep(0.5, 0.0, coreDist); // Glow falloff (adjust 0.5 for glow size)
                    vec3 glowColor = color; // Star's inherent color

                    // --- Calculate random twinkle parameters ---
                    // Reduced frequency and speed ranges for a smoother pulse effect
                    float randomFrequency = mix(0.3, 1.2, vRandomSeed); // Slower frequency range (0.3Hz to 1.2Hz)
                    float randomSpeed = mix(0.7, 1.5, fract(vRandomSeed * 10.0)); // Narrower speed multiplier range
                    float randomMaxIntensityFactor = mix(0.5, 1.0, fract(vRandomSeed * 100.0)); // Random max strength (50% to 100%) - Kept the same

                    // --- Calculate twinkle modulation value (0 to 1 range, scaled by random max intensity) ---
                    // Use time * speed * frequency for the sin wave
                    float twinkleValue = (sin(time * randomSpeed * randomFrequency * 6.28318) * 0.5 + 0.5); // Base pulse 0 to 1 (using 2*PI)
                    twinkleValue *= randomMaxIntensityFactor; // Scale by random max intensity factor

                    // --- Calculate base glow alpha (without old pulse) ---
                    float baseGlowAlpha = clamp(glowShape, 0.0, 1.0);

                    // --- Modulate glow alpha with twinkle based on mouse proximity ---
                    // When mouse is far (factor=0), use 1.0 (no modulation).
                    // When close (factor=1), use twinkleValue.
                    float finalGlowAlpha = baseGlowAlpha * mix(1.0, twinkleValue, mouseProximityFactor);

                    // --- Combine core dot and modulated glow ---
                    // Interpolate color from white core to star's glow color based on proximity
                    vec3 finalColor = mix(coreColor, glowColor, mouseProximityFactor);

                    // Combine alphas:
                    // Core alpha is reduced when glow is active (proximity > 0)
                    // Glow alpha (finalGlowAlpha) is added, scaled by proximity
                    float combinedAlpha = mix(coreAlpha * 0.5, coreAlpha, 1.0 - mouseProximityFactor) + finalGlowAlpha * mouseProximityFactor;
                    combinedAlpha = clamp(combinedAlpha, 0.0, 1.0); // Clamp final alpha

                    gl_FragColor = vec4(finalColor, combinedAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const star = new THREE.Mesh(geometry, material);
        star.position.set(x, y, z);

        const size = 0.5 + Math.random() * (2.25 - Math.abs(z + 150) / 60); // Increased max size by 50%
        star.userData.originalScale = size; // Store original scale
        star.scale.set(size / 3, size / 3, 1); // Set initial smaller scale
        star.rotation.z = Math.random() * Math.PI;

        group.add(star);
    }

    return group;
}

// Add this function after createAllStars
function getWorldPosition(clientX, clientY) {
    // Convert mouse position to normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create a vector at the near clipping plane
    const near = new THREE.Vector3(x, y, -1);
    near.unproject(camera);
    
    // Create a vector at the far clipping plane
    const far = new THREE.Vector3(x, y, 1);
    far.unproject(camera);
    
    // Calculate the ray direction and normalize it
    const direction = far.sub(near).normalize();
    
    // Calculate intersection with z=0 plane
    const t = -near.z / direction.z;
    return new THREE.Vector3(
        near.x + direction.x * t,
        near.y + direction.y * t,
        0
    );
}

// Update initial star creation
const stars = createAllStars(9000); // Match new count
scene.add(stars);

// Define POI geometry before using it
const poiGeometry = new THREE.CircleGeometry(3, 32);

// Enhanced POI creation with dashed rings and improved glow
function createPOI(poiData) {
    const group = new THREE.Group();
    const scale = 0.3; // Smaller POIs
    
    // Main POI circle
    const material = new THREE.MeshBasicMaterial({ 
        color: poiData.color,
        transparent: true,
        opacity: 0.9
    });
    const mesh = new THREE.Mesh(poiGeometry, material);
    mesh.scale.setScalar(scale);
    
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
    
    // Enhanced glow effect
    const glowGeometry = new THREE.CircleGeometry(40, 32); // Remove scale from geometry creation
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(poiData.color) },
            time: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float time;
            varying vec2 vUv;
            void main() {
                float dist = length(vUv - vec2(0.5));
                float strength = smoothstep(1.0, 0.0, dist * 2.0);
                float pulse = sin(time * 2.0) * 0.1 + 0.9;
                gl_FragColor = vec4(color, strength * pulse);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.setScalar(scale); // Apply scale after creation
    
    group.add(mesh);
    group.add(ring);
    group.add(glow);
    group.position.copy(poiData.position);
    group.userData = poiData;
    
    return group;
}

// Create and add POIs
const poiObjects = pois.map(poi => {
    const poiGroup = createPOI(poi);
    scene.add(poiGroup);
    return poiGroup;
});

// Add connecting lines between POIs
function createConnectingLines() {
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
const connectingLines = createConnectingLines();
scene.add(connectingLines);

// Interaction setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMouseY = 0;
let currentInfoBox = null;

// Add these variables after the mouse declaration
let scrollVelocity = 0;
let isInfoBoxOpen = false;
const SCROLL_DAMPING = 0.95;
const MAX_SCROLL_SPEED = 2;

function showInfoBox(poi) {
    if (currentInfoBox) {
        const oldBox = currentInfoBox;
        currentInfoBox = null;
        oldBox.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
            oldBox.remove();
            if (!currentInfoBox) {
                createNewInfoBox(poi);
            }
        }, 300);
    } else {
        createNewInfoBox(poi);
    }
}

function createNewInfoBox(poi) {
    isInfoBoxOpen = true;
    const div = document.createElement('div');
    div.className = 'info-box';
    div.style.cssText = `
        position: absolute;
        background: rgba(0, 20, 40, 0.9);
        color: white;
        padding: 15px;
        border-radius: 5px;
        max-width: 200px;
        pointer-events: auto;
        transform-origin: left center;
        transform: scaleX(0);
        transition: transform 0.2s ease-out;
        border: 1px solid #${poi.color.toString(16)};
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    `;
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = hideInfoBox;
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.15s ease-out';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
    content.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #${poi.color.toString(16)}">${poi.name}</h3>
        <p style="margin: 0">${poi.description}</p>
        <div class="timestamp">${timestamp}</div>
    `;
    div.appendChild(closeBtn);
    div.appendChild(content);
    const worldPos = poi.position.clone();
    const screenPos = worldPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    div.style.left = `${x + 20}px`;
    div.style.top = `${y - 20}px`;
    infoBoxContainer.appendChild(div);
    requestAnimationFrame(() => {
        div.style.transform = 'scaleX(1)';
        content.style.opacity = '1';
    });
    currentInfoBox = div;
    return div;
}

function hideInfoBox() {
    if (currentInfoBox) {
        currentInfoBox.style.transform = 'scale(0)';
        setTimeout(() => {
            currentInfoBox.remove();
            currentInfoBox = null;
            isInfoBoxOpen = false;
        }, 200);
    }
}

// Update scroll behavior
function onWheel(event) {
    event.preventDefault();
    if (!isInfoBoxOpen) {
        scrollVelocity -= event.deltaY * 0.012; // Increased by 20%
    }
}
window.addEventListener('wheel', onWheel, { passive: false });

// Add this function before animate();
function updateScroll() {
    // Apply damping
    scrollVelocity *= SCROLL_DAMPING;
    // Clamp scroll velocity
    scrollVelocity = Math.max(Math.min(scrollVelocity, MAX_SCROLL_SPEED), -MAX_SCROLL_SPEED);
    // Update camera position
    if (Math.abs(scrollVelocity) > 0.01) {
        camera.position.y += scrollVelocity;
        // Update clamp values to match POI bounds
        const minY = -240;  // Match lowest POI
        const maxY = 100;   // Match highest POI
        camera.position.y = Math.max(Math.min(camera.position.y, maxY), minY);
    }
}

// Modified animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    // Update POI elements
    poiObjects.forEach(poi => {
        const ring = poi.children[1];
        const glow = poi.children[2];
        ring.rotation.z += 0.005;
        if (glow && glow.material.uniforms) {
            glow.material.uniforms.time.value = elapsedTime;
        }
        // Add hover effect
        const intersects = raycaster.intersectObject(poi, true);
        if (intersects.length > 0) {
            poi.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
            ring.material.linewidth = ring.userData.hoverWidth;
            document.body.style.cursor = 'pointer';
        } else {
            poi.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            ring.material.linewidth = ring.userData.baseWidth;
        }
    });
        
    // Update raycasting
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.intersectObjects(poiObjects, true).length === 0) {
        document.body.style.cursor = 'grab';
    }
    const cameraY = camera.position.y;
    // Define interaction radii constants accessible here
    const MAX_INTERACTION_RADIUS = 75.0;
    const MIN_INTERACTION_RADIUS = 15.0;

    stars.children.forEach(star => {
        star.material.uniforms.time.value = elapsedTime;
        star.material.uniforms.cameraY.value = cameraY;

        // --- Scale interpolation based on mouse proximity ---
        const originalScale = star.userData.originalScale;
        if (originalScale) { // Ensure originalScale exists
            const mousePos = star.material.uniforms.mousePosition.value; // Get current mouse world pos from uniform
            const starPos = star.position;

            // Calculate 2D distance (ignoring Z)
            const dx = starPos.x - mousePos.x;
            const dy = starPos.y - mousePos.y;
            const mouseDist = Math.sqrt(dx * dx + dy * dy);

            // Calculate proximity factor (0=far, 1=close) - mirroring shader logic
            const factor = Math.max(0.0, Math.min(1.0, (mouseDist - MIN_INTERACTION_RADIUS) / (MAX_INTERACTION_RADIUS - MIN_INTERACTION_RADIUS)));
            const mouseProximityFactor = 1.0 - factor; // Invert to get 1.0 when close

            // Interpolate scale: target is originalScale when factor is 1, originalScale / 3 when factor is 0
            const targetScale = (originalScale / 3) + (originalScale * 2 / 3) * mouseProximityFactor;

            // Smoothly interpolate current scale towards target scale
            const lerpFactor = 0.1; // Adjust for faster/slower transition
            star.scale.x += (targetScale - star.scale.x) * lerpFactor;
            star.scale.y += (targetScale - star.scale.y) * lerpFactor;
            // star.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), lerpFactor); // Using lerp directly might be smoother
        }
    });

    updateScroll();
    renderer.clear();         // Clear manually
    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    const newWidth = viewportHeight * newAspect;
    camera.left = newWidth / -2;
    camera.right = newWidth / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add these event listeners after window resize handler
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const worldPos = getWorldPosition(event.clientX, event.clientY);
    // Update all stars with new mouse position
    stars.children.forEach(star => {
        star.material.uniforms.mousePosition.value.copy(worldPos);
    });
    if (isDragging) {
        const deltaY = event.clientY - previousMouseY;
        scrollVelocity = deltaY * 0.1;
        previousMouseY = event.clientY;
    }
});
window.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMouseY = event.clientY;
    document.body.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'grab';
});
window.addEventListener('click', () => {
    const intersects = raycaster.intersectObjects(poiObjects, true);
    if (intersects.length > 0) {
        const poi = intersects[0].object.parent.userData;
        showInfoBox(poi);
    } else {
        hideInfoBox();
    }
});

// Start Animation
animate();
