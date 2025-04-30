// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'; // Only import, don't use for header/footer
import { pois, STAR_COUNT, SCROLL_DAMPING, MAX_SCROLL_SPEED } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox } from './interaction.js'; // Import currentInfoBox

// --- Add header/footer as HTML elements outside the canvas ---
const appContainer = document.getElementById('app-container');

// Create header
const headerElement = document.createElement('div');
headerElement.className = 'app-header';
headerElement.innerHTML = '<h1>Editable Header Title</h1>';
appContainer.insertBefore(headerElement, appContainer.firstChild);

// Create footer
const footerElement = document.createElement('div');
footerElement.className = 'app-footer';
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
appContainer.appendChild(footerElement);

// --- CSS3DRenderer only for future overlays, not header/footer ---
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '5';
appContainer.appendChild(cssRenderer.domElement);

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

// --- Fix scroll clamping: clamp camera based on POI positions, not header/footer ---
const yPositions = pois.map(p => p.position.y);
const maxY = Math.max(...yPositions);
const minY = Math.min(...yPositions);
const paddingY = 5; // For some margin

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
    // Clamp camera based on POI positions, not header/footer
    const cameraViewHeight = camera.top - camera.bottom;
    const clampMinY = minY + cameraViewHeight / 2 - paddingY;
    const clampMaxY = maxY - cameraViewHeight / 2 + paddingY;
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
