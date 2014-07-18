var util = require('util');

/**
 * `LangError` error.
 *
 * @api private
 */
function LangError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message || 'Error';
  this.name = 'LangError';
}
util.inherits(LangError, Error);

/**
 * Expose `RouterError`.
 */
module.exports = LangError;
