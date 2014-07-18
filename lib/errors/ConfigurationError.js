var util = require('util');

/**
 * `ConfigurationError` error.
 *
 * @api private
 */
function ConfigurationError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message || 'Error';
  this.name = 'ConfigurationError';
}
util.inherits(ConfigurationError, Error);

/**
 * Expose `RouterError`.
 */
module.exports = ConfigurationError;
