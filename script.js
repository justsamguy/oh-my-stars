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
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'Solara Prime', description: 'Ancient homeworld of the Lumina civilization.' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Nebula X-7', description: 'Dense stellar nursery, home to new star formation.' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: 'K\'tharr Station', description: 'Major trade hub and diplomatic center.' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'Void Gate Alpha', description: 'Primary FTL transit point for the sector.' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'Research Post 7', description: 'Advanced xenoarchaeological research facility.' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Mining Colony Beta', description: 'Rich in rare earth elements and deuterium.' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Frontier Station', description: 'Last outpost before uncharted space.' }
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
                float core = 1.0 - smoothstep(0.0, 0.15, dist);
                float glow = exp(-1.5 * dist); // Stronger bloom
                float bloom = smoothstep(0.5, 0.0, dist) * 0.8; // Additional bloom layer
                float final = core + glow * 0.7 + bloom;
                gl_FragColor = vec4(color + vec3(0.2 * bloom), final * (0.6 + 1.2 * (vSize/3.0)));
            }
        `,
        transparent: true,
        depthWrite: false, // Remove hitbox issue
        blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geometry, material);
}

const starLayers = [
    createStarField(2000, 1.5, 4.5, -150, 0.007),  // Far background (1/3 speed)
    createStarField(1500, 3.0, 7.5, -125, 0.01),   // Background
    createStarField(1000, 4.5, 9.0, -100, 0.013),  // Middle
    createStarField(500, 6.0, 12.0, -75, 0.017)    // Near background
];
starLayers.forEach(layer => scene.add(layer));

// Stars
function createStars(count = 200) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * viewportWidth * 2;* 2;
        positions[i + 1] = (Math.random() - 0.5) * viewportHeight * 2;* 2;
        positions[i + 2] = -50;-50;
        sizes[i] = 2 + Math.random() * 3; // Varied star sizes
        colors[i] = colors[i + 1] = colors[i + 2] = Math.random();
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.ShaderMaterial({
    const material = new THREE.PointsMaterial({
        size: 2,: { value: 0 }
        vertexColors: true,
        transparent: true,
        opacity: 0.8e float size;
    });     varying float vSize;
            void main() {
    return new THREE.Points(geometry, material);
}               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (150.0 / -position.z);
const stars = createStars();
scene.add(stars);
        fragmentShader: `
// Define POI geometry before using it
const poiGeometry = new THREE.CircleGeometry(3, 32);
                vec2 center = gl_PointCoord - vec2(0.5);
