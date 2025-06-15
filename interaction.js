import * as THREE from 'three';
import { getWorldPosition } from './utils.js';
import { infoBoxContainer, camera, renderer } from './sceneSetup.js';
import { MOBILE_BREAKPOINT, MOBILE_SCROLL_MULTIPLIER, MAX_SCROLL_SPEED, pois } from './config.js';

// State
export let mouseWorldPosition = new THREE.Vector3(-10000, -10000, 0);
export const scrollState = { velocity: 0, dragY: null, isDragging: false };
export let cameraTargetY = camera.position.y;

// Raycaster for POI hover
export const raycaster = new THREE.Raycaster();

// Info box logic
export let currentInfoBox = null; // Export this variable
let infoBoxAnimating = false;
let queuedInfoBox = null;

// Debugging flags
const DEBUG_INFOBOX = false; // Set to true to enable console logs for infobox state

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

function logInfoBoxState(message) {
    if (DEBUG_INFOBOX) {
        console.log(`[InfoBox Debug] ${message} | infoBoxAnimating: ${infoBoxAnimating}, currentInfoBox: ${!!currentInfoBox}, queuedInfoBox: ${!!queuedInfoBox}`);
    }
}

function createBottomSheet(poi) {
    logInfoBoxState(`Creating bottom sheet for POI: ${poi.name}`);
    // Clear any existing sheets first
    const existingSheet = document.querySelector('.bottom-sheet');
    const existingOverlay = document.querySelector('.overlay');
    if (existingSheet) existingSheet.remove();
    if (existingOverlay) existingOverlay.remove();
      const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    
    // Calculate background color to match desktop info box
    const color = typeof poi.color === 'number' ? poi.color : parseInt(poi.color, 16);
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const darkR = Math.round(r * 0.15);
    const darkG = Math.round(g * 0.15);
    const darkB = Math.round(b * 0.15);
    const darkBg = `rgba(${darkR},${darkG},${darkB},0.85)`;
    sheet.style.background = darkBg;
    
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
        logInfoBoxState('Attempting to close bottom sheet');
        if (!currentInfoBox) {
            logInfoBoxState('No currentInfoBox to close (bottom sheet)');
            return; // Prevent double-closing
        }
        sheet.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.classList.remove('bottom-sheet-open');
        
        let timeoutId = null; // Declare timeoutId here for this scope

        const handleTransitionEnd = () => {
            logInfoBoxState('Bottom sheet transition ended.');
            if (timeoutId) clearTimeout(timeoutId); // Clear timeout if transition completes
            if (currentInfoBox) { // Check again in case of race condition
                sheet.remove();
                overlay.remove();
                currentInfoBox = null;
                logInfoBoxState('Bottom sheet removed and currentInfoBox nulled.');
            }
            // Manually call onBoxClosed for bottom sheet to ensure queued box opens
            onBoxClosed();
        };
        
        sheet.addEventListener('transitionend', handleTransitionEnd, { once: true });

        // Fallback timeout in case transitionend doesn't fire
        timeoutId = setTimeout(() => {
            logInfoBoxState('Bottom sheet close timeout fallback triggered.');
            if (currentInfoBox) { // Only run if not already handled by transitionend
                sheet.remove();
                if (overlay) overlay.remove();
                currentInfoBox = null;
                logInfoBoxState('Bottom sheet removed and currentInfoBox nulled by timeout.');
            }
            onBoxClosed();
        }, 400); // Slightly longer than 0.3s CSS transition
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
    const closeBtn = sheet.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.style.zIndex = '2000'; // Ensure on top
      closeBtn.style.pointerEvents = 'auto';
      closeBtn.addEventListener('click', close);
      closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        close();
      });
    } else {
      // Defensive: log warning if not found
      console.warn('Mobile info popup: close button not found');
    }
    overlay.addEventListener('click', close);

    // Prevent clicks from propagating through the sheet
    sheet.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    currentInfoBox = sheet;
    logInfoBoxState(`currentInfoBox set to bottom sheet for POI: ${poi.name}`);
    return { sheet, overlay, close };
}

