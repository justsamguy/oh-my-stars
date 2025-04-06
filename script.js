import * as THREE from 'three';
// OrbitControls removed, implementing custom vertical scroll/drag
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js'; // For smooth camera animation
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'; // For background noise

// =============================================================================
// Scene Setup (Vertical Scroll Focus)
// =============================================================================
const scene = new THREE.Scene();
const simplex = new SimplexNoise();

// --- Orthographic Camera for Vertical Scroll ---
let aspect = window.innerWidth / window.innerHeight;
// Define total vertical content height (adjust based on POI spread)
const totalContentHeight = 600; // Example: Larger than initial view
const frustumHeight = 150; // The visible portion height
let frustumWidth = frustumHeight * aspect;
let fieldWidth = frustumHeight * aspect * 1.5; // Spread wider than view
let fieldHeight = frustumHeight * 1.5;

const camera = new THREE.OrthographicCamera(
    frustumWidth / -2, // left
    frustumWidth / 2,  // right
    frustumHeight / 2, // top
    frustumHeight / -2, // bottom
    1,                 // near
    2000               // far
);
// Start camera at the top of the content
camera.position.set(0, totalContentHeight / 2 - frustumHeight / 2, 1000);
camera.lookAt(0, camera.position.y, 0); // Look straight ahead at the current Y level

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'), // Ensure canvas ID is 'bg' in HTML
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
// Custom Vertical Scroll/Drag Controls
// =============================================================================
let isDragging = false;
let previousMouseY = 0;
const dragSensitivity = 0.5; // Adjust sensitivity
const minY = -totalContentHeight / 2 + frustumHeight / 2; // Bottom limit
const maxY = totalContentHeight / 2 - frustumHeight / 2; // Top limit

function onMouseDown(event) {
    isDragging = true;
    previousMouseY = event.clientY;
    renderer.domElement.style.cursor = 'grabbing';
}

function onMouseUp(event) {
    isDragging = false;
    renderer.domElement.style.cursor = 'grab';
}

function onMouseMove(event) {
    if (!isDragging) return;
    const deltaY = event.clientY - previousMouseY;
    previousMouseY = event.clientY;

    // Move camera vertically (inverted direction for natural drag)
    camera.position.y -= deltaY * dragSensitivity;
    // Clamp camera position
    camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));
    camera.lookAt(0, camera.position.y, 0); // Keep looking straight
    // No need for controls.update()
}

function onWheel(event) {
    const deltaY = event.deltaY;
    camera.position.y += deltaY * 0.1; // Adjust scroll speed
    // Clamp camera position
    camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));
    camera.lookAt(0, camera.position.y, 0);
}

renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mouseleave', onMouseUp); // Stop dragging if mouse leaves canvas
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('wheel', onWheel);
renderer.domElement.style.cursor = 'grab'; // Initial cursor


// =============================================================================
// Lighting (Still useful for potential future materials)
// =============================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Dimmer ambient
scene.add(ambientLight);
// Optional: Add a subtle directional light if needed later
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
// directionalLight.position.set(0, 1, 1);
// scene.add(directionalLight);

// =============================================================================
// Background Space Noise Plane
// =============================================================================
const bgPlaneGeometry = new THREE.PlaneGeometry(2, 2); // Covers viewport

const bgNoiseMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 1.0, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColorOrange;
        uniform vec3 uColorBlue;
        uniform vec3 uColorGreen;
        uniform vec3 uColorPurple;
        uniform sampler2D uNoiseTexture; // Using simplex noise function directly now

        // Simplex noise function (requires importing SimplexNoise class in JS)
        // This is a placeholder; noise generation happens in JS and passed via uniform/texture
        // Or implement a GLSL noise function here if preferred

        // Function to generate Simplex noise value (requires passing noise function via JS)
        // We'll use a simpler approach: JS calculates noise and passes colors

        // Using precomputed noise function from Three.js examples (SimplexNoise)
        // We need to pass the noise value or use a noise texture.
        // Let's try calculating noise directly in the shader for simplicity here.

        // 2D Random function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        // 2D Noise function (Value Noise)
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep curve
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        // Fractional Brownian Motion (fBm)
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0; // Not used in this simple version

            // Loop for multiple octaves of noise
            for (int i = 0; i < 4; i++) { // 4 octaves
                value += amplitude * noise(st);
                st *= 2.0; // Double frequency
                amplitude *= 0.5; // Halve amplitude
            }
            return value;
        }


        void main() {
            vec2 scaledUv = vUv * 5.0; // Scale UVs to get smaller noise patterns
            float noiseValue = fbm(scaledUv + uTime * 0.05); // Add slow time evolution

            // Create color clusters based on noise thresholds
            vec3 finalColor = vec3(0.01, 0.0, 0.02); // Very dark base (almost black)

            float cluster1 = smoothstep(0.35, 0.4, noiseValue);
            finalColor = mix(finalColor, uColorOrange * 0.3, cluster1); // Dark Orange

            float cluster2 = smoothstep(0.45, 0.5, noiseValue);
            finalColor = mix(finalColor, uColorBlue * 0.3, cluster2); // Dark Blue

            float cluster3 = smoothstep(0.55, 0.6, noiseValue);
            finalColor = mix((finalColor, uColorGreen * 0.3, cluster3); // Dark Green

            float cluster4 = smoothstep(0.65, 0.7, noiseValue);
            finalColor = mix(finalColor, uColorPurple * 0.3, cluster4); // Dark Purple

            // Fade edges into black (optional, base color is already dark)
            float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) *
                             smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
            // finalColor *= edgeFade; // Uncomment for vignette effect

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    uniforms: {
        uTime: { value: 0.0 },
        uColorOrange: { value: new THREE.Color(0x8B4513) }, // Dark Orange (SaddleBrown)
        uColorBlue:   { value: new THREE.Color(0x00008B) }, // Dark Blue
        uColorGreen:  { value: new THREE.Color(0x006400) }, // Dark Green
        uColorPurple: { value: new THREE.Color(0x4B0082) }  // Indigo (Dark Purple)
    },
    depthWrite: false,
    transparent: false
});

const bgNoiseMesh = new THREE.Mesh(bgPlaneGeometry, bgNoiseMaterial);
bgNoiseMesh.renderOrder = -10; // Ensure it's drawn first (background)
scene.add(bgNoiseMesh);


// =============================================================================
// Star Texture (Shared by all stars)
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
    { id: 'poi_5', name: 'Solara Prime', description: 'Homeworld of the Lumina civilization. Rich in history.', link: '#', position: new THREE.Vector3(-70, 70, 0), color: '#ffcc66' },
    { id: 'poi_6', name: 'Nebula Cluster X-7', description: 'Dense gas cloud, site of recent stellar nursery discovery.', link: '#', position: new THREE.Vector3(-30, -70, 0), color: '#99ccff' },
    { id: 'poi_7', name: 'K\'tharr Nebula', description: 'Ancient battleground, remnants of a forgotten war.', link: '#', position: new THREE.Vector3(60, 10, 0), color: '#ff9999' },
    { id: 'poi_8', name: 'Orion Spur Relay', description: 'Major trade hub connecting several sectors.', link: '#', position: new THREE.Vector3(90, 45, 0), color: '#ccff99' },
    { id: 'poi_9', name: 'Void Anomaly 3B', description: 'Unstable region, travel advised with caution.', link: '#', position: new THREE.Vector3(40, -60, 0), color: '#cccccc' }
];

const poiObjects = []; // Store mesh objects for raycasting
const poiGroup = new THREE.Group(); // Group POIs for easier management
scene.add(poiGroup);

const poiBaseGeometry = new THREE.SphereGeometry(1, 16, 16); // Base geometry, size scaled per POI

    poiData.forEach((data, i) => {
        const poiColor = new THREE.Color(data.color);
    let poiSize = 1.5 + Math.random() * 1.5; // Varied size (1.5 to 3.0)

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
           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#aaaaff';"><br>
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
    const frustumHeight = 150; // The visible portion height
    let frustumWidth = frustumHeight * aspect;
    const fieldWidth = frustumHeight * aspect * 1.5; // Spread wider than view
    const fieldHeight = frustumHeight * 1.5;

    camera.left = frustumWidth / -2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = frustumHeight / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    // No labelRenderer to resize

    // Update star positions on resize
    const starPositions = starGeometry.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * fieldWidth;
        const y = (Math.random() - 0.5) * fieldHeight;
        starPositions[i * 3] = x;
        starPositions[i * 3 + 1] = y;
    }
    starGeometry.attributes.position.needsUpdate = true;
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
body { margin: 0; overflow: hidden; background-color: #000; cursor: grab; }
canvas#bg { display: block; }
#infoBoxContainer { z-index: 10; } /* Ensure container is above canvas */
.info-box a:hover { background-color: #aaaaff; color: #111; }
`
