import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.module.min.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.134/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.jsdelivr.net/npm/three@0.134/examples/jsm/renderers/CSS2DRenderer.js';

// =============================================================================
// Scene Setup
// =============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005); // Dark space background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 20, 100); // Positioned to view the scene

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'), // Assumes canvas with id="bg" exists in HTML
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// CSS2D Renderer for Tooltips
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through
document.body.appendChild(labelRenderer.domElement);

// =============================================================================
// Controls
// =============================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 500;

// =============================================================================
// Lighting (Subtle ambient light)
// =============================================================================
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
scene.add(ambientLight);
// const pointLight = new THREE.PointLight(0xffffff, 0.8);
// camera.add(pointLight); // Attach light to camera if needed
// scene.add(camera);

// =============================================================================
// Procedural Starfield
// =============================================================================
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
const starColors = [];
const starSizes = [];
const starCount = 200;
const galaxyRadius = 300;
const galaxyThickness = 50;

const color = new THREE.Color();

for (let i = 0; i < starCount; i++) {
    // Position (cylindrical distribution, denser towards center)
    const radius = Math.random() * galaxyRadius;
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = (Math.random() - 0.5) * galaxyThickness * (1 - radius / galaxyRadius); // Thinner at edges
    const z = radius * Math.sin(angle);
    starVertices.push(x, y, z);

    // Color (mostly white, some blues/yellows)
    color.setHSL(Math.random() * 0.1 + 0.6, 0.8, Math.random() * 0.4 + 0.6); // HSL: Blueish to Yellowish whites
    starColors.push(color.r, color.g, color.b);

    // Size
    starSizes.push(Math.random() * 2 + 1); // Random size between 1 and 3
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

const starMaterial = new THREE.PointsMaterial({
    size: 1, // Base size, will be modified by attribute
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending, // Brighter where stars overlap
    depthWrite: false, // Prevent stars obscuring each other unnaturally
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// =============================================================================
// Procedural Background Dust (Jittering Clusters)
// =============================================================================
const dustGeometry = new THREE.BufferGeometry();
const dustVertices = [];
const dustCount = 5000;
const dustClusterRadius = 150;
const dustSpread = 600; // Spread further than stars

// Store original positions for jitter calculation
const dustOriginalPositions = [];

for (let i = 0; i < dustCount; i++) {
    // Create clusters
    const clusterCenterX = (Math.random() - 0.5) * dustSpread;
    const clusterCenterY = (Math.random() - 0.5) * dustSpread / 2; // Flatter distribution
    const clusterCenterZ = (Math.random() - 0.5) * dustSpread;

    const x = clusterCenterX + (Math.random() - 0.5) * dustClusterRadius;
    const y = clusterCenterY + (Math.random() - 0.5) * dustClusterRadius / 2;
    const z = clusterCenterZ + (Math.random() - 0.5) * dustClusterRadius;

    dustVertices.push(x, y, z);
    dustOriginalPositions.push(x, y, z); // Store original position
}

dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustVertices, 3));

const dustMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});

const dustField = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustField);

// =============================================================================
// Points of Interest (POIs)
// =============================================================================
const poiCount = 10;
const poiData = []; // Store data for tooltips
const poiObjects = []; // Store mesh objects for raycasting
const routePoints = []; // Store Vector3 for the route line

const poiGeometry = new THREE.SphereGeometry(2, 16, 16); // Slightly larger sphere

for (let i = 0; i < poiCount; i++) {
    const poiColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.6); // Random distinct color

    // Position POIs within the starfield bounds but ensure they are reachable
    const radius = Math.random() * (galaxyRadius * 0.8); // Keep within 80% of star radius
    const angle = (i / poiCount) * Math.PI * 2 + Math.random() * 0.5 - 0.25; // Spread them out somewhat evenly
    const x = radius * Math.cos(angle);
    const y = (Math.random() - 0.5) * (galaxyThickness * 0.5); // Keep within center vertically
    const z = radius * Math.sin(angle);

    const poiMaterial = new THREE.MeshBasicMaterial({
        color: poiColor,
        // emissive: poiColor, // Make them glow slightly
        // emissiveIntensity: 0.5
    });

    const poiMesh = new THREE.Mesh(poiGeometry, poiMaterial);
    poiMesh.position.set(x, y, z);

    // Store data associated with this POI
    const timestamp = new Date(Date.now() - Math.random() * 1e11).toISOString().slice(0, 19).replace('T', ' ');
    const data = {
        id: `poi_${i}`,
        name: `System Alpha-${i + 1}`,
        timestamp: timestamp,
        description: `Discovered on ${timestamp.substring(0, 10)}. Contains ${Math.floor(Math.random() * 5) + 1} potentially habitable worlds.`,
        link: '#', // Placeholder link
        color: `#${poiColor.getHexString()}`, // Store hex color for CSS
        object: poiMesh, // Reference to the mesh
    };
    poiData.push(data);
    poiMesh.userData = data; // Link data back to the mesh for raycasting

    scene.add(poiMesh);
    poiObjects.push(poiMesh);
    routePoints.push(poiMesh.position); // Add position to route
}

