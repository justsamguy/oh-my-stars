// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'; // Import CSS3D modules
import { pois, STAR_COUNT, SCROLL_DAMPING, MAX_SCROLL_SPEED } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox } from './interaction.js'; // Import currentInfoBox

// --- CSS3D Renderer Setup ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight); // Initial size
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
cssRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas by default
cssRenderer.domElement.style.zIndex = '5'; // Ensure it's above the WebGL canvas but potentially below UI elements if needed
document.getElementById('app-container').appendChild(cssRenderer.domElement);

// --- Create Header/Footer HTML Elements ---
const headerElement = document.createElement('div');
headerElement.className = 'css3d-element css3d-header';
headerElement.innerHTML = '<h1>Editable Header Title</h1>';
headerElement.style.pointerEvents = 'auto'; // Allow interaction with header if needed

const footerElement = document.createElement('div');
footerElement.className = 'css3d-element css3d-footer';
footerElement.innerHTML = `
    <nav>
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
        <a href="#">Link 3</a>
        <a href="#">Link 4</a>
        <a href="#">Link 5</a>
    </nav>
    <p>&copy; S&A 2025</p>
`;
// Ensure links within the footer are clickable
footerElement.querySelectorAll('a').forEach(a => a.style.pointerEvents = 'auto');
footerElement.style.pointerEvents = 'auto'; // Allow interaction with footer background if needed


// --- Create CSS3DObjects ---
const headerObject = new CSS3DObject(headerElement);
const footerObject = new CSS3DObject(footerElement);

// --- Position Header/Footer in 3D Space ---
// Find min/max Y from POIs to position header above max and footer below min
const yPositions = pois.map(p => p.position.y);
const maxY = Math.max(...yPositions);
const minY = Math.min(...yPositions);
const paddingY = 5; // Adjust as needed for spacing

headerObject.position.set(0, maxY + paddingY, 0); // Center X, Above highest POI
footerObject.position.set(0, minY - paddingY, 0); // Center X, Below lowest POI

scene.add(headerObject);
scene.add(footerObject);

// Create stars
const starsGroup = createAllStars(STAR_COUNT, pois, viewportWidth, viewportHeight);
scene.add(starsGroup);

// Create POIs
const poiObjects = createAllPOIs(pois, scene);

// Create connecting lines
const linesGroup = createConnectingLines(pois);
scene.add(linesGroup);

// Set up event handlers
setupMouseMoveHandler(poiObjects);
setupScrollHandler();
setupResizeHandler(onWindowResize);
setupClickHandler(poiObjects);

// Animation loop
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const elapsed = (now - lastTime) / 1000;
    lastTime = now;
    // Camera scroll
    // Clamp scrollVelocity before applying
    if (scrollState.velocity > MAX_SCROLL_SPEED) scrollState.velocity = MAX_SCROLL_SPEED;
    if (scrollState.velocity < -MAX_SCROLL_SPEED) scrollState.velocity = -MAX_SCROLL_SPEED;
    if (Math.abs(scrollState.velocity) > 0.001) {
        camera.position.y += scrollState.velocity;
        scrollState.velocity *= SCROLL_DAMPING;
    }
    // Clamp camera based on Header/Footer positions
    const cameraViewHeight = camera.top - camera.bottom;
    const clampMinY = footerObject.position.y + cameraViewHeight / 2; // Stop when bottom edge reaches footer center
    const clampMaxY = headerObject.position.y - cameraViewHeight / 2; // Stop when top edge reaches header center
    camera.position.y = Math.max(clampMinY, Math.min(clampMaxY, camera.position.y));

    // No need to update projection matrix here unless zoom changes
    // camera.updateProjectionMatrix();

    // Update stars
    updateStars(starsGroup, now * 0.001, camera.position.y, mouseWorldPosition);
    // Update POIs
    updatePOIs(poiObjects, now * 0.001, raycaster);

    // Update info box position if open
    if (currentInfoBox && currentInfoBox.dataset.poiPositionX !== undefined) {
        const poiPosition = new THREE.Vector3(
            parseFloat(currentInfoBox.dataset.poiPositionX),
            parseFloat(currentInfoBox.dataset.poiPositionY),
            parseFloat(currentInfoBox.dataset.poiPositionZ)
        );
        const pos = poiPosition.clone();
        pos.project(camera); // Project using the current camera state

        // Use canvas dimensions for screen coordinate calculation
        const canvasRect = canvas.getBoundingClientRect(); // Get canvas position and size
        const screenX = (pos.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left + 20; // Add canvas left offset
        const screenY = (-pos.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top - 20; // Add canvas top offset

        currentInfoBox.style.left = `${screenX}px`;
        currentInfoBox.style.top = `${screenY}px`;
    }

    // Render
    renderer.render(scene, camera); // Render WebGL scene
    cssRenderer.render(scene, camera); // Render CSS3D scene (overlays WebGL)
}

// Get the canvas element
const canvas = document.getElementById('bg');

function onWindowResize() {
    // Use canvas dimensions, not window dimensions
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Recalculate viewport dimensions based on canvas size if needed
    // Assuming getViewportHeight/Width are related to camera's view,
    // they might not need direct change unless the desired view scale changes.
    // If they ARE tied to pixel dimensions, they would need adjustment.
    // For now, let's focus on aspect ratio and renderer size.
    // const newViewportHeight = getViewportHeight(); // Re-evaluate if needed
    // const newViewportWidth = getViewportWidth(); // Re-evaluate if needed

    const aspect = canvasWidth / canvasHeight;

    // Adjust camera frustum based on new aspect ratio
    // We need to decide whether to adjust width or height bounds.
    // Adjusting width based on fixed height is common:
    const currentViewportHeight = camera.top - camera.bottom; // Get current ortho height
    camera.left = currentViewportHeight * aspect / -2;
    camera.right = currentViewportHeight * aspect / 2;
    // camera.top remains camera.top
    // camera.bottom remains camera.bottom
    // OR adjust height based on fixed width:
    // const currentViewportWidth = camera.right - camera.left;
    // camera.top = currentViewportWidth / aspect / 2;
    // camera.bottom = currentViewportWidth / aspect / -2;

    camera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight); // Resize WebGL renderer
    cssRenderer.setSize(canvasWidth, canvasHeight); // Resize CSS3D renderer
}

// Initial call to set size correctly
onWindowResize();

animate();
