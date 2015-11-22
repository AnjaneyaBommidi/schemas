'use strict';

// Export the native Promise, or a polyfill
module.exports = typeof Promise === 'function' ? Promise : require('es6-promise').Promise;
