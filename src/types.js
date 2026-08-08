// TypeScript types as JSDoc for static analysis without compilation overhead

/**
 * @typedef {Object} Track
 * @property {number} index
 * @property {string} name
 * @property {number} volume
 * @property {number} pan
 * @property {boolean} muted
 * @property {boolean} solo
 * @property {boolean} armed
 * @property {string} type
 */

/**
 * @typedef {Object} Clip
 * @property {number} index
 * @property {string} name
 * @property {number} length
 * @property {number} startTime
 */

/**
 * @typedef {Object} Note
 * @property {number} pitch
 * @property {number} time
 * @property {number} duration
 * @property {number} velocity
 */

/**
 * @typedef {Object} Device
 * @property {number} index
 * @property {string} name
 * @property {boolean} enabled
 * @property {Object.<string, number>} parameters
 */

export {};
