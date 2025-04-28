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
    const closeBtnSpace = 36; // px, for button (matches closeBtn width)
    const closeBtnMargin = 10; // px, for negative offset
    const sidePadding = 22; // px, left and right
    const minBoxWidth = 180;
    const maxBoxWidth = 340;
    let boxWidth = titleWidth + closeBtnSpace + sidePadding;
    // Ensure enough space for close button's negative offset
    boxWidth += closeBtnMargin;
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
    panel.style.background = 'rgba(0,20,40,0.92)';
    panel.style.color = '#fff';
    panel.style.padding = '22px 22px 18px 22px'; // <-- all padding here
    panel.style.borderRadius = '5px';
    panel.style.maxWidth = maxBoxWidth + 'px';
    panel.style.pointerEvents = 'auto';
    panel.style.border = `1px solid #${poi.color.toString(16)}`;
    panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    panel.style.overflow = 'hidden'; // was 'visible'
    panel.style.transformOrigin = 'left center';
    panel.style.opacity = '1';
    panel.style.boxSizing = 'border-box';
    // Append closeBtn and content
    const content = document.createElement('div');
    content.style.opacity = '0';
    content.style.transition = `opacity ${contentFadeDuration}ms`;
    content.style.width = '100%'; // ensure content stays inside panel
    content.style.maxWidth = '100%';
    content.style.boxSizing = 'border-box';
    content.style.position = 'relative';
    content.className = 'info-box-content'; // Add class
    content.innerHTML = `
        <h3 style=\"margin:0 0 10px 0;font-size:20px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#${poi.color.toString(16)}\">${poi.name}</h3>
        <p style=\"margin:0\">${poi.description}</p>
        <div class=\"timestamp\">${new Date().toISOString().replace('T', ' ').slice(0, -5)}</div>
    `;
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '6px';    // closer to top
    closeBtn.style.right = '6px';  // closer to right
    closeBtn.style.width = '32px';
    closeBtn.style.height = '32px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.lineHeight = '32px';
    closeBtn.style.textAlign = 'center';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.color = `#${poi.color.toString(16)}`;
    closeBtn.style.background = 'rgba(0,0,0,0.10)';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '0';
    closeBtn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)';
    closeBtn.style.zIndex = '10';
    closeBtn.onclick = () => {
        queueAndHideInfoBox(null);
    };
    panel.appendChild(closeBtn);
    panel.appendChild(content);
    wrapper.appendChild(panel);
    infoBoxContainer.appendChild(wrapper);
    currentInfoBox = wrapper;
    panel.dataset.boxWidth = boxWidth; // Store original width

    // Set transition before width
    panel.style.transition = `width ${unfoldDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`; // Use ease-out curve to prevent overshoot
    panel.style.width = '1px';

    // Force reflow
    void panel.offsetWidth;

    // Use double requestAnimationFrame to ensure browser paints initial state
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panel.style.width = boxWidth + 'px';
            // Do not set width or transition again after this
        });
    });

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
    const content = panel.querySelector('.info-box-content'); // Select by class
    const originalBoxWidth = parseFloat(panel.dataset.boxWidth || '0');
    const padding = 22 * 2; // Left + Right padding

    // Prevent content reflow before animating panel
    if (content) {
        content.style.transition = 'opacity 0.1s ease-out'; // Faster fade out
        content.style.opacity = '0';
        content.style.width = `${originalBoxWidth - padding}px`; // Set fixed width
        content.style.maxWidth = `${originalBoxWidth - padding}px`; // Set fixed max width
        content.style.whiteSpace = 'nowrap'; // Prevent wrapping
        content.style.overflow = 'hidden'; // Hide overflow
    }

    // Ensure the same transition is used for closing as for opening
    const openTransitionDuration = 420; // Match totalDuration from openInfoBox
    panel.style.transition = `width ${openTransitionDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

    // Add a transitionend listener to remove the element *after* the animation
    panel.addEventListener('transitionend', function handleTransitionEnd(event) {
        // Ensure we only react to the 'width' property transition ending
        if (event.propertyName === 'width') {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
            currentInfoBox = null;
            infoBoxAnimating = false;
            // After closing, open the queued box if any
            if (queuedInfoBox) {
                const { poi, poiPosition } = queuedInfoBox;
                queuedInfoBox = null;
                openInfoBox(poi, poiPosition);
            }
            // Clean up the listener
            panel.removeEventListener('transitionend', handleTransitionEnd);
        }
    }, { once: false }); // Use once: false initially, remove manually inside

    // Start the closing animation immediately (no delay needed)
    panel.style.width = '1px';

    // NOTE: The old setTimeout for removal is replaced by the transitionend listener above
    /* Old removal logic:
    const panelTransitionDuration = 320; // Match the original timeout
    setTimeout(() => {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        currentInfoBox = null;
        infoBoxAnimating = false;
    }); // Added missing closing parenthesis for setTimeout
    */ // Added missing closing comment tag
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
