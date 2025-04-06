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

// Enhanced POI data
const pois = [
    { 
        position: new THREE.Vector3(-40, 20, 0),
        color: 0xff6666,
        name: 'Alpha Station',
        description: 'Primary research facility in the outer rim.'
    },
    { 
        position: new THREE.Vector3(40, -20, 0),
        color: 0x66ff66,
        name: 'Beta Nebula',
        description: 'Rich in rare minerals and atmospheric phenomena.'
    },
    { 
        position: new THREE.Vector3(0, 40, 0),
        color: 0x6666ff,
        name: 'Gamma Point',
        description: 'Strategic military outpost and trading hub.'
    }
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
camera.position.z = 100;
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
const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uColorA: { value: new THREE.Color(0x000022) },
        uColorB: { value: new THREE.Color(0x000044) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;
        void main() {
            vec3 color = mix(uColorA, uColorB, vUv.y);
            gl_FragColor = vec4(color, 1.0);
        }
    `
});

const background = new THREE.Mesh(bgGeometry, bgMaterial);
background.position.z = -100;
scene.add(background);

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

// Enhanced POI creation with rings
function createPOI(poiData) {
    const group = new THREE.Group();
    
    // Main POI circle
    const material = new THREE.MeshBasicMaterial({ 
        color: poiData.color,
        transparent: true,
        opacity: 0.9
    });
    const mesh = new THREE.Mesh(poiGeometry, material);
    
    // Outer ring
    const ringGeometry = new THREE.RingGeometry(4, 4.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: poiData.color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    group.add(mesh);
    group.add(ring);
    group.position.copy(poiData.position);
    group.userData = poiData;
    
    // Add glow effect
    const glowGeometry = new THREE.CircleGeometry(6, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(poiData.color) }
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
            varying vec2 vUv;
            void main() {
                float strength = 1.0 - distance(vUv, vec2(0.5));
                strength = pow(strength, 3.0);
                gl_FragColor = vec4(color, strength * 0.5);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
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
            color: 0x334455,
            transparent: true,
            opacity: 0.3
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

function showInfoBox(poi) {
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
    `;
    
    div.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #${poi.color.toString(16)}">${poi.name}</h3>
        <p style="margin: 0">${poi.description}</p>
    `;
    
    const worldPos = poi.position.clone();
    const screenPos = worldPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    
    div.style.left = `${x + 20}px`;
    div.style.top = `${y - 20}px`;
    
    // Add animation
    div.style.transform = 'scale(0.8)';
    div.style.opacity = '0';
    div.style.transition = 'all 0.3s ease-out';
    
    requestAnimationFrame(() => {
        div.style.transform = 'scale(1)';
        div.style.opacity = '1';
    });
    
    infoBoxContainer.appendChild(div);
    return div;
}

// Event listeners
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (isDragging) {
        const deltaY = event.clientY - previousMouseY;
        camera.position.y += deltaY * 0.1;
        previousMouseY = event.clientY;
    }
}

function onMouseDown(event) {
    isDragging = true;
    previousMouseY = event.clientY;
}

function onMouseUp() {
    isDragging = false;
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);

// Modified animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Update POI rings and glow
    poiObjects.forEach(poi => {
        const ring = poi.children[1];
        const glow = poi.children[2];
        ring.rotation.z += 0.005;
        if (glow) {
            glow.rotation.z -= 0.003;
        }
    });
    
    // Raycasting for POI interaction
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(poiObjects, true);
    
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'grab';
    }
    
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

// Start Animation
animate();
