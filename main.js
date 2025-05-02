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
headerDiv.innerHTML = '<h1>Oh My Stars</h1>';
headerDiv.style.width = '250px';
headerDiv.style.fontSize = '0.25em';
headerDiv.style.background = 'none';
headerDiv.style.color = '#afafaf';
headerDiv.style.pointerEvents = 'auto';
// Add Montserrat font
headerDiv.style.fontFamily = "'Montserrat', sans-serif";
const headerObj = new CSS3DObject(headerDiv);
const headerWorldHeight = 70; // Sets the height of the header in the world space
headerObj.position.set(0, maxY + paddingY - headerWorldHeight / 2, 0);
headerObj.rotation.set(0, 0, 0);
scene.add(headerObj);

// Add mouse event handling for header glow effect
headerDiv.addEventListener('mousemove', (e) => {
    const title = headerDiv.querySelector('h1');
    const rect = title.getBoundingClientRect();
    const distance = Math.hypot(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2)
    );
    if (distance < 100) {
        title.classList.add('glow');
    } else {
        title.classList.remove('glow');
    }
});

headerDiv.addEventListener('mouseleave', () => {
    headerDiv.querySelector('h1').classList.remove('glow');
});

// Footer configuration
const footerConfig = {
    logo: {
        text: 'Oh My Stars',
        description: 'An interactive journey through the cosmos. Explore stellar phenomena, trading hubs, and the mysteries of deep space.'
    },
    columns: [
        {
            title: 'Navigation',
            links: [
                { text: 'Star Map', href: '#map' },
                { text: 'Points of Interest', href: '#poi' },
                { text: 'About', href: '#about' }
            ]
        },
        {
            title: 'Resources',
            links: [
                { text: 'Documentation', href: '#docs' },
                { text: 'Updates', href: '#updates' },
                { text: 'FAQ', href: '#faq' }
            ]
        },
        {
            title: 'Community',
            links: [
                { text: 'Forums', href: '#forums' },
                { text: 'Discord', href: '#discord' },
                { text: 'GitHub', href: '#github' }
            ]
        },
        {
            title: 'Legal',
            links: [
                { text: 'Privacy', href: '#privacy' },
                { text: 'Terms', href: '#terms' },
                { text: 'Contact', href: '#contact' }
            ]
        }
    ],
    social: [
        { icon: '🌟', href: '#github', label: 'GitHub' },
        { icon: '💫', href: '#discord', label: 'Discord' },
        { icon: '✨', href: '#twitter', label: 'Twitter' }
    ],
    copyright: '© S&A 2025'
};

// Footer
const footerDiv = document.createElement('div');
footerDiv.className = 'css3d-element css3d-footer';
footerDiv.style.width = '900px';
footerDiv.style.fontSize = '2px';
footerDiv.style.background = 'rgba(0,0,0,0.5)';
footerDiv.style.color = '#9f9f9f';
footerDiv.style.pointerEvents = 'auto';
footerDiv.style.padding = '24px 0 20px 0';
footerDiv.style.boxSizing = 'border-box';
footerDiv.style.borderRadius = '12px';
footerDiv.style.fontFamily = "'Montserrat', sans-serif";

// Generate footer HTML
footerDiv.innerHTML = `
    <style>
        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            gap: 20px;
            padding: 0 30px;
            margin-bottom: 20px;
        }
        .footer-logo {
            font-size: 7px;
            color: #fff;
            margin-bottom: 8px;
        }
        .footer-description {
            font-size: 4px;
            line-height: 1.5;
            color: #aaa;
        }
        .footer-column h3 {
            font-size: 5px;
            color: #fff;
            margin-bottom: 10px;
        }
        .footer-column ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .footer-column ul li {
            margin-bottom: 6px;
        }
        .footer-column a {
            font-size: 4px;
            color: #aaa;
            text-decoration: none;
            transition: color 0.3s;
        }
        .footer-column a:hover {
            color: #fff;
        }
        .footer-bottom {
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 15px;
            padding: 15px 30px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .social-links {
            display: flex;
            gap: 12px;
        }
        .social-links a {
            font-size: 6px;
            color: #aaa;
            text-decoration: none;
            transition: color 0.3s;
        }
        .social-links a:hover {
            color: #fff;
        }
        .copyright {
            font-size: 4px;
            color: #666;
        }
    </style>
    <div class="footer-grid">
        <div class="footer-brand">
            <h2 class="footer-logo">${footerConfig.logo.text}</h2>
            <p class="footer-description">${footerConfig.logo.description}</p>
        </div>
        ${footerConfig.columns.map(column => `
            <div class="footer-column">
                <h3>${column.title}</h3>
                <ul>
                    ${column.links.map(link => `
                        <li><a href="${link.href}">${link.text}</a></li>
                    `).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
    <div class="footer-bottom">
        <div class="social-links">
            ${footerConfig.social.map(item => `
                <a href="${item.href}" aria-label="${item.label}">${item.icon}</a>
            `).join('')}
        </div>
        <div class="copyright">${footerConfig.copyright}</div>
    </div>
`;

const footerObj = new CSS3DObject(footerDiv);
footerObj.position.set(0, minY - paddingY + 40, 0); // Add to Y position to move it up
footerObj.rotation.set(0, 0, 0);
scene.add(footerObj);

// Add mouse event handling for footer glow effect
footerDiv.addEventListener('mousemove', (e) => {
    const links = footerDiv.querySelectorAll('nav a');
    links.forEach(link => {
        const rect = link.getBoundingClientRect();
        const distance = Math.hypot(
            e.clientX - (rect.left + rect.width / 2),
            e.clientY - (rect.top + rect.height / 2)
        );
        if (distance < 50) {
            link.classList.add('glow');
        } else {
            link.classList.remove('glow');
        }
    });
});

footerDiv.addEventListener('mouseleave', () => {
    footerDiv.querySelectorAll('nav a').forEach(link => {
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
