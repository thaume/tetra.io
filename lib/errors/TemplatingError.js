var util = require('util');

/**
 * `TemplatingError` error.
 *
 * @api private
 */
function TemplatingError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message || 'Error';
  this.name = 'TemplatingError';
}
util.inherits(TemplatingError, Error);

/**
 * Expose `RouterError`.
 */
module.exports = TemplatingError;
