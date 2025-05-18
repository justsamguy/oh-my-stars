import { events } from '../core/events';
import 'jest';
test('event bus on/emit/off', () => {
    const handler = jest.fn();
    events.on('mouse:move', handler);
    events.emit('mouse:move', { x: 123, y: 456 });
    expect(handler).toHaveBeenCalledWith({ x: 123, y: 456 });
    events.off('mouse:move', handler);
    events.emit('mouse:move', { x: 789, y: 101 });
    expect(handler).toHaveBeenCalledTimes(1);
});
