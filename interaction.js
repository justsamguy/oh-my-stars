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
    const unfoldDuration = totalDuration;
    const contentFadeStart = Math.round(totalDuration * 0.7);
    const contentFadeDuration = totalDuration - contentFadeStart;
    // --- Measure title width (no wrap) ---
    const titleMeasurer = document.createElement('span');
    titleMeasurer.style.position = 'absolute';
    titleMeasurer.style.visibility = 'hidden';
    titleMeasurer.style.whiteSpace = 'nowrap';
    titleMeasurer.style.fontFamily = 'Courier New, monospace';
    titleMeasurer.style.fontSize = '20px';
    titleMeasurer.style.fontWeight = 'bold';
    titleMeasurer.innerText = poi.name;
    document.body.appendChild(titleMeasurer);
    const titleWidth = titleMeasurer.offsetWidth;
    document.body.removeChild(titleMeasurer);
    // --- Calculate box width ---
    const closeBtnSpace = 38; // px, for button + margin
    const sidePadding = 22; // px, left and right
    const minBoxWidth = 180;
    const maxBoxWidth = 340;
    let boxWidth = titleWidth + closeBtnSpace + sidePadding;
    boxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, boxWidth));
    // --- Measure content height ---
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.pointerEvents = 'none';
    measurer.style.zIndex = '-1';
    measurer.style.boxSizing = 'border-box';
    measurer.style.width = boxWidth + 'px';
    measurer.style.padding = '22px 22px 18px 22px';
    measurer.style.fontFamily = 'Courier New, monospace';
    measurer.innerHTML = `
        <h3 style=\"margin:0 0 10px 0;font-size:20px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#${poi.color.toString(16)}\">${poi.name}</h3>
        <p style=\"margin:0\">${poi.description}</p>
        <div class=\"timestamp\">${new Date().toISOString().replace('T', ' ').slice(0, -5)}</div>
    `;
    document.body.appendChild(measurer);
    const contentHeight = measurer.offsetHeight;
    document.body.removeChild(measurer);
    // --- Create wrapper ---
    const wrapper = document.createElement('div');
    wrapper.className = 'info-box-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${screenX}px`;
    wrapper.style.top = `${screenY}px`;
    wrapper.style.zIndex = '1000';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.overflow = 'visible';
    wrapper.style.width = boxWidth + 'px';
    wrapper.style.height = contentHeight + 'px';
    wrapper.style.boxSizing = 'border-box';
    // --- Panel (unfolds horizontally) ---
    const panel = document.createElement('div');
    panel.className = 'info-box';
    panel.style.position = 'absolute';
    panel.style.left = '0';
    panel.style.top = '0';
    panel.style.height = contentHeight + 'px';
    panel.style.width = '1px';
    panel.style.background = 'rgba(0,20,40,0.92)';
    panel.style.color = '#fff';
    panel.style.padding = '22px 22px 18px 22px';
    panel.style.borderRadius = '5px';
    panel.style.maxWidth = maxBoxWidth + 'px';
    panel.style.pointerEvents = 'auto';
    panel.style.border = `1px solid #${poi.color.toString(16)}`;
    panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    panel.style.overflow = 'hidden';
    panel.style.transformOrigin = 'left center';
    panel.style.opacity = '1';
    panel.style.transition = `width ${unfoldDuration}ms cubic-bezier(.5,1.7,.7,1)`;
    panel.style.boxSizing = 'border-box';
    // --- Content (fades in) ---
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = `opacity ${contentFadeDuration}ms`;
    content.style.maxWidth = boxWidth + 'px';
    content.style.boxSizing = 'border-box';
    content.style.position = 'relative';
    content.innerHTML = `
        <h3 style=\"margin:0 0 10px 0;font-size:20px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#${poi.color.toString(16)}\">${poi.name}</h3>
        <p style=\"margin:0\">${poi.description}</p>
        <div class=\"timestamp\">${new Date().toISOString().replace('T', ' ').slice(0, -5)}</div>
    `;
    // --- Close button ---
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '-10px'; // Move closer to the corner, slightly outside
    closeBtn.style.right = '-10px';
    closeBtn.style.width = '36px';
    closeBtn.style.height = '36px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.lineHeight = '36px';
    closeBtn.style.textAlign = 'center';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.color = `#${poi.color.toString(16)}`;
    closeBtn.style.background = 'rgba(0,0,0,0.10)';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '0';
    closeBtn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)';
    closeBtn.onclick = () => {
        queueAndHideInfoBox(null);
    };
    content.appendChild(closeBtn);
    panel.appendChild(content);
    wrapper.appendChild(panel);
    infoBoxContainer.appendChild(wrapper);
    currentInfoBox = wrapper;
    // Animate panel unfold (width)
    setTimeout(() => {
        panel.style.width = boxWidth + 'px';
    }, 10);
    // After animation, fix width and remove transition
    setTimeout(() => {
        panel.style.transition = 'none';
        panel.style.width = boxWidth + 'px';
    }, unfoldDuration + 20);
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
    const content = panel.querySelector('div');
    // Fade out content
    if (content) content.style.opacity = '0';
    // Animate panel fold (width)
    panel.style.width = '1px';
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