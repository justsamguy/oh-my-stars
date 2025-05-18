import 'jest';
import { logInfo, logWarn, logError } from './logger.js';

test('logger functions', () => {
  expect(() => logInfo('info')).not.toThrow();
  expect(() => logWarn('warn')).not.toThrow();
  expect(() => logError('error')).not.toThrow();
});
