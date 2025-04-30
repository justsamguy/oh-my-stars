// Entry point for the modularized star map app
// Entry point for the modularized star map app
import * as THREE from 'three';
import { pois, STAR_COUNT, SCROLL_DAMPING, MAX_SCROLL_SPEED } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox } from './interaction.js'; // Import currentInfoBox

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
    // Clamp camera
    const minY = pois[pois.length - 1].position.y;
    const maxY = pois[0].position.y;
    camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));
    camera.updateProjectionMatrix();
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
        const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth + 20;
        const screenY = (-pos.y * 0.5 + 0.5) * window.innerHeight - 20;
        currentInfoBox.style.left = `${screenX}px`;
        currentInfoBox.style.top = `${screenY}px`;
    }

    // Render
    renderer.clear();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const newViewportHeight = getViewportHeight();
    const newViewportWidth = getViewportWidth();
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = newViewportWidth / -2;
    camera.right = newViewportWidth / 2;
    camera.top = newViewportHeight / 2;
    camera.bottom = newViewportHeight / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();
