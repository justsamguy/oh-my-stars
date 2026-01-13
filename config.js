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
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'JustSamGuy', url: 'https://justsamguy.myportfolio.com/', description: 'Sam\'s first brand. Initially concieved as an online alias, it has since grown to represent creations in the art & entertainment categories.', timestamp: '2020' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Clarenova', url: '', description: 'What started as the financial operations for Sam\'s body of work has become a brand that represents the values of clarity and simplicity in a world of complex technicalities.', timestamp: '2024' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: "WoodLab Website", url: 'https://woodlab.co', description: 'As you can see... I make websites for fun.', timestamp: '2023-03-10 09:15:00' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'WoodLab Demo App', url: 'https://justsamguy.github.io/WL-Configurator-Demo/', description: 'Invented as the solution to a custom sales process requiring millions of SKUs - I\'ll let the app speak for itself.', timestamp: '2026-01-01 16:20:00' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'WoodLab Database', url: '', description: 'What started as a garage business has become a national leader in a nearly unscalable industry. TBA.', timestamp: '2024-05-12 11:00:00' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Sheets Accounting App', url: 'https://docs.google.com/spreadsheets/d/1LOXc-PFJVduJdq-NXeYt1z7tl3AqO55FhJyerlK5Fls/edit?usp=sharing', description: 'A small side project, based on the Google Sheets Yearly Budget template as a way to track and plan money without using a dedicated accounting app.', timestamp: '2025-12-31 13:30:00' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Coming Soon', url: '', description: '404 project not found', timestamp: '2024-12-18 00:00:00' }
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
