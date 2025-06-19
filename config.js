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
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'JustSamGuy', url: 'https://justsamguy.myportfolio.com/', description: 'Sam\'s first brand. Initially concieved as an online alias, it has since grown to represent creations that fall into art & entertainment.' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Clarenova', url: '', description: 'What started as the financial operations for Sam\'s body of work has become a brand that represents the values of clarity and simplicity in a world of complex technicalities.' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: "WoodLab Website", url: 'https://woodlab.co', description: 'As you can see... I make websites for fun.' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'WoodLab Demo App', url: 'https://github.com/justsamguy/WL-Configurator-Demo', description: 'Status: In ProgressWhat was just another experiment went successful - I\'ll let the app speak for itself.' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'WoodLab Database', url: '', description: 'What started as a garage business has become a national leader in a nearly unscalable industry. TBA.' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Coming Soon', url: '', description: 'No one has claimed this spot (yet).' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Coming Soon', url: '', description: '404 project not found' }
];

export const BASE_STAR_COUNT = 9000;
export const MOBILE_STAR_COUNT = BASE_STAR_COUNT * 0.65;
export const SCROLL_DAMPING = 0.95;
export const MAX_SCROLL_SPEED = 2;
export const MAX_INTERACTION_RADIUS = 75.0;
export const MIN_INTERACTION_RADIUS = 15.0;
export const MOBILE_BREAKPOINT = 600;
export const MOBILE_SCROLL_MULTIPLIER = 2.5;
export const POI_HITBOX_SCALE = window.innerWidth <= MOBILE_BREAKPOINT ? 12 : 8; // Increased mobile hitbox
export const POI_INTERACTION_THRESHOLD = window.innerWidth <= MOBILE_BREAKPOINT ? 0.7 : 0.5; // More forgiving on mobile
