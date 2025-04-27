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
    // Animation timing
    const totalDuration = 420; // ms
    const seedLineDuration = Math.round(totalDuration * 0.4); // 40%
    const unfoldDuration = Math.round(totalDuration * 0.6); // 60%
    const contentFadeStart = Math.round(totalDuration * 0.7); // 70% in
    const contentFadeDuration = totalDuration - contentFadeStart;
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'info-box-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${screenX}px`;
    wrapper.style.top = `${screenY}px`;
    wrapper.style.zIndex = '1000';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.overflow = 'visible';
    // Seed line
    const seedLine = document.createElement('div');
    seedLine.className = 'info-box-seedline';
    seedLine.style.position = 'absolute';
    seedLine.style.left = '0';
    seedLine.style.top = '50%';
    seedLine.style.width = '1px';
    seedLine.style.height = '0';
    seedLine.style.background = `#${poi.color.toString(16)}`;
    seedLine.style.transform = 'translateY(-50%)';
    seedLine.style.transition = `height ${seedLineDuration}ms cubic-bezier(.5,1.7,.7,1)`;
    wrapper.appendChild(seedLine);
    // Panel (unfolds horizontally)
    const panel = document.createElement('div');
    panel.className = 'info-box';
    panel.style.position = 'absolute';
    panel.style.left = '0';
    panel.style.top = '0';
    panel.style.height = '100%';
    panel.style.width = '1px';
    panel.style.background = 'rgba(0,20,40,0.92)';
    panel.style.color = '#fff';
    panel.style.padding = '15px 15px 15px 15px';
    panel.style.borderRadius = '5px';
    panel.style.maxWidth = '220px';
    panel.style.pointerEvents = 'auto';
    panel.style.border = `1px solid #${poi.color.toString(16)}`;
    panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    panel.style.overflow = 'hidden';
    panel.style.transformOrigin = 'left center';
    panel.style.opacity = '1';
    panel.style.transition = `width ${unfoldDuration}ms cubic-bezier(.5,1.7,.7,1)`;
    // Content (fades in)
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = `opacity ${contentFadeDuration}ms`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
    content.innerHTML = `
        <h3 style=\"margin:0 0 10px 0; color:#${poi.color.toString(16)}\">${poi.name}</h3>
        <p style=\"margin:0\">${poi.description}</p>
        <div class=\"timestamp\">${timestamp}</div>
    `;
    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        queueAndHideInfoBox(null); // Close only
    };
    content.appendChild(closeBtn);
    panel.appendChild(content);
    wrapper.appendChild(panel);
    infoBoxContainer.appendChild(wrapper);
    currentInfoBox = wrapper;
    // Animate seed line (height)
    setTimeout(() => {
        seedLine.style.height = '100px'; // Will be adjusted below
        // Adjust to match panel height after DOM is ready
        setTimeout(() => {
            const panelHeight = panel.scrollHeight;
            seedLine.style.height = panelHeight + 'px';
            panel.style.height = panelHeight + 'px';
        }, 10);
    }, 10);
    // Animate panel unfold (width)
    setTimeout(() => {
        panel.style.width = panel.scrollWidth + 'px';
    }, seedLineDuration + 10);
    // Fade in content
    setTimeout(() => {
        content.style.opacity = '1';
        infoBoxAnimating = false;
    }, contentFadeStart + 10);
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
    const wrapper = currentInfoBox;
    const panel = wrapper.querySelector('.info-box');
    const seedLine = wrapper.querySelector('.info-box-seedline');
    const content = panel.querySelector('div');
    // Fade out content
    if (content) content.style.opacity = '0';
    // Animate panel fold (width)
    panel.style.width = '1px';
    // Animate seed line (height)
    setTimeout(() => {
        seedLine.style.height = '0';
    }, 120); // Start shrinking after panel fold
    setTimeout(() => {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        currentInfoBox = null;
        infoBoxAnimating = false;
        // After closing, open the queued box if any
        if (queuedInfoBox) {
            const { poi, poiPosition } = queuedInfoBox;
            queuedInfoBox = null;
            openInfoBox(poi, poiPosition);
        }
    }, 320);
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
