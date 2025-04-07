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
    </style>
`);

// Scene Setup
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const viewportHeight = 150;
const viewportWidth = viewportHeight * aspect;

// Generate colors across spectrum for POIs
const generateSpectralColors = (count) => {
    return Array.from({length: count}, (_, i) => {
        const hue = (i / count);
        const color = new THREE.Color().setHSL(hue, 0.7, 0.7);
        return color.getHex();
    });
};

// Update POI data with spectrum colors and new positions
const poiColors = generateSpectralColors(7);
const pois = [
    { position: new THREE.Vector3(-25, 50, 0), color: poiColors[0], name: 'Solara Prime', description: 'Ancient homeworld of the Lumina civilization.' },
    { position: new THREE.Vector3(-20, 15, 0), color: poiColors[1], name: 'Nebula X-7', description: 'Dense stellar nursery, home to new star formation.' },
    { position: new THREE.Vector3(35, -10, 0), color: poiColors[2], name: 'K\'tharr Station', description: 'Major trade hub and diplomatic center.' },
    { position: new THREE.Vector3(40, -15, 0), color: poiColors[3], name: 'Void Gate Alpha', description: 'Primary FTL transit point for the sector.' },
    { position: new THREE.Vector3(-35, -65, 0), color: poiColors[4], name: 'Research Post 7', description: 'Advanced xenoarchaeological research facility.' },
    { position: new THREE.Vector3(15, -95, 0), color: poiColors[5], name: 'Mining Colony Beta', description: 'Rich in rare earth elements and deuterium.' },
    { position: new THREE.Vector3(-20, -120, 0), color: poiColors[6], name: 'Frontier Station', description: 'Last outpost before uncharted space.' }
];

// Camera Setup - Orthographic for 2D-style view
const camera = new THREE.OrthographicCamera(
    viewportWidth / -2,
    viewportWidth / 2,
    viewportHeight / 2,
    viewportHeight / -2,
    -1000,
    1000
);
camera.position.set(0, 100, 100);  // Y position matches highest POI
camera.lookAt(0, 0, 0);

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

// Background
const bgGeometry = new THREE.PlaneGeometry(viewportWidth * 2, viewportHeight * 2);
const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const background = new THREE.Mesh(bgGeometry, bgMaterial);
background.position.z = -100;
scene.add(background);

// Enhanced star system with parallax
function createStarField(count, minSize, maxSize, depth, speedFactor) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const twinkles = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        const size = minSize + Math.random() * (maxSize - minSize);
        positions[i * 3] = (Math.random() - 0.5) * viewportWidth * 3;
        positions[i * 3 + 1] = (Math.random() - 0.5) * viewportHeight * 6;
        positions[i * 3 + 2] = depth - Math.random() * 50;
        sizes[i] = size;
        speeds[i] = speedFactor * (size / maxSize) * 0.1; // 100x slower
        twinkles[i] = Math.random() * Math.PI; // Random phase for twinkling
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('twinkle', new THREE.BufferAttribute(twinkles, 1));
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            cameraY: { value: 0 },
            time: { value: 0 },
            color: { value: new THREE.Color(
                0.95 + Math.random() * 0.05,
                0.95 + Math.random() * 0.05,
                0.95 + Math.random() * 0.05
            )}
        },
        vertexShader: `
            attribute float size;
            attribute float speed;
            attribute float twinkle;
            uniform float time;
            uniform float cameraY;
            varying float vSize;
            void main() {
                vec3 pos = position;
                pos.y -= cameraY * speed;
                vSize = size;
                float twinkleEffect = 1.0 + sin(time * 2.0 + twinkle) * 0.2 * (1.0 - size/3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * twinkleEffect * (150.0 / -pos.z); // Reduced size
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vSize;
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                float core = 1.0 - smoothstep(0.0, 0.2, dist); // Sharp core
                float glow = 1.0 - smoothstep(0.2, 0.5, dist); // Soft glow
                float final = core * 0.7 + glow * 0.6;
                gl_FragColor = vec4(color, final * (0.8 + 1.4 * (vSize/3.0))); // 1.7x stronger glow
            }
        `,
        transparent: true,
        depthWrite: false, // Remove hitbox issue
        blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geometry, material);
}

const starLayers = [
    createStarField(1000, 0.5, 1.0, -100, 0.05),  // Background
    createStarField(800, 1.0, 2.0, -50, 0.15),    // Middle
    createStarField(1200, 2.0, 4.0, -35, 0.25),   // New intermediate layer
    createStarField(600, 4.0, 6.0, -25, 0.35)     // Foreground (2x size, 3x count)
];
starLayers.forEach(layer => scene.add(layer));

// Stars
function createStars(count = 200) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * viewportWidth * 2;
        positions[i + 1] = (Math.random() - 0.5) * viewportHeight * 2;
        positions[i + 2] = -50;

        colors[i] = colors[i + 1] = colors[i + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    return new THREE.Points(geometry, material);
}

const stars = createStars();
scene.add(stars);

// Define POI geometry before using it
const poiGeometry = new THREE.CircleGeometry(3, 32);

// Enhanced POI creation with dashed rings and improved glow
function createPOI(poiData) {
    const group = new THREE.Group();
    const scale = 0.3; // Smaller POIs
    
    // Main POI circle (unchanged)
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
        points.push(new THREE.Vector3(Math.cos(theta) * 4, Math.sin(theta) * 4, 0));
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
    ring.computeLineDistances(); // Required for dashed lines
    ring.userData.baseWidth = 0.5;
    ring.userData.hoverWidth = 1.0;
    
    // Enhanced glow effect
    const glowGeometry = new THREE.CircleGeometry(40 * scale, 32); // Half previous size
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
                float strength = smoothstep(1.0, 0.0, dist * 2.0); // Smoother falloff
                float pulse = sin(time * 2.0) * 0.1 + 0.9;
                gl_FragColor = vec4(color, strength * pulse);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
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
        hideInfoBox();
    }
    isInfoBoxOpen = true;
    
    const div = document.createElement('div');
    div.className = 'info-box';
    div.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 20, 0.8);
        color: white;
        padding: 15px;
        border-radius: 5px;
        max-width: 200px;
        pointer-events: auto;
        transform-origin: left center;
        transform: scaleY(0) scaleX(0);
        transition: transform 0.3s ease-out;
        border: 1px solid #${poi.color.toString(16)};
    `;
    
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.2s ease-out 0.2s';
    content.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #${poi.color.toString(16)}">${poi.name}</h3>
        <p style="margin: 0">${poi.description}</p>
    `;
    
    div.appendChild(content);
    
    const worldPos = poi.position.clone();
    const screenPos = worldPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    
    div.style.left = `${x + 20}px`;
    div.style.top = `${y - 20}px`;
    
    infoBoxContainer.appendChild(div);
    
    requestAnimationFrame(() => {
        div.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
            div.style.transform = 'scaleY(1) scaleX(1)';
            content.style.opacity = '1';
        }, 150);
    });
    
    currentInfoBox = div;
    return div;
}

// Add this function before showInfoBox
function hideInfoBox() {
    if (currentInfoBox) {
        currentInfoBox.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
            currentInfoBox.remove();
            currentInfoBox = null;
            isInfoBoxOpen = false;
        }, 300);
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

// Add this function before animate()
function updateScroll() {
    // Apply damping
    scrollVelocity *= SCROLL_DAMPING;
    
    // Clamp scroll velocity
    scrollVelocity = Math.max(Math.min(scrollVelocity, MAX_SCROLL_SPEED), -MAX_SCROLL_SPEED);
    
    // Update camera position
    if (Math.abs(scrollVelocity) > 0.01) {
        camera.position.y += scrollVelocity;
        
        // Clamp camera position to POI bounds
        const minY = -120;
        const maxY = 100;
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
    starLayers.forEach(layer => {
        layer.material.uniforms.cameraY.value = cameraY;
        layer.material.uniforms.time.value = elapsedTime;
    });
    
    updateScroll();
    
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
