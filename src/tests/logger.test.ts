import 'jest';
import { logInfo, logWarn, logError } from '../core/logger';

test('logger functions', () => {
  expect(() => logInfo('info')).not.toThrow();
  expect(() => logWarn('warn')).not.toThrow();
  expect(() => logError('error')).not.toThrow();
});
