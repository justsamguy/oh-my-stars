import * as THREE from 'three';
import { getWorldPosition } from './utils.js';
import { infoBoxContainer, camera, renderer } from './sceneSetup.js';

// State
export let mouseWorldPosition = new THREE.Vector3(-10000, -10000, 0);
export const scrollState = { velocity: 0 };
export let cameraTargetY = camera.position.y;

// Raycaster for POI hover
export const raycaster = new THREE.Raycaster();

// Info box logic
let currentInfoBox = null;
let infoBoxAnimating = false;
let queuedInfoBox = null;

function openInfoBox(poi, poiPosition) {
    infoBoxAnimating = true;
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
    box.style.overflow = 'visible';
    box.style.transformOrigin = 'left center';
    box.style.zIndex = '1000';
    box.style.transform = 'scaleX(0) scaleY(0.7)';
    box.style.transition = 'transform 0.22s cubic-bezier(.5,1.7,.7,1)';
    infoBoxContainer.appendChild(box);
    currentInfoBox = box;
    // Content
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
    closeBtn.onclick = () => {
        queueAndHideInfoBox(null); // Close only
    };
    content.appendChild(closeBtn);
    box.appendChild(content);
    // Animate open
    setTimeout(() => {
        box.style.transform = 'scaleX(1) scaleY(1)';
        setTimeout(() => {
            content.style.opacity = '1';
            infoBoxAnimating = false;
        }, 220);
    }, 10);
}

function queueAndHideInfoBox(nextInfoBox) {
    // Always set the queue, then close the current box
    queuedInfoBox = nextInfoBox;
    if (currentInfoBox && !infoBoxAnimating) {
        closeCurrentInfoBox();
    } else if (!currentInfoBox && queuedInfoBox) {
        // If nothing is open, open the queued box immediately
        const { poi, poiPosition } = queuedInfoBox;
        queuedInfoBox = null;
        openInfoBox(poi, poiPosition);
    }
}

function closeCurrentInfoBox() {
    if (!currentInfoBox) return;
    infoBoxAnimating = true;
    const box = currentInfoBox;
    const content = box.querySelector('div');
    if (content) content.style.opacity = '0';
    box.style.transition = 'transform 0.18s cubic-bezier(.5,1.7,.7,1)';
    box.style.transform = 'scaleX(0) scaleY(0.7)';
    setTimeout(() => {
        if (box.parentNode) box.parentNode.removeChild(box);
        currentInfoBox = null;
        infoBoxAnimating = false;
        // After closing, open the queued box if any
        if (queuedInfoBox) {
            const { poi, poiPosition } = queuedInfoBox;
            queuedInfoBox = null;
            openInfoBox(poi, poiPosition);
        }
    }, 180);
}

export function showInfoBox(poi, poiPosition) {
    // If animating or open, queue the new box and close current
    if (infoBoxAnimating || currentInfoBox) {
        queueAndHideInfoBox({ poi, poiPosition });
        return;
    }
    // Otherwise, open immediately
    openInfoBox(poi, poiPosition);
}

export function hideInfoBox() {
    // Queue nothing and close current
    queueAndHideInfoBox(null);
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
        scrollState.velocity -= e.deltaY * 0.01;
    });
}

// Resize event
export function setupResizeHandler(onResize) {
    window.addEventListener('resize', onResize);
}
