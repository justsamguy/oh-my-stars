export function logInfo(msg, ...args) {
    // eslint-disable-next-line no-console
    console.info('[INFO]', msg, ...args);
}
export function logWarn(msg, ...args) {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', msg, ...args);
}
export function logError(msg, ...args) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', msg, ...args);
}