function openInfoBox(poi, poiPosition) {
    logInfoBoxState(`Calling openInfoBox for POI: ${poi.name}`);
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        return createBottomSheet(poi);
    }

    infoBoxAnimating = true;
    logInfoBoxState('infoBoxAnimating set to true (openInfoBox)');

    // Project POI position to screen
    const pos = poiPosition.clone();
    pos.project(camera);
    const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth + 20;
    const screenY = (-pos.y * 0.5 + 0.5) * window.innerHeight - 20;

    // Animation timing
    const totalDuration = 420; // ms
    const contentFadeStart = Math.round(totalDuration * 0.7);

    // --- Measure dimensions ---
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

    const closeBtnSpace = 36;
    const closeBtnMargin = 10;
    const sidePadding = 22;
    const minBoxWidth = 180;
    const maxBoxWidth = 340;
    let boxWidth = titleWidth + closeBtnSpace + sidePadding + closeBtnMargin;
    boxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, boxWidth));

    // --- Measure content height ---
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.width = boxWidth + 'px';
    measurer.style.padding = '22px 22px 18px 22px';
    measurer.style.fontFamily = 'Courier New, monospace';
    measurer.innerHTML = `
        <h3 style="margin:0 0 10px 0;font-size:20px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#${poi.color.toString(16)}">${poi.name}</h3>
        <p style="margin:0">${poi.description}</p>
        <div class="timestamp">${new Date().toISOString().replace('T', ' ').slice(0, -5)}</div>
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
    wrapper.style.width = boxWidth + 'px';

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'info-box';
    panel.style.position = 'relative';
    panel.style.height = '100%';
    panel.style.width = '100%';

    // Calculate background color
    const color = typeof poi.color === 'number' ? poi.color : parseInt(poi.color, 16);
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const darkR = Math.round(r * 0.03);
    const darkG = Math.round(g * 0.03);
    const darkB = Math.round(b * 0.03);
    const darkBg = `rgba(${darkR},${darkG},${darkB},0.92)`;
    
    panel.style.background = darkBg;
    panel.style.color = '#fff';
    panel.style.padding = '22px 22px 18px 22px';
    panel.style.borderRadius = '5px';
    panel.style.border = `1px solid #${poi.color.toString(16)}`;
    panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    panel.style.overflow = 'hidden';
    panel.style.boxSizing = 'border-box';
    panel.style.transform = 'scaleX(0)';
    
    // Create content
    const content = document.createElement('div');
    content.className = 'info-box-content';
    content.style.opacity = '0';
    content.style.position = 'relative';
    content.innerHTML = measurer.innerHTML;

    // Create close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '6px';
    closeBtn.style.right = '6px';
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
    closeBtn.onclick = () => hideInfoBox();

    // Assemble and add to DOM
    panel.appendChild(closeBtn);
    panel.appendChild(content);
    wrapper.appendChild(panel);
    infoBoxContainer.appendChild(wrapper);
    currentInfoBox = wrapper;

    // Store position data
    currentInfoBox.dataset.poiPositionX = poiPosition.x;
    currentInfoBox.dataset.poiPositionY = poiPosition.y;
    currentInfoBox.dataset.poiPositionZ = poiPosition.z;

    // Force reflow before starting animation
    void panel.offsetWidth;

    // Start unified animation sequence
    const startAnimation = () => {
        logInfoBoxState('Starting desktop info box open animation.');
        panel.style.transform = 'scaleX(1)';
        
        // Add transition end handler to mark animation as complete
        panel.addEventListener('transitionend', function handleTransitionEnd(event) {
            if (event.propertyName === 'transform') {
                content.style.opacity = '1';
                infoBoxAnimating = false;
                logInfoBoxState('Desktop info box open animation complete. infoBoxAnimating set to false.');
                panel.removeEventListener('transitionend', handleTransitionEnd);
            }
        });
    };

    // Ensure DOM is ready before starting animation
    requestAnimationFrame(() => {
        requestAnimationFrame(startAnimation);
    });
}

export function showInfoBox(poi, poiPosition) {
    logInfoBoxState(`Calling showInfoBox for POI: ${poi.name}`);
    // If mobile, remove any existing desktop info box
    if (window.innerWidth <= MOBILE_BREAKPOINT && currentInfoBox && !currentInfoBox.classList.contains('bottom-sheet')) {
        logInfoBoxState('Mobile breakpoint: Hiding existing desktop info box.');
        hideInfoBox();
        return;
    }

    // If animating or a box is open, close it first and queue the new one
    if (infoBoxAnimating || currentInfoBox) {
        logInfoBoxState('Info box animating or already open. Queuing new info box and hiding current.');
        queuedInfoBox = { poi, poiPosition };
        hideInfoBox();
        return;
    }
    
    // Otherwise, open immediately
    logInfoBoxState('No info box animating or open. Opening immediately.');
    openInfoBox(poi, poiPosition);
}

