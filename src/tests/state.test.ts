import 'jest';
import { appState } from '../core/state';

test('state manager get/set', () => {
  appState.set('cameraY', 42);
  expect(appState.get('cameraY')).toBe(42);
  appState.set('selectedPOI', { name: 'test', position: { x: 0, y: 0, z: 0 }, color: 0xffffff, description: '' });
  expect(appState.get('selectedPOI')?.name).toBe('test');
});
