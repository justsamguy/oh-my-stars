// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { pois, SCROLL_DAMPING, MAX_SCROLL_SPEED, BASE_STAR_COUNT } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox, touchFadeValue } from './interaction.js';
import { createHeaderElement, createFooterElement, footerConfig } from './layoutConfig.js';

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
// Position the footer at the bottom of the viewport, regardless of scroll
footerObj.position.set(0, -window.innerHeight/2, 0);
footerObj.rotation.set(0, 0, 0);
scene.add(footerObj);

// Initialize mobile footer
const mobileFooter = document.getElementById('mobile-footer');
const mobileNav = mobileFooter.querySelector('.mobile-footer-nav');
const mobileCopyright = mobileFooter.querySelector('.mobile-footer-copyright');

// Populate mobile footer with links from config
const { links } = footerConfig.navigation;
mobileNav.innerHTML = links.map(link => 
    `<a href="${link.href}" class="mobile-footer-link">${link.text}</a>`
).join('');

// Add copyright
mobileCopyright.textContent = footerConfig.copyright;

// Add touch event handlers for mobile footer links
const mobileLinks = mobileFooter.querySelectorAll('.mobile-footer-link');
mobileLinks.forEach(link => {
    link.addEventListener('touchstart', function() {
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }, {passive: true});
    
    link.addEventListener('touchend', function() {
        this.style.backgroundColor = 'transparent';
    }, {passive: true});
});

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
    const clampMinY = Math.min(minY, maxY) + cameraViewHeight / 2 - paddingY; // Changed from /2 to /3
    const clampMaxY = Math.max(minY, maxY) - cameraViewHeight / 2 + paddingY; // Changed from /2 to /3
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
    }    // Keep header in correct position
    headerObj.position.x = 0;
    headerObj.position.z = 0;
    headerObj.position.y = maxY + paddingY - headerWorldHeight / 2;
    
    // Keep footer at the bottom of the viewport and move with scroll
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const maxScroll = docHeight - viewportHeight;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
      // Only show footer when scrolled near bottom on desktop
    const footerShowThreshold = 0.85;
    if (window.innerWidth > 600) {  // Only handle desktop footer
        if (scrollProgress > footerShowThreshold) {
            const opacity = (scrollProgress - footerShowThreshold) * (1 / (1 - footerShowThreshold));
            footerObj.position.y = minY - paddingY + (150 * opacity);
            footerDiv.style.opacity = opacity.toString();
        } else {
            footerObj.position.y = minY - paddingY;
            footerDiv.style.opacity = "0";
        }
        footerObj.position.x = 0;
        footerObj.position.z = 0;
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
