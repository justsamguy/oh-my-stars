import * as THREE from 'three';
// OrbitControls might still be useful for panning/zooming in 2D
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// CSS2DRenderer is less suitable for the new animation, we'll use standard DOM elements.
// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import TWEEN from '@tweenjs/tween.js'; // For smooth camera animation

// =============================================================================
// Scene Setup (2D Focus)
// =============================================================================
const scene = new THREE.Scene();
// Background will be handled by a custom gradient plane

// --- Orthographic Camera for 2D ---
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 150; // Determines the visible area height; adjust as needed
const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, // left
    frustumSize * aspect / 2,  // right
    frustumSize / 2,           // top
    frustumSize / -2,          // bottom
    1,                         // near
    2000                       // far
);
camera.position.set(0, 0, 1000); // Positioned far back, looking along -Z
camera.lookAt(scene.position); // Look at the center

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; // For better color representation

// --- Info Box Container ---
// We'll manage the info box directly in the DOM now
const infoBoxContainer = document.createElement('div');
infoBoxContainer.id = 'infoBoxContainer';
infoBoxContainer.style.position = 'absolute';
infoBoxContainer.style.top = '0';
infoBoxContainer.style.left = '0';
infoBoxContainer.style.width = '100%';
infoBoxContainer.style.height = '100%';
infoBoxContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas initially
document.body.appendChild(infoBoxContainer);
let currentInfoBox = null; // Reference to the currently displayed info box element

// =============================================================================
// Controls (Adjusted for 2D)
// =============================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.screenSpacePanning = true; // Allow panning
controls.enableRotate = false; // Disable rotation for 2D
controls.enableZoom = true;
controls.minZoom = 0.5; // Adjust zoom limits as needed
controls.maxZoom = 4;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN, // Pan with left click
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: null // Disable right-click context menu/rotate
};
controls.touches = {
	ONE: THREE.TOUCH.PAN, // Pan with one finger
	TWO: THREE.TOUCH.DOLLY_PAN // Zoom/Pan with two fingers
};

// =============================================================================
// Lighting (Less critical in 2D/unlit materials, but good practice)
// =============================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// =============================================================================
// Background Gradient Plane
// =============================================================================
const bgGradientGeometry = new THREE.PlaneGeometry(2, 2); // Covers the entire viewport

const bgGradientMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 1.0, 1.0); // Position directly in clip space
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform vec3 color1; // Top-left (Blue)
        uniform vec3 color2; // Top-right (Violet)
        uniform vec3 color3; // Bottom-left (Green)
        uniform vec3 color4; // Bottom-right (Orange)
        uniform vec3 centerColor; // Center (Black)

        void main() {
            // Interpolate corners
            vec3 topColor = mix(color1, color2, vUv.x);
            vec3 bottomColor = mix(color3, color4, vUv.x);
            vec3 cornerMixedColor = mix(topColor, bottomColor, vUv.y);

            // Interpolate towards center (using distance from center)
            float dist = distance(vUv, vec2(0.5)); // Distance from center (0 to ~0.7)
            float fade = smoothstep(0.0, 0.6, dist); // Fade factor (0 near center, 1 further out)

            gl_FragColor = vec4(mix(centerColor, cornerMixedColor, fade), 1.0);
        }
    `,
    uniforms: {
        color1: { value: new THREE.Color(0x007bff) }, // Blue
        color2: { value: new THREE.Color(0x8a2be2) }, // Violet
        color3: { value: new THREE.Color(0x28a745) }, // Green
        color4: { value: new THREE.Color(0xfd7e14) }, // Orange
        centerColor: { value: new THREE.Color(0x000000) } // Black
    },
    depthWrite: false, // Render behind everything
    transparent: false
});

const bgGradientMesh = new THREE.Mesh(bgGradientGeometry, bgGradientMaterial);
bgGradientMesh.renderOrder = -1; // Ensure it's drawn first (background)
scene.add(bgGradientMesh);


// =============================================================================
// Star Texture (for round stars)
// =============================================================================
function createStarTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Center white
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); // Slightly faded edge
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');   // Transparent outer edge (glow effect)
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}
const starTexture = createStarTexture();

// =============================================================================
// Procedural Starfield (Round, Pastel, Varied Size, Glow)
// =============================================================================
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
const starColors = [];
const starSizes = [];
const starCount = 500; // More stars for a denser 2D field
const fieldWidth = frustumSize * aspect * 1.5; // Spread wider than view
const fieldHeight = frustumSize * 1.5;

const color = new THREE.Color();

for (let i = 0; i < starCount; i++) {
    // Position (Random within 2D plane)
    const x = (Math.random() - 0.5) * fieldWidth;
    const y = (Math.random() - 0.5) * fieldHeight;
    const z = (Math.random() - 0.5) * 50; // Slight depth variation
    starVertices.push(x, y, z);

    // Color (Pastel - High Lightness, Low-Mid Saturation)
    color.setHSL(
        Math.random(),             // Hue (any color)
        0.3 + Math.random() * 0.3, // Saturation (0.3 - 0.6)
        0.7 + Math.random() * 0.2  // Lightness (0.7 - 0.9)
    );
    starColors.push(color.r, color.g, color.b);

    // Size (More varied range)
    starSizes.push(0.5 + Math.random() * 2.5); // Random size between 0.5 and 3.0
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    size: 1, // Base size, will be modified by attribute
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending, // Glow effect
    depthWrite: false,
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// (Dust field removed for simplicity in 2D, can be added back if needed)

// =============================================================================
// Points of Interest (POIs) - Static Positions, Varied Size, Rings, Glow
// =============================================================================
const poiData = [ // Static POI data
    { id: 'poi_0', name: 'Solara Prime', description: 'Homeworld of the Lumina civilization. Rich in history.', link: '#', position: new THREE.Vector3(-50, 20, 0), color: '#ffcc66' },
    { id: 'poi_1', name: 'Nebula Cluster X-7', description: 'Dense gas cloud, site of recent stellar nursery discovery.', link: '#', position: new THREE.Vector3(-10, -30, 0), color: '#99ccff' },
    { id: 'poi_2', name: 'K\'tharr Nebula', description: 'Ancient battleground, remnants of a forgotten war.', link: '#', position: new THREE.Vector3(40, 0, 0), color: '#ff9999' },
    { id: 'poi_3', name: 'Orion Spur Relay', description: 'Major trade hub connecting several sectors.', link: '#', position: new THREE.Vector3(70, 35, 0), color: '#ccff99' },
    { id: 'poi_4', name: 'Void Anomaly 3B', description: 'Unstable region, travel advised with caution.', link: '#', position: new THREE.Vector3(20, -50, 0), color: '#cccccc' },
];

const poiObjects = []; // Store mesh objects for raycasting
const poiGroup = new THREE.Group(); // Group POIs for easier management
scene.add(poiGroup);

const poiBaseGeometry = new THREE.SphereGeometry(1, 16, 16); // Base geometry, size scaled per POI

poiData.forEach((data, i) => {
    const poiColor = new THREE.Color(data.color);
    const poiSize = 1.5 + Math.random() * 1.5; // Varied size (1.5 to 3.0)

    const poiMaterial = new THREE.MeshBasicMaterial({
        color: poiColor,
        transparent: true,
        opacity: 0.9,
        // Add glow using emissive properties (requires MeshStandardMaterial or similar if using lights)
        // For MeshBasicMaterial, glow is better achieved via texture or post-processing
        // Let's simulate glow with AdditiveBlending on the ring for now
    });
    // If using lights, switch to MeshStandardMaterial:
    // const poiMaterial = new THREE.MeshStandardMaterial({
    //     color: poiColor,
    //     emissive: poiColor,
    //     emissiveIntensity: 0.6,
    //     metalness: 0.1,
    //     roughness: 0.5,
    // });

    const poiMesh = new THREE.Mesh(poiBaseGeometry, poiMaterial);
    poiMesh.position.copy(data.position);
    poiMesh.scale.setScalar(poiSize);
    poiMesh.userData = data; // Link data back to the mesh
    data.object = poiMesh; // Link mesh to data

    // --- POI Ring ---
    const ringRadius = poiSize * 1.8; // Ring slightly larger than POI
    const ringGeometry = new THREE.RingGeometry(ringRadius * 0.95, ringRadius, 32); // Thin ring
    // Dashed Line Material for the ring
    const ringMaterial = new THREE.LineDashedMaterial({
        color: poiColor,
        linewidth: 1, // Note: May not be consistent across platforms
        scale: 1,
        dashSize: 0.7, // Length of dashes
        gapSize: 0.3,  // Length of gaps
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending, // Make ring glowy
        depthWrite: false,
    });

    // Need to create a LineLoop for dashed material
    const points = [];
    const divisions = 64;
    for (let j = 0; j <= divisions; j++) {
        const angle = (j / divisions) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0));
    }
    const ringLineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const poiRing = new THREE.LineLoop(ringLineGeometry, ringMaterial);
    poiRing.computeLineDistances(); // Important for dashed lines
    poiRing.position.copy(data.position); // Position ring with POI
    poiRing.rotation.z = Math.random() * Math.PI; // Random start rotation

    poiGroup.add(poiMesh);
    poiGroup.add(poiRing);
    poiObjects.push(poiMesh); // Add main mesh for clicking/hovering
});


// =============================================================================
// Route Between POIs (Gradient Line)
// =============================================================================
function createGradientRoute(points, colors) {
    const routeGroup = new THREE.Group();
    const segmentWidth = 0.3; // Width of the line segment

    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i+1];
        const startColor = new THREE.Color(colors[i]);
        const endColor = new THREE.Color(colors[i+1]);

        const segmentLength = startPoint.distanceTo(endPoint);
        const segmentGeometry = new THREE.PlaneGeometry(segmentLength, segmentWidth);

        // Add vertex colors
        const colorAttribute = new THREE.Float32BufferAttribute([
            startColor.r, startColor.g, startColor.b, // Bottom left
            endColor.r, endColor.g, endColor.b,     // Bottom right
            startColor.r, startColor.g, startColor.b, // Top left
            endColor.r, endColor.g, endColor.b      // Top right
        ], 3);
        segmentGeometry.setAttribute('color', colorAttribute);

        const segmentMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const segmentMesh = new THREE.Mesh(segmentGeometry, segmentMaterial);

        // Position and orient the segment
        segmentMesh.position.copy(startPoint).lerp(endPoint, 0.5); // Center the mesh
        segmentMesh.lookAt(endPoint); // Point towards the next POI
        // Adjust rotation because lookAt aims the Z axis; Plane is XY
        segmentMesh.rotateX(Math.PI / 2); // Rotate plane to face camera initially
        segmentMesh.rotateY(Math.PI / 2); // Align width along the segment direction


        routeGroup.add(segmentMesh);
    }
    return routeGroup;
}

const routePoints = poiData.map(data => data.position);
const routeColors = poiData.map(data => data.color);
const routeLine = createGradientRoute(routePoints, routeColors);
scene.add(routeLine);


// =============================================================================
// Interaction Logic (Raycasting, Click Handling, Info Box)
// =============================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPOI = null; // Keep track of the clicked POI

function updateMouseCoords(event) {
    // Adjust for canvas position if it's not full screen or has offsets
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function checkIntersections() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(poiObjects); // Check only POI meshes

    if (intersects.length > 0) {
        // Simple hover effect (e.g., change cursor)
        document.body.style.cursor = 'pointer';
        return intersects[0].object; // Return the intersected POI mesh
    } else {
        document.body.style.cursor = 'default';
        return null;
    }
}

function showInfoBox(poiMesh) {
    if (currentInfoBox) {
        hideInfoBox(); // Hide previous one immediately or animate out
    }
    if (!poiMesh || !poiMesh.userData) return;

    selectedPOI = poiMesh; // Store selected POI
    const data = poiMesh.userData;

    // --- Create Info Box Element ---
    const div = document.createElement('div');
    div.className = 'info-box';
    // Apply styles directly for simplicity, or use CSS classes
    div.style.position = 'absolute';
    div.style.transformOrigin = '0% 50%'; // Grow from left center
    div.style.transform = 'scaleX(0)'; // Start collapsed horizontally
    div.style.opacity = '0';
    div.style.backgroundColor = 'rgba(10, 10, 20, 0.85)'; // Dark background
    // Subtle gradient inside the box
    div.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.05))';
    div.style.borderLeft = `4px solid ${data.color}`;
    div.style.color = '#eee';
    div.style.padding = '15px 20px';
    div.style.borderRadius = '0 5px 5px 0'; // Rounded corners on the right
    div.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    div.style.fontSize = '14px';
    div.style.pointerEvents = 'auto'; // Allow interaction within the box
    div.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s linear 0.1s'; // Grow fast, fade in slightly delayed
    div.style.width = '250px'; // Fixed width, adjust as needed
    div.style.boxShadow = '5px 5px 15px rgba(0,0,0,0.4)';
    div.style.backdropFilter = 'blur(3px)'; // Optional blur effect

    // --- Static Content ---
    div.innerHTML = `
        <h3 style="color: ${data.color}; margin-top: 0; margin-bottom: 10px; font-size: 1.2em;">${data.name}</h3>
        <p style="margin-bottom: 15px; line-height: 1.5;">${data.description}</p>
        <a href="${data.link}" target="_blank" style="color: #aaaaff; text-decoration: none; border: 1px solid #aaaaff; padding: 5px 10px; border-radius: 3px; transition: background-color 0.2s, color 0.2s;"
           onmouseover="this.style.backgroundColor='#aaaaff'; this.style.color='#111';"
           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#aaaaff';">
           Learn More
        </a>
        <button class="close-button" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #aaa; font-size: 18px; cursor: pointer; padding: 5px;">&times;</button>
    `;

    // --- Position the Box ---
    // Project POI position to screen coordinates
    const screenPos = poiMesh.position.clone().project(camera);
    // Convert normalized device coordinates (-1 to +1) to pixel coordinates
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    // Position slightly to the right of the POI
    div.style.left = `${x + 20}px`; // Offset to the right
    div.style.top = `${y}px`;
    // Adjust vertical position based on box height (calculated after adding content)
    // We'll do this after appending, but set initial transform based on center

    infoBoxContainer.appendChild(div);
    currentInfoBox = div;

    // Calculate height and adjust vertical position for center alignment
    const boxHeight = div.offsetHeight;
    div.style.top = `${y - boxHeight / 2}px`; // Center vertically

    // Add close button listener
    div.querySelector('.close-button').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering canvas click
        hideInfoBox();
    });

    // --- Trigger Animation ---
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { // Double requestAnimationFrame ensures styles are applied before transition starts
            div.style.transform = 'scaleX(1)';
            div.style.opacity = '1';
        });
    });
}

function hideInfoBox() {
    if (currentInfoBox) {
        const boxToRemove = currentInfoBox;
        boxToRemove.style.transform = 'scaleX(0)';
        boxToRemove.style.opacity = '0';
        // Remove after transition
        setTimeout(() => {
            if (infoBoxContainer.contains(boxToRemove)) {
                infoBoxContainer.removeChild(boxToRemove);
            }
            // Only nullify if this was indeed the box we intended to remove
            if (currentInfoBox === boxToRemove) {
                currentInfoBox = null;
                selectedPOI = null; // Clear selection when box is hidden
            }
        }, 400); // Match transition duration
    }
}

function centerCameraOnPOI(poiMesh, duration = 800) {
    const targetPosition = poiMesh.position;

    // Target for OrbitControls (center of view)
    const controlsTarget = new THREE.Vector3(targetPosition.x, targetPosition.y, 0);

    // Target for Camera position (maintain Z distance)
    const cameraTargetPos = new THREE.Vector3(targetPosition.x, targetPosition.y, camera.position.z);

    // Animate Controls Target
    new TWEEN.Tween(controls.target)
        .to({ x: controlsTarget.x, y: controlsTarget.y, z: controlsTarget.z }, duration)
        .easing(TWEEN.Easing.Quadratic.Out) // Use a smooth easing function
        .start();

    // Animate Camera Position
    new TWEEN.Tween(camera.position)
        .to({ x: cameraTargetPos.x, y: cameraTargetPos.y, z: cameraTargetPos.z }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            // No need to call camera.lookAt during tween if controls.target is also tweening
        })
        .onComplete(() => {
            // Ensure controls are updated after tween completes
            controls.update();
            // Show info box AFTER camera move is complete
            showInfoBox(poiMesh);
        })
        .start();
}


function onCanvasClick(event) {
    updateMouseCoords(event);
    const intersectedPOI = checkIntersections();

    if (intersectedPOI) {
        if (selectedPOI !== intersectedPOI) {
             // Hide existing box immediately before starting camera move
            if (currentInfoBox) hideInfoBox();
            centerCameraOnPOI(intersectedPOI);
        }
        // If clicking the already selected POI, maybe do nothing or re-center?
    } else {
        // Clicked on empty space, hide the info box if it's open
        if (currentInfoBox && !event.target.closest('.info-box')) { // Check if click was outside the box
             hideInfoBox();
        }
    }
}

function onCanvasMouseMove(event) {
     updateMouseCoords(event);
     checkIntersections(); // Just update cursor for hover
}

renderer.domElement.addEventListener('click', onCanvasClick, false);
renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);


// =============================================================================
// Window Resize Handler
// =============================================================================
function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    // No labelRenderer to resize
}
window.addEventListener('resize', onWindowResize, false);

// =============================================================================
// Animation Loop
// =============================================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    TWEEN.update(); // Update animations
    controls.update(); // Update controls (for damping)

    // --- Animate POI Rings ---
    poiGroup.children.forEach(child => {
        if (child instanceof THREE.LineLoop) { // Identify rings
            child.rotation.z += delta * 0.5; // Slow rotation
            child.material.opacity = 0.6 + Math.sin(elapsedTime * 2 + child.position.x) * 0.2; // Subtle pulse
            child.material.needsUpdate = true; // Needed if material props change
        }
    });

    // --- Render Scene ---
    renderer.render(scene, camera);
    // No labelRenderer.render needed
}

// Start animation
animate();

// Add basic CSS for the info box (can be moved to a separate CSS file)
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
body { margin: 0; overflow: hidden; background-color: #000; }
canvas#bg { display: block; }
#infoBoxContainer { z-index: 10; } /* Ensure container is above canvas */
.info-box a:hover { background-color: #aaaaff; color: #111; }
.info-box .close-button:hover { color: #fff; }
`;
document.head.appendChild(styleSheet);

// Ensure TWEEN is available (e.g., via import map or bundle)
// If using import maps in index.html:
/*
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.163.0/build/three.module.js",
      "three/examples/jsm/": "https://unpkg.com/three@0.163.0/examples/jsm/",
      "@tweenjs/tween.js": "https://unpkg.com/@tweenjs/tween.js@^21/dist/tween.esm.js"
    }
  }
</script>
*/
