// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { pois, SCROLL_DAMPING, MAX_SCROLL_SPEED, BASE_STAR_COUNT } from './src/config/config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './src/core/sceneSetup.js';
import { createAllStars, updateStars } from './src/features/stars/stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './src/features/poi/poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox, touchFadeValue } from './src/features/interaction/interaction.js';
import { createHeaderElement, createFooterElement } from './src/config/layoutConfig.js';
import { appState } from './src/core/state.js';
import { events } from './src/core/events.js';
import { logError } from './src/core/logger.js';

// --- CSS3DRenderer only for overlays and header/footer ---
const appContainer = document.getElementById('app-container');
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '5';
appContainer.appendChild(cssRenderer.domElement);

// Create stars
const starsGroup = createAllStars(BASE_STAR_COUNT, pois, viewportWidth, viewportHeight);
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
let yPositions = pois.map(p => p.position.y);
let maxY = Math.max(...yPositions);
let minY = Math.min(...yPositions);
const paddingY = 100; // Increased from 100 to 200 for more scroll range

// Replace header creation with:
const headerDiv = createHeaderElement();
const headerObj = new CSS3DObject(headerDiv);
const headerWorldHeight = 70;
headerObj.position.set(0, maxY + paddingY - headerWorldHeight / 2, 0);
headerObj.rotation.set(0, 0, 0);
scene.add(headerObj);

// Replace footer creation with:
const footerDiv = createFooterElement();
const footerObj = new CSS3DObject(footerDiv);
footerObj.position.set(0, minY - paddingY + 15, 0);
footerObj.rotation.set(0, 0, 0);
scene.add(footerObj);

// Update glow effect handler for both header and footer
const handleGlowEffect = (element, e) => {
    const chars = element.querySelectorAll('.glow-char');
    chars.forEach(char => {
        const rect = char.getBoundingClientRect();
        const charCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        const distance = Math.hypot(
            e.clientX - charCenter.x,
            e.clientY - charCenter.y
        );
        char.classList.toggle('glow', distance < 30);
    });
};

// Add event listeners for glow effects
[headerDiv, footerDiv].forEach(element => {
    element.addEventListener('mousemove', (e) => handleGlowEffect(element, e));
    element.addEventListener('mouseleave', () => {
        element.querySelectorAll('.glow-char').forEach(char => {
            char.classList.remove('glow');
        });
    });
});

// Animation loop
let lastTime = performance.now();
function animate() {
    try {
        requestAnimationFrame(animate);
        const now = performance.now();
        const elapsed = (now - lastTime) / 1000;
        lastTime = now;

        // Update scroll with state
        const velocity = appState.get('scrollVelocity');
        if (Math.abs(velocity) > 0.001) {
            camera.position.y += velocity;
            appState.set('scrollVelocity', velocity * SCROLL_DAMPING);
        }

        // Clamp camera Y position to prevent infinite scrolling
        const minCameraY = minY - paddingY;
        const maxCameraY = maxY + paddingY;
        camera.position.y = Math.max(minCameraY, Math.min(maxCameraY, camera.position.y));

        // Update camera position in state
        appState.set('cameraY', camera.position.y);

        // Update scene
        updateStars(starsGroup, now * 0.001, camera.position.y, mouseWorldPosition, appState.get('touchFade'));
        updatePOIs(poiObjects, now * 0.001, raycaster);

        // Render
        renderer.render(scene, camera);
        cssRenderer.render(scene, camera);

    } catch (err) {
        logError('Animation loop error', err);
        // Don't break the loop on error
        requestAnimationFrame(animate);
    }
}

// Get the canvas element
const canvas = document.getElementById('bg');

function onWindowResize() {
    // Use canvas dimensions, not window dimensions
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // --- Recalculate viewport dimensions based on POI data and aspect ratio ---
    // Get new aspect ratio
    const aspect = canvasWidth / canvasHeight;

    // Get POI Y range
    yPositions = pois.map(p => p.position.y);
    maxY = Math.max(...yPositions);
    minY = Math.min(...yPositions);

    // Calculate new viewport height (span of POIs plus margin)
    const poiSpan = Math.abs(maxY - minY);
    const margin = 0.1 * poiSpan;
    const newViewportHeight = poiSpan + margin;
    const newViewportWidth = newViewportHeight * aspect;

    // Update camera frustum
    camera.top = newViewportHeight / 2;
    camera.bottom = -newViewportHeight / 2;
    camera.left = -newViewportWidth / 2;
    camera.right = newViewportWidth / 2;
    camera.updateProjectionMatrix();

    // Optionally, keep camera centered on POIs
    camera.position.x = 0;
    // camera.position.y = (maxY + minY) / 2; // Don't reset Y, let scroll logic handle it

    renderer.setSize(canvasWidth, canvasHeight); // Resize WebGL renderer
    cssRenderer.setSize(canvasWidth, canvasHeight); // Resize CSS3D renderer

    // Update header/footer positions on resize (in case POI Y changes)
    headerObj.position.y = maxY + paddingY - headerWorldHeight / 2;
    footerObj.position.y = minY - paddingY + 30;
}

// Initial call to set size correctly
onWindowResize();

// Set initial camera position to top (just below header)
camera.position.y = maxY + paddingY - camera.top;

animate();
