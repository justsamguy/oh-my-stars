// Utility functions for the star map app
import * as THREE from 'three';

// Convert mouse position to world coordinates
export function getWorldPosition(clientX, clientY, camera, renderer) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const near = new THREE.Vector3(x, y, -1);
    near.unproject(camera);
    const far = new THREE.Vector3(x, y, 1);
    far.unproject(camera);
    const direction = far.sub(near).normalize();
    const t = -near.z / direction.z;
    return new THREE.Vector3(
        near.x + direction.x * t,
        near.y + direction.y * t,
        0
    );
}
