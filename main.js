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
let footerDiv = createFooterElement();
let footerObj = new CSS3DObject(footerDiv);
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
    if (scrollState.velocity > MAX_SCROLL_SPEED) scrollState.velocity = MAX_SCROLL_SPEED;
    if (scrollState.velocity < -MAX_SCROLL_SPEED) scrollState.velocity = -MAX_SCROLL_SPEED;
    // Smooth transition after drag ends
    // (Removed dragReleaseY/dragReleaseFrames logic for direct velocity handoff)
    if (scrollState.isDragging && scrollState.dragY !== null) {
        camera.position.y = scrollState.dragY;
    } else if (Math.abs(scrollState.velocity) > 0.001) {
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

// Remove old touch scroll event listeners (handled in interaction.js)

function onWindowResize() {
  // Use window dimensions for resizing
  const width = window.innerWidth;
  const height = window.innerHeight;

  // --- Recalculate viewport dimensions based on POI data and aspect ratio ---
  const aspect = width / height;
  yPositions = pois.map(p => p.position.y);
  maxY = Math.max(...yPositions);
  minY = Math.min(...yPositions);
  const poiSpan = Math.abs(maxY - minY);
  const margin = 0.1 * poiSpan;
  const newViewportHeight = poiSpan + margin;
  const newViewportWidth = newViewportHeight * aspect;

  camera.top = newViewportHeight / 2;
  camera.bottom = -newViewportHeight / 2;
  camera.left = -newViewportWidth / 2;
  camera.right = newViewportWidth / 2;
  camera.updateProjectionMatrix();
  camera.position.x = 0;

  renderer.setSize(width, height);
  cssRenderer.setSize(width, height);

  headerObj.position.y = maxY + paddingTopY - headerWorldHeight / 2;
  footerObj.position.y = minY - paddingBottomY + (window.innerWidth <= MOBILE_BREAKPOINT ? mobileFooterOffset : desktopFooterOffset);
}

let lastIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;

function replaceFooter() {
  // Remove old footer object from scene
  if (footerObj) {
    scene.remove(footerObj);
    // Remove old footer DOM element from CSS3DRenderer
    if (footerObj.element && footerObj.element.parentNode) {
      footerObj.element.parentNode.removeChild(footerObj.element);
    }
  }
  // Create new footer
  footerDiv = createFooterElement();
  footerObj = new CSS3DObject(footerDiv);
  footerObj.position.set(0, minY - paddingBottomY + (window.innerWidth <= MOBILE_BREAKPOINT ? mobileFooterOffset : desktopFooterOffset), 0);
  footerObj.rotation.set(0, 0, 0);
  scene.add(footerObj);
}

function handleBreakpointResize() {
  const isMobileNow = window.innerWidth <= MOBILE_BREAKPOINT;
  if (isMobileNow !== lastIsMobile) {
    lastIsMobile = isMobileNow;
    replaceFooter();
  }
}

window.addEventListener('resize', handleBreakpointResize);

// Initial call to set size correctly
onWindowResize();

// Set initial camera position to top (just below header)
camera.position.y = maxY + paddingTopY - camera.top;

animate();
