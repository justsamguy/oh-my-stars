import * as THREE from 'three';
import { getWorldPosition } from './utils.js';
import { infoBoxContainer, camera, renderer } from './sceneSetup.js';

// State
export let mouseWorldPosition = new THREE.Vector3(-10000, -10000, 0);
export let scrollVelocity = 0;
export let cameraTargetY = camera.position.y;

// Raycaster for POI hover
export const raycaster = new THREE.Raycaster();

// Info box logic
let currentInfoBox = null;

export function showInfoBox(poi, poiPosition) {
    // Remove any existing info box
    hideInfoBox();
    // Project POI position to screen
    const pos = poiPosition.clone();
    pos.project(camera);
    const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth + 20;
    const screenY = (-pos.y * 0.5 + 0.5) * window.innerHeight - 20;
    // Create info box container
    const box = document.createElement('div');
    box.className = 'info-box';
    box.style.position = 'absolute';
    box.style.left = `${screenX}px`;
    box.style.top = `${screenY}px`;
    box.style.background = 'rgba(0,20,40,0.92)';
    box.style.color = '#fff';
    box.style.padding = '15px';
    box.style.borderRadius = '5px';
    box.style.maxWidth = '220px';
    box.style.pointerEvents = 'auto';
    box.style.border = `1px solid #${poi.color.toString(16)}`;
    box.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    box.style.overflow = 'hidden';
    box.style.transformOrigin = 'left center';
    box.style.zIndex = '1000';
    // --- Animation: Seed-line phase ---
    box.style.width = '2px';
    box.style.height = '0px';
    box.style.transition = 'height 0.18s cubic-bezier(.5,1.7,.7,1), width 0s';
    infoBoxContainer.appendChild(box);
    currentInfoBox = box;
    // Grow the vertical line
    setTimeout(() => {
        box.style.height = '90px'; // Final height
    }, 10);
    // Unfold phase
    setTimeout(() => {
        box.style.transition = 'width 0.22s cubic-bezier(.5,1.7,.7,1), height 0s';
        box.style.width = '220px';
    }, 200);
    // Content reveal (fade in)
    setTimeout(() => {
        const content = document.createElement('div');
        content.style.opacity = '0';
        content.style.transition = 'opacity 0.18s';
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
        content.innerHTML = `
            <h3 style="margin:0 0 10px 0; color:#${poi.color.toString(16)}">${poi.name}</h3>
            <p style="margin:0">${poi.description}</p>
            <div class="timestamp">${timestamp}</div>
        `;
        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = hideInfoBox;
        content.appendChild(closeBtn);
        box.appendChild(content);
        setTimeout(() => { content.style.opacity = '1'; }, 60);
    }, 350);
}

export function hideInfoBox() {
    if (currentInfoBox) {
        currentInfoBox.style.transition = 'width 0.18s, height 0.18s';
        currentInfoBox.style.width = '2px';
        currentInfoBox.style.height = '0px';
        setTimeout(() => {
            if (currentInfoBox && currentInfoBox.parentNode) {
                currentInfoBox.parentNode.removeChild(currentInfoBox);
            }
            currentInfoBox = null;
        }, 200);
    }
    infoBoxContainer.innerHTML = '';
}

// Mouse move event (no info box on hover)
export function setupMouseMoveHandler(poiObjects) {
    window.addEventListener('mousemove', (e) => {
        mouseWorldPosition = getWorldPosition(e.clientX, e.clientY, camera, renderer);
        // Raycast for POI hover (for highlight only, not info box)
        raycaster.setFromCamera({
            x: (e.clientX / window.innerWidth) * 2 - 1,
            y: -(e.clientY / window.innerHeight) * 2 + 1
        }, camera);
    });
}

// Click event for POI info box
export function setupClickHandler(poiObjects) {
    window.addEventListener('click', (e) => {
        raycaster.setFromCamera({
            x: (e.clientX / window.innerWidth) * 2 - 1,
            y: -(e.clientY / window.innerHeight) * 2 + 1
        }, camera);
        let foundPOI = null;
        for (const poi of poiObjects) {
            const intersects = raycaster.intersectObject(poi, true);
            if (intersects.length > 0) {
                foundPOI = poi;
                break;
            }
        }
        if (foundPOI) {
            showInfoBox(foundPOI.userData, foundPOI.position);
        } else {
            hideInfoBox();
        }
    });
}

// Scroll event
export function setupScrollHandler() {
    window.addEventListener('wheel', (e) => {
        scrollVelocity += e.deltaY * 0.01;
    });
}

// Resize event
export function setupResizeHandler(onResize) {
    window.addEventListener('resize', onResize);
}