export function hideInfoBox() {
    logInfoBoxState('Calling hideInfoBox.');
    if (!currentInfoBox) {
        logInfoBoxState('No info box to hide.');
        return;
    }

    const boxToClose = currentInfoBox; // Store reference to the box being closed
    currentInfoBox = null; // Immediately nullify currentInfoBox to prevent new boxes from queuing
    logInfoBoxState('currentInfoBox nulled (hideInfoBox).');

    infoBoxAnimating = true;
    logInfoBoxState('infoBoxAnimating set to true (hideInfoBox)');

    // Handler for when box is fully closed
    const onBoxFullyClosed = () => {
        logInfoBoxState('onBoxFullyClosed triggered.');
        infoBoxAnimating = false;
        logInfoBoxState('infoBoxAnimating set to false.');
        // If we have a queued box, open it
        if (queuedInfoBox) {
            logInfoBoxState('Queued info box found, opening it now.');
            const { poi, poiPosition } = queuedInfoBox;
            queuedInfoBox = null;
            openInfoBox(poi, poiPosition);
        }
        document.dispatchEvent(new Event('boxClosed'));
    };

    // Handle bottom sheet closing
    if (boxToClose.classList.contains('bottom-sheet')) {
        boxToClose.classList.remove('open');
        const overlay = document.querySelector('.overlay');
        if (overlay) overlay.classList.remove('visible');
        document.body.classList.remove('bottom-sheet-open');
        
        let mobileTimeoutId = null;

        boxToClose.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'transform' || event.propertyName === 'opacity') {
                logInfoBoxState('Bottom sheet close transition ended.');
                if (mobileTimeoutId) clearTimeout(mobileTimeoutId);
                boxToClose.remove();
                if (overlay) overlay.remove();
                onBoxFullyClosed();
            }
        }, { once: true });
        
        mobileTimeoutId = setTimeout(() => {
            logInfoBoxState('Bottom sheet close timeout fallback triggered.');
            if (boxToClose.parentNode) {
                boxToClose.remove();
                if (overlay) overlay.remove();
                logInfoBoxState('Bottom sheet removed by timeout.');
            }
            onBoxFullyClosed();
        }, 400);
        
        return;
    }

    const panel = boxToClose.querySelector('.info-box');
    if (!panel) {
        if (boxToClose.parentNode) boxToClose.parentNode.removeChild(boxToClose);
        onBoxFullyClosed();
        return;
    }

    const content = panel.querySelector('.info-box-content');
    const closeBtn = panel.querySelector('.close-btn');
    
    if (content) content.style.opacity = '0';
    if (closeBtn) closeBtn.style.display = 'none';

    requestAnimationFrame(() => {
        panel.style.transform = 'scaleX(0)';
        
        let desktopTimeoutId = null;

        panel.addEventListener('transitionend', function handleTransitionEnd(event) {
            if (event.propertyName === 'transform') {
                logInfoBoxState('Desktop info box close transition ended.');
                if (desktopTimeoutId) clearTimeout(desktopTimeoutId);
                if (boxToClose.parentNode) {
                    boxToClose.parentNode.removeChild(boxToClose);
                }            
                onBoxFullyClosed();
            }
        }, { once: true });

        desktopTimeoutId = setTimeout(() => {
            logInfoBoxState('Desktop info box close timeout fallback triggered.');
            if (boxToClose.parentNode) {
                boxToClose.parentNode.removeChild(boxToClose);
                logInfoBoxState('Desktop info box removed by timeout.');
            }
            onBoxFullyClosed();
        }, 500);
    });
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
  /**
   * Custom Camera Scroll vs Native Scroll
   * -------------------------------------
   * To switch between custom camera scroll (3D view follows finger) and native scroll:
   * - Set USE_CUSTOM_SCROLL = true for custom camera scroll (default, recommended for 3D scenes).
   * - Set USE_CUSTOM_SCROLL = false to allow native browser scrolling (e.g., for accessibility/testing).
   * - You can toggle based on user agent, feature flag, or a query param.
   *
   * Example:
   *   const USE_CUSTOM_SCROLL = window.innerWidth <= MOBILE_BREAKPOINT;
   *   // or
   *   const USE_CUSTOM_SCROLL = !/iPhone|iPad|Android/i.test(navigator.userAgent);
   */
  const USE_CUSTOM_SCROLL = true;
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const multiplier = isMobile ? MOBILE_SCROLL_MULTIPLIER : 1;

  window.addEventListener('wheel', (e) => {
    if (!USE_CUSTOM_SCROLL) return;
    e.preventDefault();
    scrollState.velocity -= e.deltaY * 0.01 * multiplier;
  }, { passive: false });

  let touchStartY = 0;
  let lastTouchTime = 0;
  let lastTouchY = 0;
  let lastVelocity = 0;
  let lastCameraY = 0;

  window.addEventListener('touchstart', (e) => {
    if (!USE_CUSTOM_SCROLL) return;
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    lastTouchTime = performance.now();
    lastVelocity = 0;
    lastCameraY = camera.position.y;
    scrollState.velocity = 0;
    scrollState.isDragging = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (!USE_CUSTOM_SCROLL) return;
    if (e.touches.length !== 1) return;
    e.preventDefault(); // Prevent native scroll
    const currentY = e.touches[0].clientY;
    const now = performance.now();
    const deltaY = currentY - lastTouchY;
    const deltaTime = now - lastTouchTime;
    if (deltaTime > 0) {
      lastVelocity = deltaY / deltaTime;
    }
    // Slightly increase sensitivity for more natural tracking
    const canvas = renderer.domElement;
    const canvasHeight = canvas.clientHeight || window.innerHeight;
    const frustumHeight = camera.top - camera.bottom;
    const pixelToWorld = (frustumHeight / canvasHeight) * 0.65;
    const totalDelta = currentY - touchStartY;
    const cameraViewHeight = camera.top - camera.bottom;
    const clampMinY = Math.min(...pois.map(p => p.position.y)) + cameraViewHeight / 2 -  (window.innerWidth <= MOBILE_BREAKPOINT ? 130 : 100);
    const clampMaxY = Math.max(...pois.map(p => p.position.y)) - cameraViewHeight / 2 + 100;
    let targetY = lastCameraY + totalDelta * pixelToWorld;
    targetY = Math.max(clampMinY, Math.min(clampMaxY, targetY));
    scrollState.dragY = targetY;
    scrollState.velocity = 0;
    lastTouchY = currentY;
    lastTouchTime = now;
  }, { passive: false });

  // Smooth transition from drag to momentum
  let dragReleaseY = null;
  let dragReleaseFrames = 0;
  window.addEventListener('touchend', () => {
    if (!USE_CUSTOM_SCROLL) return;
    scrollState.isDragging = false;
    scrollState.dragY = null;
    // Calculate pixel-to-world ratio for velocity
    const canvas = renderer.domElement;
    const canvasHeight = canvas.clientHeight || window.innerHeight;
    const frustumHeight = camera.top - camera.bottom;
    const pixelToWorld = (frustumHeight / canvasHeight) * 0.65;
    // Set velocity in world units per ms, then scale to per frame (assuming 60fps, ~16ms per frame)
    scrollState.velocity = lastVelocity * pixelToWorld * 16; // 16ms per frame
    // Clamp velocity
    if (scrollState.velocity > MAX_SCROLL_SPEED) scrollState.velocity = MAX_SCROLL_SPEED;
    if (scrollState.velocity < -MAX_SCROLL_SPEED) scrollState.velocity = -MAX_SCROLL_SPEED;
  });

  // Patch for main.js animate loop: interpolate camera position after drag ends
  if (typeof window !== 'undefined') {
    window.__interactionDragRelease = { get dragReleaseY() { return dragReleaseY; }, set dragReleaseY(v) { dragReleaseY = v; }, get dragReleaseFrames() { return dragReleaseFrames; }, set dragReleaseFrames(v) { dragReleaseFrames = v; } };
  }
}

// Resize event
export function setupResizeHandler(onResize) {
    window.addEventListener('resize', onResize);
}