// Enhanced POI creation with dashed rings and improved glow
function createPOI(poiData) {
    const group = new THREE.Group();
    const scale = 0.3; // Smaller POIsothstep(0.0, 0.2, dist);
                
    // Main POI circle (unchanged)
    const material = new THREE.MeshBasicMaterial({ 
        color: poiData.color,
        transparent: true,ffect
        opacity: 0.9t bloom = 1.0 - smoothstep(0.0, 0.5, dist);
    });         bloom = pow(bloom, 3.0) * 0.5;
    const mesh = new THREE.Mesh(poiGeometry, material);
    mesh.scale.setScalar(scale);ts
                float final = core + glow * 0.6 + bloom;
    // Dashed ring
    const ringGeometry = new THREE.BufferGeometry();
    const segments = 32;or = vec3(1.0, 0.98, 0.95);
    const points = [];
    for (let i = 0; i <= segments; i++) {, final * (0.8 + 0.4 * (vSize/5.0)));
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * 3, Math.sin(theta) * 3, 0)); // Reduced from 4 to 3
    }   transparent: true,
    ringGeometry.setFromPoints(points);g,
        depthWrite: false
    const ringMaterial = new THREE.LineDashedMaterial({
        color: poiData.color,
        dashSize: 1,.Points(geometry, material);
        gapSize: 0.5,
        transparent: true,
        opacity: 0.5to create more stars
    });tars = createStars(300);
    e.add(stars);
    const ring = new THREE.Line(ringGeometry, ringMaterial);
    ring.computeLineDistances(); // Required for dashed lines
    ring.userData.baseWidth = 0.5;leGeometry(3, 32);
    ring.userData.hoverWidth = 1.0;
    nhanced POI creation with dashed rings and improved glow
    // Enhanced glow effect {
    const glowGeometry = new THREE.CircleGeometry(40 * scale, 32); // Half previous size
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(poiData.color) },
            time: { value: 0 }.MeshBasicMaterial({ 
        },lor: poiData.color,
        vertexShader: `ue,
            varying vec2 vUv;
            void main() {
                vUv = uv;E.Mesh(poiGeometry, material);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,hed ring
        fragmentShader: `new THREE.BufferGeometry();
            uniform vec3 color;
            uniform float time;
            varying vec2 vUv;ents; i++) {
            void main() {/ segments) * Math.PI * 2;
                float dist = length(vUv - vec2(0.5)); * 3, Math.sin(theta) * 3, 0)); // Reduced from 4 to 3
                float strength = smoothstep(1.0, 0.0, dist * 2.0); // Smoother falloff
                float pulse = sin(time * 2.0) * 0.1 + 0.9;
                gl_FragColor = vec4(color, strength * pulse);
            }gMaterial = new THREE.LineDashedMaterial({
        `,lor: poiData.color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }); opacity: 0.5
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    const ring = new THREE.Line(ringGeometry, ringMaterial);
    group.add(mesh);Distances(); // Required for dashed lines
    group.add(ring);seWidth = 0.5;
    group.add(glow);verWidth = 1.0;
    group.position.copy(poiData.position);
    group.userData = poiData;
    const glowGeometry = new THREE.CircleGeometry(40 * scale, 32); // Half previous size
    return group;erial = new THREE.ShaderMaterial({
}       uniforms: {
            color: { value: new THREE.Color(poiData.color) },
// Create and add POIslue: 0 }
const poiObjects = pois.map(poi => {
    const poiGroup = createPOI(poi);
    scene.add(poiGroup); vUv;
    return poiGroup;n() {
});             vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// Add connecting lines between POIs
function createConnectingLines() {
    const lineGroup = new THREE.Group();
    for (let i = 0; i < pois.length - 1; i++) {
        const start = pois[i].position;
        const end = pois[i + 1].position;
            void main() {
        const points = [start, end];vUv - vec2(0.5));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);ther falloff
        const material = new THREE.LineBasicMaterial({0.9;
            color: 0xffffff, = vec4(color, strength * pulse);
            transparent: true,
            opacity: 0.6
        });nsparent: true,
        blending: THREE.AdditiveBlending,
        const line = new THREE.Line(geometry, material);
        lineGroup.add(line);
    }
    return lineGroup;THREE.Mesh(glowGeometry, glowMaterial);
}   
    group.add(mesh);
const connectingLines = createConnectingLines();
scene.add(connectingLines);
    group.position.copy(poiData.position);
// Interaction setup poiData;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMouseY = 0;
let currentInfoBox = null;
const poiObjects = pois.map(poi => {
// Add these variables after the mouse declaration
let scrollVelocity = 0;;
let isInfoBoxOpen = false;
const SCROLL_DAMPING = 0.95;
const MAX_SCROLL_SPEED = 2;
// Add connecting lines between POIs
function showInfoBox(poi) {nes() {
    if (currentInfoBox) { THREE.Group();
        const oldBox = currentInfoBox;1; i++) {
        currentInfoBox = null;position;
        oldBox.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
            oldBox.remove();t, end];
            if (!currentInfoBox) {.BufferGeometry().setFromPoints(points);
                createNewInfoBox(poi);eBasicMaterial({
            }olor: 0xffffff,
        }, 300);sparent: true,
    } else {opacity: 0.6
        createNewInfoBox(poi);
    }   
}       const line = new THREE.Line(geometry, material);
        lineGroup.add(line);
function createNewInfoBox(poi) {
    isInfoBoxOpen = true;
    
    const div = document.createElement('div');
    div.className = 'info-box';onnectingLines();
    div.style.cssText = `);
        position: absolute;
        background: rgba(0, 0, 20, 0.8);
        color: white; THREE.Raycaster();
        padding: 15px;E.Vector2();
        border-radius: 5px;
        max-width: 200px;
        pointer-events: auto;
        transform-origin: left center;
        transform: scaleY(0) scaleX(0);declaration
        transition: transform 0.3s ease-out;
        border: 1px solid #${poi.color.toString(16)};
    `;SCROLL_DAMPING = 0.95;
    t MAX_SCROLL_SPEED = 2;
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.2s ease-out 0.2s';
    content.innerHTML = `rrentInfoBox;
        <h3 style="margin: 0 0 10px 0; color: #${poi.color.toString(16)}">${poi.name}</h3>
        <p style="margin: 0">${poi.description}</p>0)';
    `;  setTimeout(() => {
            oldBox.remove();
    div.appendChild(content);ox) {
                createNewInfoBox(poi);
    const worldPos = poi.position.clone();
    const screenPos = worldPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    }
    div.style.left = `${x + 20}px`;
    div.style.top = `${y - 20}px`;
    tion createNewInfoBox(poi) {
    infoBoxContainer.appendChild(div);
    
    requestAnimationFrame(() => {ement('div');
        div.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
            div.style.transform = 'scaleY(1) scaleX(1)';
            content.style.opacity = '1';
        }, 150);hite;
    }); padding: 15px;
        border-radius: 5px;
    currentInfoBox = div;
    return div;-events: auto;
}       transform-origin: left center;
        transform: scaleY(0) scaleX(0);
// Add this function before showInfoBox-out;
function hideInfoBox() {d #${poi.color.toString(16)};
    if (currentInfoBox) {
        currentInfoBox.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {nt.createElement('div');
            currentInfoBox.remove();
            currentInfoBox = null;acity 0.2s ease-out 0.2s';
            isInfoBoxOpen = false;
        }, 300);e="margin: 0 0 10px 0; color: #${poi.color.toString(16)}">${poi.name}</h3>
    }   <p style="margin: 0">${poi.description}</p>
}   `;
    
