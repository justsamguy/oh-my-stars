// Entry point for the modularized star map app
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'; // Add CSS3DObject import
import { pois, STAR_COUNT, SCROLL_DAMPING, MAX_SCROLL_SPEED } from './config.js';
import { scene, camera, renderer, viewportWidth, viewportHeight, getViewportHeight, getViewportWidth } from './sceneSetup.js';
import { createAllStars, updateStars } from './stars.js';
import { createAllPOIs, createConnectingLines, updatePOIs } from './poi.js';
import { setupMouseMoveHandler, setupScrollHandler, setupResizeHandler, setupClickHandler, mouseWorldPosition, scrollState, raycaster, currentInfoBox } from './interaction.js'; // Import currentInfoBox

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

// --- Fix scroll clamping: clamp camera based on POI positions, not header/footer ---
let yPositions = pois.map(p => p.position.y);
let maxY = Math.max(...yPositions);
let minY = Math.min(...yPositions);
const paddingY = 100; // Keep this for positioning

// Header
const headerDiv = document.createElement('div');
headerDiv.className = 'css3d-element css3d-header';
headerDiv.setAttribute('data-text', 'Oh My Stars'); // Store original text
headerDiv.style.width = '250px';
headerDiv.style.fontSize = '0.25em';
headerDiv.style.background = 'none';
headerDiv.style.color = '#afafaf';
headerDiv.style.pointerEvents = 'auto';
headerDiv.style.fontFamily = "'Montserrat', sans-serif";

// Create spans for each character
const headerText = headerDiv.getAttribute('data-text');
headerDiv.innerHTML = `<h1>${[...headerText].map(char => 
    `<span class="glow-char">${char}</span>`
).join('')}</h1>`;

const headerObj = new CSS3DObject(headerDiv);
const headerWorldHeight = 70; // Sets the height of the header in the world space
headerObj.position.set(0, maxY + paddingY - headerWorldHeight / 2, 0);
headerObj.rotation.set(0, 0, 0);
scene.add(headerObj);

// Update mouse event handling for character-based glow
headerDiv.addEventListener('mousemove', (e) => {
    const chars = headerDiv.querySelectorAll('.glow-char');
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
        if (distance < 30) { // Smaller radius for individual characters
            char.classList.add('glow');
        } else {
            char.classList.remove('glow');
        }
    });
});

headerDiv.addEventListener('mouseleave', () => {
    headerDiv.querySelectorAll('.glow-char').forEach(char => {
        char.classList.remove('glow');
    });
});

// Footer configuration
const footerConfig = {
    brand: {
        text: 'Oh My Stars',
        description: 'An interactive journey through the cosmos. Explore stellar phenomena and the mysteries of deep space.'
    },
    navigation: {
        title: 'Navigation',
        links: [
            { text: 'Star Map', href: '#map' },
            { text: 'Points of Interest', href: '#poi' },
            { text: 'Documentation', href: '#docs' },
            { text: 'Updates', href: '#updates' },
            { text: 'About', href: '#about' }
        ]
    },
    copyright: '© 2025 S&A All rights reserved.'
};

// Footer
const footerDiv = document.createElement('div');
footerDiv.className = 'css3d-element css3d-footer';
footerDiv.style.width = '400px';  // Slightly reduced width
footerDiv.style.fontSize = '1.5px';  // Reduced base font size
footerDiv.style.background = 'rgba(0,0,0,0.5)';
footerDiv.style.color = '#9f9f9f';
footerDiv.style.pointerEvents = 'auto';
footerDiv.style.padding = '8px 15px';  // Reduced padding
footerDiv.style.boxSizing = 'border-box';
footerDiv.style.borderRadius = '8px';
footerDiv.style.fontFamily = "'Montserrat', sans-serif";
footerDiv.style.height = '30px';  // Fixed height to match footer area

