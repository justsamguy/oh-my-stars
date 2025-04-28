// Configuration and constants for the star map app
import * as THREE from 'three';

// Generate colors across spectrum for POIs
export function generateSpectralColors(count) {
    return Array.from({length: count}, (_, i) => {
        const hue = (i / count);
        const color = new THREE.Color().setHSL(hue, 0.7, 0.7);
        return color.getHex();
    });
}

export const poiColors = generateSpectralColors(7);
export const pois = [
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'Solara Prime', description: 'Ancient homeworld of the Lumina civilization.' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Nebula X-7', description: 'Dense stellar nursery, home to new star formation.' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: "K'tharr Station", description: 'Major trade hub and diplomatic center.' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'Void Gate Alpha', description: 'Primary FTL transit point for the sector.' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'Research Post 7', description: 'Advanced xenoarchaeological research facility.' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Mining Colony Beta', description: 'Rich in rare earth elements and deuterium.' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Frontier Station', description: 'Last outpost before uncharted space.' }
];

export const STAR_COUNT = 9000;
export const SCROLL_DAMPING = 0.95;
export const MAX_SCROLL_SPEED = 2;
export const MAX_INTERACTION_RADIUS = 75.0;
export const MIN_INTERACTION_RADIUS = 15.0;