// Update scroll behaviornt);
function onWheel(event) {
    event.preventDefault();sition.clone();
    if (!isInfoBoxOpen) {ldPos.project(camera);
        scrollVelocity -= event.deltaY * 0.012; // Increased by 20%
    }onst y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
}   
    div.style.left = `${x + 20}px`;
window.addEventListener('wheel', onWheel, { passive: false });
    
// Add this function before animate();
function updateScroll() {
    // Apply dampingFrame(() => {
    scrollVelocity *= SCROLL_DAMPING;(1) scaleX(0)';
        setTimeout(() => {
    // Clamp scroll velocityorm = 'scaleY(1) scaleX(1)';
    scrollVelocity = Math.max(Math.min(scrollVelocity, MAX_SCROLL_SPEED), -MAX_SCROLL_SPEED);
        }, 150);
    // Update camera position
    if (Math.abs(scrollVelocity) > 0.01) {
        camera.position.y += scrollVelocity;
        rn div;
        // Update clamp values to match POI bounds
        const minY = -240;  // Match lowest POI
        const maxY = 100;   // Match highest POI
        camera.position.y = Math.max(Math.min(camera.position.y, maxY), minY);
    }f (currentInfoBox) {
}       currentInfoBox.style.transform = 'scaleY(1) scaleX(0)';
        setTimeout(() => {
// Modified animation loop.remove();
const clock = new THREE.Clock();l;
            isInfoBoxOpen = false;
function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    pdate scroll behavior
    // Update POI elements
    poiObjects.forEach(poi => {
        const ring = poi.children[1];
        const glow = poi.children[2];Y * 0.012; // Increased by 20%
        ring.rotation.z += 0.005;
        if (glow && glow.material.uniforms) {
            glow.material.uniforms.time.value = elapsedTime;
        }dEventListener('wheel', onWheel, { passive: false });
        
        // Add hover effect animate()
        const intersects = raycaster.intersectObject(poi, true);
        if (intersects.length > 0) {
            poi.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
            ring.material.linewidth = ring.userData.hoverWidth;
            document.body.style.cursor = 'pointer';
        } else {ty = Math.max(Math.min(scrollVelocity, MAX_SCROLL_SPEED), -MAX_SCROLL_SPEED);
            poi.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            ring.material.linewidth = ring.userData.baseWidth;
        }ath.abs(scrollVelocity) > 0.01) {
    }); camera.position.y += scrollVelocity;
        
    // Update raycastingvalues to match POI bounds
    raycaster.setFromCamera(mouse, camera); POI
        const maxY = 100;   // Match highest POI
    if (raycaster.intersectObjects(poiObjects, true).length === 0) {Y), minY);
        document.body.style.cursor = 'grab';
    }
    
    const cameraY = camera.position.y;
    starLayers.forEach(layer => {
        layer.material.uniforms.cameraY.value = cameraY;
        layer.material.uniforms.time.value = elapsedTime;
    });uestAnimationFrame(animate);
    
    // Update star material timeme = clock.getElapsedTime();
    if (stars.material.uniforms) {
        stars.material.uniforms.time.value = elapsedTime;
    }   poiObjects.forEach(poi => {
            const ring = poi.children[1];
    updateScroll();i.children[2];
    
    renderer.render(scene, camera);
}elapsedTime;
    }
// Handle Window Resize
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;.intersectObject(poi, true);
    const newWidth = viewportHeight * newAspect;    if (intersects.length > 0) {
     0.1);
    camera.left = newWidth / -2;         ring.material.linewidth = ring.userData.hoverWidth;
    camera.right = newWidth / 2;            document.body.style.cursor = 'pointer';
    camera.updateProjectionMatrix();
    , 1), 0.1);
    renderer.setSize(window.innerWidth, window.innerHeight);dth;
});
});
// Add these event listeners after window resize handler
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;era);
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    f (raycaster.intersectObjects(poiObjects, true).length === 0) {
    if (isDragging) {     document.body.style.cursor = 'grab';
        const deltaY = event.clientY - previousMouseY;    }
        scrollVelocity = deltaY * 0.1;
        previousMouseY = event.clientY;mera.position.y;
    }
});e = cameraY;
     layer.material.uniforms.time.value = elapsedTime;
window.addEventListener('mousedown', (event) => {    });
    isDragging = true;
    previousMouseY = event.clientY;
    document.body.style.cursor = 'grabbing';
}); renderer.render(scene, camera);
}
window.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'grab';, () => {
});ght;
portHeight * newAspect;
window.addEventListener('click', () => {
    const intersects = raycaster.intersectObjects(poiObjects, true);idth / -2;
    if (intersects.length > 0) {amera.right = newWidth / 2;
        const poi = intersects[0].object.parent.userData; camera.updateProjectionMatrix();
        showInfoBox(poi);    
    } else {ze(window.innerWidth, window.innerHeight);
        hideInfoBox();
    }





animate();// Start Animation});// Add these event listeners after window resize handler
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