// =============================================================================
// Route Between POIs
// =============================================================================
const routeGeometry = new THREE.BufferGeometry().setFromPoints(routePoints);
const routeMaterial = new THREE.LineBasicMaterial({
    color: 0x8888ff, // A distinct route color
    linewidth: 2, // Note: linewidth > 1 may not work on all platforms/drivers
    // For thicker lines reliably, consider THREE.MeshLine or tube geometry
});
const routeLine = new THREE.Line(routeGeometry, routeMaterial);
scene.add(routeLine);


// =============================================================================
// Hover Tooltip Logic
// =============================================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let intersectedObject = null;
let currentTooltip = null;

function createTooltipElement(data) {
    const div = document.createElement('div');
    div.className = 'tooltip';
    div.style.position = 'absolute'; // Needed for CSS2DObject positioning
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    div.style.border = `2px solid ${data.color}`;
    div.style.color = 'white';
    div.style.padding = '8px 12px';
    div.style.borderRadius = '4px';
    div.style.fontFamily = 'sans-serif';
    div.style.fontSize = '12px';
    div.style.pointerEvents = 'none'; // Important!
    div.style.transformOrigin = 'bottom left'; // Animation origin
    div.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
    div.style.transform = 'scale(0)'; // Start hidden
    div.style.opacity = '0';

    div.innerHTML = `
        <strong style="color: ${data.color}; display: block; margin-bottom: 4px;">${data.name}</strong>
        Timestamp: ${data.timestamp}<br>
        Description: ${data.description}<br>
        <a href="${data.link}" target="_blank" style="color: #aaaaff; text-decoration: underline; pointer-events: auto;">More Info</a>
    `;
    return div;
}

function showTooltip(poi) {
    if (currentTooltip) {
        hideTooltip(); // Hide previous one if any
    }

    const tooltipElement = createTooltipElement(poi.userData);
    currentTooltip = new CSS2DObject(tooltipElement);
    currentTooltip.position.copy(poi.position); // Position at the POI
    scene.add(currentTooltip); // Add to the scene (CSS2DObjects are handled by labelRenderer)

    // Trigger the animation
    requestAnimationFrame(() => {
        tooltipElement.style.transform = 'scale(1)';
        tooltipElement.style.opacity = '1';
    });
}

function hideTooltip() {
    if (currentTooltip) {
        const element = currentTooltip.element;
        element.style.transform = 'scale(0)';
        element.style.opacity = '0';

        // Remove after transition
        setTimeout(() => {
            if (currentTooltip && currentTooltip.element === element) { // Check if it's still the same tooltip
                 scene.remove(currentTooltip);
                 currentTooltip = null;
            }
        }, 200); // Match transition duration
    }
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    // Set threshold for Points, adjust as needed for Spheres
    raycaster.params.Points.threshold = 0.5; // Might need adjustment for stars/dust if they were interactive
    raycaster.params.Line.threshold = 0.5; // If lines were interactive

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(poiObjects); // Only check POIs

    if (intersects.length > 0) {
        // If hovering over a new POI
        if (intersectedObject !== intersects[0].object) {
            // Hide previous tooltip if any
            if (intersectedObject) {
                 hideTooltip();
            }
            intersectedObject = intersects[0].object;
            showTooltip(intersectedObject);
        }
    } else {
        // If mouse moved off a POI
        if (intersectedObject) {
            hideTooltip();
            intersectedObject = null;
        }
    }
}

window.addEventListener('mousemove', onMouseMove, false);


// =============================================================================
// Window Resize Handler
// =============================================================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight); // Update label renderer size too
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

    controls.update(); // Only required if controls.enableDamping = true

    // --- Animate Dust Jitter ---
    const dustPositions = dustGeometry.attributes.position.array;
    const jitterSpeed = 0.5;
    const jitterAmount = 0.1;
    for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        // Use original position + sine wave based on time and original position for variation
        const offsetX = Math.sin(elapsedTime * jitterSpeed + dustOriginalPositions[i3] * 0.1) * jitterAmount;
        const offsetY = Math.cos(elapsedTime * jitterSpeed * 0.8 + dustOriginalPositions[i3 + 1] * 0.1) * jitterAmount;
        const offsetZ = Math.sin(elapsedTime * jitterSpeed * 1.2 + dustOriginalPositions[i3 + 2] * 0.1) * jitterAmount;

        dustPositions[i3] = dustOriginalPositions[i3] + offsetX;
        dustPositions[i3 + 1] = dustOriginalPositions[i3 + 1] + offsetY;
        dustPositions[i3 + 2] = dustOriginalPositions[i3 + 2] + offsetZ;
    }
    dustGeometry.attributes.position.needsUpdate = true; // Important!

    // --- Render Scene ---
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels/tooltips
}

// Start animation
animate();
