import * as THREE from 'three';
import { pois } from './config.js';

// Inject CSS styles
const style = `
    <style>
        * { margin: 0; padding: 0; }
        body, html { 
            overflow: hidden; 
            background: #000;
            height: 100vh;
            width: 100vw;
        }
        canvas { 
            position: fixed;
            top: 0;
            left: 0;
        }
        .info-box {
            font-family: 'Courier New', monospace !important;
        }
        .info-box h3 {
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        .info-box .timestamp {
            font-size: 0.8em;
            color: #666;
            margin-top: 10px;
        }
        .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            color: #666;
            width: 20px;
            height: 20px;
            text-align: center;
            line-height: 20px;
            transition: color 0.2s;
        }
        .close-btn:hover {
            color: #fff;
        }
    </style>
`;
document.head.insertAdjacentHTML('beforeend', style);

// Scene Setup
export const scene = new THREE.Scene();

// Calculate viewport dimensions based on POI data
export function getViewportHeight() {
    const poiHeight = Math.abs(pois[pois.length - 1].position.y - pois[0].position.y);
    const mobilePadding = window.innerWidth <= 600 ? 600 : 0;
    // Increase viewport height for better zoom
    return poiHeight * 1.8 + mobilePadding; // Changed from 1.1 to 1.8
}
export function getViewportWidth() {
    const vh = getViewportHeight();
    const aspect = window.innerWidth / window.innerHeight;
    // Increase viewport width proportionally
    return vh * aspect * 1.2; // Added 1.2 multiplier for wider view
}
let viewportHeight = getViewportHeight();
let viewportWidth = getViewportWidth();

// Camera setup
export const camera = new THREE.OrthographicCamera(
    viewportWidth / -2,
    viewportWidth / 2,
    viewportHeight / 2,
    viewportHeight / -2,
    -1000,
    1000
);

// Adjust initial camera position
camera.position.set(0, (pois[0].position.y + pois[pois.length - 1].position.y) / 2, 150); // Increased Z from 100 to 150
camera.lookAt(0, camera.position.y, 0);

// Renderer setup
const canvas = document.getElementById('bg') || document.createElement('canvas');
canvas.id = 'bg';
export const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.sortObjects = true;
renderer.autoClear = false;
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
if (!document.body.contains(renderer.domElement)) {
    document.body.appendChild(renderer.domElement);
}

// Info box container
export const infoBoxContainer = document.createElement('div');
infoBoxContainer.id = 'infoBoxContainer';
infoBoxContainer.style.position = 'absolute';
infoBoxContainer.style.top = '0';
infoBoxContainer.style.left = '0';
infoBoxContainer.style.width = '100%';
infoBoxContainer.style.height = '100%';
infoBoxContainer.style.pointerEvents = 'none';
document.body.appendChild(infoBoxContainer);

// Background plane
const bgGeometry = new THREE.PlaneGeometry(viewportWidth * 2, viewportHeight * 1.5);
const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const background = new THREE.Mesh(bgGeometry, bgMaterial);
background.position.z = -200;
scene.add(background);

export { viewportWidth, viewportHeight };
