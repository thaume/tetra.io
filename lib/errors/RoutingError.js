var util = require('util');

/**
 * `RoutingError` error.
 *
 * @api private
 */
function RoutingError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message || 'Error';
  this.name = 'RoutingError';
}
util.inherits(RoutingError, Error);

/**
 * Expose `RoutingError`.
 */
module.exports = RoutingError;
