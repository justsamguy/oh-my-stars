import * as THREE from 'three';
import { getWorldPosition } from './utils.js';
import { infoBoxContainer, camera, renderer } from './sceneSetup.js';
import { MOBILE_BREAKPOINT, MOBILE_SCROLL_MULTIPLIER } from './config.js';

// State
export let mouseWorldPosition = new THREE.Vector3(-10000, -10000, 0);
export const scrollState = { velocity: 0 };
export let cameraTargetY = camera.position.y;

// Raycaster for POI hover
export const raycaster = new THREE.Raycaster();

// Info box logic
export let currentInfoBox = null; // Export this variable
let infoBoxAnimating = false;
let queuedInfoBox = null;

// Add touch fade state
export let touchFadeValue = 1.0;
let touchFadeInterval = null;
const FADE_DURATION = 1000; // 1 second fade out
const FADE_INTERVAL = 16; // ~60fps

function startTouchFadeOut() {
    if (touchFadeInterval) clearInterval(touchFadeInterval);
    
    const startTime = Date.now();
    touchFadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= FADE_DURATION) {
            touchFadeValue = 0;
            clearInterval(touchFadeInterval);
            touchFadeInterval = null;
            return;
        }
        touchFadeValue = 1 - (elapsed / FADE_DURATION);
    }, FADE_INTERVAL);
}