// Generate footer HTML with adjusted styles
footerDiv.innerHTML = `
    <style>
        .footer-content {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 6px;
        }
        .footer-brand {
            flex: 1;
            text-align: left;
        }
        .footer-brand h2 {
            font-size: 5px;
            color: #fff;
            margin: 0 0 4px 0;
        }
        .footer-brand p {
            font-size: 3px;
            line-height: 1.3;
            color: #aaa;
            margin: 0;
        }
        .footer-nav {
            width: 90px;
        }
        .footer-nav h3 {
            font-size: 4px;
            color: #fff;
            margin: 0 0 4px 0;
            text-align: left;
        }
        .footer-nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .footer-nav a {
            font-size: 3px;
            color: #aaa;
            text-decoration: underline;
            transition: color 0.3s, text-shadow 0.3s;
            display: inline-block;
        }
        .footer-nav a:hover,
        .footer-nav a.glow {
            color: #fff;
            text-shadow: 0 0 8px rgba(255,255,255,0.8),
                         0 0 16px rgba(255,255,255,0.5),
                         0 0 24px rgba(255,255,255,0.3);
        }
        .copyright {
            font-size: 2.75px;
            color: #666;
            text-align: center;
            border-top: 0.5px solid rgba(255,255,255,0.1);
            padding-top: 4px;
            margin-top: 4px;
        }
    </style>
    <div class="footer-content">
        <div class="footer-brand">
            <h2>${footerConfig.brand.text}</h2>
            <p>${footerConfig.brand.description}</p>
        </div>
        <nav class="footer-nav">
            <h3>${footerConfig.navigation.title}</h3>
            <ul>
                ${footerConfig.navigation.links.map(link => `
                    <li><a href="${link.href}">${link.text}</a></li>
                `).join('')}
            </ul>
        </nav>
    </div>
    <div class="copyright">${footerConfig.copyright}</div>
`;

const footerObj = new CSS3DObject(footerDiv);
footerObj.position.set(0, minY - paddingY + 15, 0);  // Moved up by adjusting the Y offset
footerObj.rotation.set(0, 0, 0);
scene.add(footerObj);

// Update footer event handlers
footerDiv.addEventListener('mousemove', (e) => {
    const links = footerDiv.querySelectorAll('.footer-nav a');
    links.forEach(link => {
        const rect = link.getBoundingClientRect();
        const distance = Math.hypot(
            e.clientX - (rect.left + rect.width / 2),
            e.clientY - (rect.top + rect.height / 2)
        );
        if (distance < 30) {  // Reduced distance for tighter interaction
            link.classList.add('glow');
        } else {
            link.classList.remove('glow');
        }
    });
});

footerDiv.addEventListener('mouseleave', () => {
    footerDiv.querySelectorAll('.footer-nav a').forEach(link => {
        link.classList.remove('glow');
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
    const clampMinY = Math.min(minY, maxY) + cameraViewHeight / 2 - paddingY;
    const clampMaxY = Math.max(minY, maxY) - cameraViewHeight / 2 + paddingY;
    camera.position.y = Math.max(clampMinY, Math.min(clampMaxY, camera.position.y));

    // No need to update projection matrix here unless zoom changes
    // camera.updateProjectionMatrix();

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

        // Use canvas dimensions for screen coordinate calculation
        const canvasRect = canvas.getBoundingClientRect(); // Get canvas position and size
        const screenX = (pos.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left + 20; // Add canvas left offset
        const screenY = (-pos.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top - 20; // Add canvas top offset

        currentInfoBox.style.left = `${screenX}px`;
        currentInfoBox.style.top = `${screenY}px`;
    }

    // Keep header/footer in correct X/Z, but let them scroll with the scene
    headerObj.position.x = 0;
    headerObj.position.z = 0;
    headerObj.position.y = maxY + paddingY - headerWorldHeight / 2;
    footerObj.position.x = 0;
    footerObj.position.z = 0;
    footerObj.position.y = minY - paddingY + 30;

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
