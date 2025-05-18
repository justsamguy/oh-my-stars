import * as THREE from 'three';
import type { AppConfig, POI } from './types.js';

export const config: AppConfig = {
  starCount: {
    base: 9000,
    mobile: 4500
  },
  scrollDamping: 0.95,
  maxScrollSpeed: 2,
  interactionRadius: {
    max: 75.0,
    min: 15.0
  },
  mobile: {
    breakpoint: 600,
    scrollMultiplier: 2,
    hitboxScale: 12
  }
};

// Generate colors across spectrum for POIs
export function generateSpectralColors(count: number): number[] {
    return Array.from({length: count}, (_, i) => {
        const hue = (i / count);
        const color = new THREE.Color().setHSL(hue, 0.7, 0.7);
        return color.getHex();
    });
}

export const poiColors: number[] = generateSpectralColors(7);

export const pois: POI[] = [
    { position: new THREE.Vector3(-25, 60, 0), color: poiColors[0], name: 'JustSamGuy      ', description: 'Sam\'s first brand. Initially concieved as an online alias, it has since grown to represent creations that fall into art & entertainment.' },
    { position: new THREE.Vector3(-20, 30, 0), color: poiColors[1], name: 'Clarenova', description: 'What started as the financial operations for Sam\'s body of work has become a brand that represents the values of clarity and simplicity in a world of complex technicalities.' },
    { position: new THREE.Vector3(35, -20, 0), color: poiColors[2], name: "S&A", description: 'S&A is the brand representing the mastermind duo. All individual brands are managed directly by Sam and Allena.' },
    { position: new THREE.Vector3(40, -80, 0), color: poiColors[3], name: 'WoodLab Database', description: 'What started as a garage business has become a national leader in a nearly unscalable industry.' },
    { position: new THREE.Vector3(-35, -130, 0), color: poiColors[4], name: 'WoodLab Configurator UI', description: 'What was just another experiment went successful - I\'ll let the app speak for itself.' },
    { position: new THREE.Vector3(15, -190, 0), color: poiColors[5], name: 'Mining Colony Beta', description: 'Rich in rare earth elements and deuterium.' },
    { position: new THREE.Vector3(-20, -240, 0), color: poiColors[6], name: 'Frontier Station', description: 'Last outpost before uncharted space.' }
];

export const BASE_STAR_COUNT = 9000;
export const MOBILE_STAR_COUNT = BASE_STAR_COUNT * 0.5;
export const SCROLL_DAMPING = 0.95;
export const MAX_SCROLL_SPEED = 2;
export const MAX_INTERACTION_RADIUS = 75.0;
export const MIN_INTERACTION_RADIUS = 15.0;
export const MOBILE_BREAKPOINT = 600;
export const MOBILE_SCROLL_MULTIPLIER = 2;
export const POI_HITBOX_SCALE = window.innerWidth <= MOBILE_BREAKPOINT ? 12 : 8; // Increased mobile hitbox
export const POI_INTERACTION_THRESHOLD = window.innerWidth <= MOBILE_BREAKPOINT ? 0.7 : 0.5; // More forgiving on mobile