function createBottomSheet(poi) {
    // Clear any existing sheets first
    const existingSheet = document.querySelector('.bottom-sheet');
    const existingOverlay = document.querySelector('.overlay');
    if (existingSheet) existingSheet.remove();
    if (existingOverlay) existingOverlay.remove();
    
    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    
    sheet.innerHTML = `
        <div class="pull-handle"></div>
        <div class="close-btn">&times;</div>
        <div class="bottom-sheet-content">
            <h3 style="margin:0 0 10px 0;font-size:20px;font-weight:bold;color:#${poi.color.toString(16)}">${poi.name}</h3>
            <p style="margin:0;line-height:1.4">${poi.description}</p>
            <div class="timestamp">${new Date().toISOString().replace('T', ' ').slice(0, -5)}</div>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    // Lock scrolling with class
    document.body.classList.add('bottom-sheet-open');
    
    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        sheet.classList.add('open');
    });

    const close = () => {
        if (!currentInfoBox) return; // Prevent double-closing
        sheet.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.classList.remove('bottom-sheet-open');
        
        const handleTransitionEnd = () => {
            if (currentInfoBox) { // Check again in case of race condition
                sheet.remove();
                overlay.remove();
                currentInfoBox = null;
            }
        };
        
        sheet.addEventListener('transitionend', handleTransitionEnd, { once: true });
    };

    // Remove all previous event listeners and add new ones
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    // Single touch handler for the overlay
    overlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        close();
    }, { passive: false });

    // Touch handlers for the sheet
    const handleTouchStart = (e) => {
        if (!e.target.closest('.bottom-sheet-content')) {
            e.preventDefault();
            startY = e.touches[0].clientY;
            isDragging = false;
        }
    };

    const handleTouchMove = (e) => {
        if (!e.target.closest('.bottom-sheet-content')) {
            e.preventDefault();
            isDragging = true;
            currentY = e.touches[0].clientY;
            const delta = currentY - startY;
            if (delta > 0) {
                sheet.style.transform = `translateY(${delta}px)`;
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (!e.target.closest('.bottom-sheet-content')) {
            if (isDragging) {
                const delta = currentY - startY;
                if (delta > 100) {
                    close();
                } else {
                    sheet.style.transform = '';
                }
            }
        }
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: false });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd);

    // Add click handlers
    sheet.querySelector('.close-btn').addEventListener('click', close);
    overlay.addEventListener('click', close);

    // Prevent clicks from propagating through the sheet
    sheet.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    currentInfoBox = sheet;
    return { sheet, overlay, close };
}

function openInfoBox(poi, poiPosition) {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        return createBottomSheet(poi);
    }

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
    currentInfoBox.dataset.poiPositionX = poiPosition.x; // Store POI 3D position
    currentInfoBox.dataset.poiPositionY = poiPosition.y;
    currentInfoBox.dataset.poiPositionZ = poiPosition.z;
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

    // Handle bottom sheet closing
    if (currentInfoBox.classList.contains('bottom-sheet')) {
        currentInfoBox.classList.remove('open');
        const overlay = document.querySelector('.overlay');
        if (overlay) overlay.classList.remove('visible');
        document.body.classList.remove('bottom-sheet-open');
        
        currentInfoBox.addEventListener('transitionend', () => {
            currentInfoBox.remove();
            if (overlay) overlay.remove();
            currentInfoBox = null;
            infoBoxAnimating = false;
            
            // Handle queued info box
            if (queuedInfoBox) {
                const { poi, poiPosition } = queuedInfoBox;
                queuedInfoBox = null;
                openInfoBox(poi, poiPosition);
            }
        }, { once: true });
        
        return;
    }

    // Handle desktop info box closing
    const wrapper = currentInfoBox;
    const panel = wrapper.querySelector('.info-box');
    if (!panel) {
        // Fallback cleanup if structure is invalid
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        currentInfoBox = null;
        infoBoxAnimating = false;
        return;
    }

    const content = panel.querySelector('.info-box-content');
    const closeBtn = panel.querySelector('.close-btn');

    // --- Prepare for animation ---

    // 1. Hide close button immediately
    if (closeBtn) {
        closeBtn.style.display = 'none';
    }

    // 2. Fade out content quickly, but don't change layout properties
    if (content) {
        content.style.transition = 'opacity 0.1s ease-out';
        content.style.opacity = '0';
        // DO NOT change position, whitespace, or overflow here.
        // Rely on panel's overflow:hidden to clip.
    }

    // 3. Set up panel transitions for width, padding, and border
    const openTransitionDuration = 420; // Match totalDuration from openInfoBox
    const easing = 'cubic-bezier(0.25, 1, 0.5, 1)';
    panel.style.transition = `width ${openTransitionDuration}ms ${easing}, padding ${openTransitionDuration}ms ${easing}, border-width ${openTransitionDuration}ms ${easing}`;

    // 4. Add transitionend listener for cleanup
    panel.addEventListener('transitionend', function handleTransitionEnd(event) {
        // Only act when the width transition finishes
        if (event.propertyName === 'width') {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
            currentInfoBox = null;
            infoBoxAnimating = false;
            // Open queued box if necessary
            if (queuedInfoBox) {
                const { poi, poiPosition } = queuedInfoBox;
                queuedInfoBox = null;
                openInfoBox(poi, poiPosition);
            }
            // Clean up listener
            panel.removeEventListener('transitionend', handleTransitionEnd);
        }
    }, { once: false }); // Use once: false, remove manually

    // --- Start animation ---
    // Trigger reflow before starting animation might help ensure styles apply correctly
    void panel.offsetWidth;

    panel.style.borderWidth = '0px';
    panel.style.padding = '0px';
    panel.style.width = '1px';
}

export function showInfoBox(poi, poiPosition) {
    // If mobile, remove any existing desktop info box
    if (window.innerWidth <= MOBILE_BREAKPOINT && currentInfoBox && !currentInfoBox.classList.contains('bottom-sheet')) {
        hideInfoBox();
    }
    
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
    const handleMove = (e) => {
        const pos = e.touches ? e.touches[0] : e;
        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        // Update world position
        mouseWorldPosition = getWorldPosition(pos.clientX, pos.clientY, camera, renderer);
        
        // Update raycaster with canvas-relative coordinates
        const x = ((pos.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((pos.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        // Reset touch fade on mobile touch
        if (e.touches && window.innerWidth <= MOBILE_BREAKPOINT) {
            touchFadeValue = 1.0;
            if (touchFadeInterval) clearInterval(touchFadeInterval);
        }
    };

    // Add touchstart handler for initial tap position
    const handleTouchStart = (e) => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            handleMove(e);
        }
    };

    // Add touch end handler for fade out
    const handleTouchEnd = () => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            startTouchFadeOut();
        }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
}

// Click event for POI info box
export function setupClickHandler(poiObjects) {
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    const TAP_THRESHOLD = 10;
    const TAP_DURATION = 200;

    const handleInteraction = (e) => {
        // Ignore interactions if bottom sheet is open on mobile
        if (window.innerWidth <= MOBILE_BREAKPOINT && 
            document.body.classList.contains('bottom-sheet-open')) {
            return;
        }

        if (e.target.closest('.info-box') || e.target.closest('.bottom-sheet')) {
            return;
        }

        // Get coordinates from either mouse or touch event
        const coords = e.type.includes('touch') 
            ? (e.type === 'touchend' ? e.changedTouches[0] : e.touches[0])
            : e;
        if (!coords) return;

        // Get canvas-relative coordinates
        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        const clientX = coords.clientX - rect.left;
        const clientY = coords.clientY - rect.top;
        
        const x = (clientX / rect.width) * 2 - 1;
        const y = -(clientY / rect.height) * 2 + 1;

        // Update raycaster
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        raycaster.far = window.innerWidth <= MOBILE_BREAKPOINT ? 1000 : 500;
        
        // Find intersected POI
        let foundPOI = null;
        let closestDistance = Infinity;

        for (const poi of poiObjects) {
            const intersects = raycaster.intersectObjects(poi.children, true);
            if (intersects.length > 0) {
                const distance = intersects[0].distance;
                if (distance < closestDistance) {
                    closestDistance = distance;
                    foundPOI = poi;
                }
            }
        }

        if (foundPOI) {
            e.preventDefault?.();
            showInfoBox(foundPOI.userData, foundPOI.position);
        } else if (!e.target.closest('.info-box')) {
            hideInfoBox();
        }
    };

    // Desktop clicks
    window.addEventListener('click', (e) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            handleInteraction(e);
        }
    });

    // Mobile touches
    let isTapping = false;

    window.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        isTapping = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isTapping) return;
        
        const moveDistance = Math.hypot(
            e.touches[0].clientX - touchStartPos.x,
            e.touches[0].clientY - touchStartPos.y
        );
        
        if (moveDistance > TAP_THRESHOLD) {
            isTapping = false;
        }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (!isTapping) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        if (touchDuration <= TAP_DURATION) {
            e.preventDefault();
            handleInteraction(e);
        }
        
        isTapping = false;
    }, { passive: false });
}

// Scroll event
export function setupScrollHandler() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const multiplier = isMobile ? MOBILE_SCROLL_MULTIPLIER : 1;
    
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollState.velocity -= e.deltaY * 0.01 * multiplier;
    }, { passive: false });

    let touchStart = 0;
    window.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
        const delta = touchStart - e.touches[0].clientY;
        scrollState.velocity -= delta * 0.01 * multiplier;
        touchStart = e.touches[0].clientY;
    });
}

// Resize event
export function setupResizeHandler(onResize) {
    window.addEventListener('resize', onResize);
}
