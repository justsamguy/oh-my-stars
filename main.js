// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { pois, SCROLL_DAMPING, MAX_SCROLL_SPEED, BASE_STAR_COUNT, MOBILE_BREAKPOINT } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox, touchFadeValue } from './interaction.js';
import { createHeaderElement, createFooterElement } from './layoutConfig.js';

// --- CSS3DRenderer only for overlays and header/footer ---
const appContainer = document.getElementById('app-container');
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0px';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '5';
appContainer.appendChild(cssRenderer.domElement);

// Get the canvas element (move this up so it's available for all uses)
const canvas = document.getElementById('bg');

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
// Use larger bottom padding on mobile, but keep top padding default
const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
const paddingTopY = 100;
const paddingBottomY = isMobile ? 130 : 100; // Increased padding for mobile only
// Footer position offsets
const mobileFooterOffset = 45; // Larger offset for mobile
const desktopFooterOffset = 30; // Original offset for desktop

// Replace header creation with:
const headerDiv = createHeaderElement();
const headerObj = new CSS3DObject(headerDiv);
const headerWorldHeight = 70;
headerObj.position.set(0, maxY + paddingTopY - headerWorldHeight / 2, 0);
headerObj.rotation.set(0, 0, 0);
scene.add(headerObj);

// Replace footer creation with:
const footerDiv = createFooterElement();
const footerObj = new CSS3DObject(footerDiv);
footerObj.position.set(0, minY - paddingBottomY + 15, 0);
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

// Use a mutable scrollDamping variable for runtime changes
let scrollDamping = SCROLL_DAMPING;

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
        scrollState.velocity *= scrollDamping;
    }
    // Clamp camera based on POI positions, not header/footer
    const cameraViewHeight = camera.top - camera.bottom;
    const clampMinY = Math.min(minY, maxY) + cameraViewHeight / 2 - paddingBottomY;
    const clampMaxY = Math.max(minY, maxY) - cameraViewHeight / 2 + paddingTopY;
    camera.position.y = Math.max(clampMinY, Math.min(clampMaxY, camera.position.y));

    // No need to update projection matrix here unless zoom changes
    // camera.updateProjectionMatrix();

    // Update stars
    updateStars(starsGroup, now * 0.001, camera.position.y, mouseWorldPosition, touchFadeValue);
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
    }    // Keep header/footer in correct X/Z, but let them scroll with the scene
    headerObj.position.x = 0;
    headerObj.position.z = 0;
    headerObj.position.y = maxY + paddingTopY - headerWorldHeight / 2;    footerObj.position.x = 0;
    footerObj.position.z = 0;
    footerObj.position.y = minY - paddingBottomY + (isMobile ? mobileFooterOffset : desktopFooterOffset);

    // Render
    renderer.render(scene, camera); // Render WebGL scene
    cssRenderer.render(scene, camera); // Render CSS3D scene (overlays WebGL)
}

// --- Fix for mobile scroll jitter: disable scroll damping on mobile ---
// Detect if the user is on a mobile device (simple check)
const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
if (isMobileDevice) {
    scrollDamping = 1;
}

// --- Improved mobile handling: adjust camera position on touch end ---
let isTouching = false;
let touchStartY = 0;
let touchCurrentY = 0;
let touchVelocity = 0;
let touchStartTime = 0;
let touchEndTime = 0;

// Update touch handling to use passive listeners for better performance
const touchOptions = { passive: true };

// Touch start event
canvas.addEventListener('touchstart', (e) => {
    isTouching = true;
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    touchStartTime = performance.now();
}, touchOptions);

// Touch move event
canvas.addEventListener('touchmove', (e) => {
    if (!isTouching) return;
    touchCurrentY = e.touches[0].clientY;
    // Calculate velocity as distance / time
    const now = performance.now();
    const elapsedTime = now - touchStartTime;
    touchVelocity = (touchCurrentY - touchStartY) / elapsedTime;
    touchStartY = touchCurrentY;
    touchStartTime = now;
}, touchOptions);

// Touch end event
canvas.addEventListener('touchend', () => {
    isTouching = false;
    // Apply a burst of scroll based on the final velocity
    scrollState.velocity += touchVelocity * 10; // Multiply for stronger effect
    // Clamp the velocity to prevent excessive scrolling
    if (scrollState.velocity > MAX_SCROLL_SPEED) scrollState.velocity = MAX_SCROLL_SPEED;
    if (scrollState.velocity < -MAX_SCROLL_SPEED) scrollState.velocity = -MAX_SCROLL_SPEED;
});

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

    // Keep camera centered on POIs horizontally
    camera.position.x = 0;
    // camera.position.y = (maxY + minY) / 2; // Don't reset Y, let scroll logic handle it

    renderer.setSize(canvasWidth, canvasHeight); // Resize WebGL renderer
    cssRenderer.setSize(canvasWidth, canvasHeight); // Resize CSS3D renderer
    
    // Update header/footer positions on resize (in case POI Y changes)
    headerObj.position.y = maxY + paddingTopY - headerWorldHeight / 2;
    footerObj.position.y = minY - paddingBottomY + (isMobile ? mobileFooterOffset : desktopFooterOffset);
}

// Initial call to set size correctly
onWindowResize();

// Set initial camera position to top (just below header)
camera.position.y = maxY + paddingTopY - camera.top;

animate();
