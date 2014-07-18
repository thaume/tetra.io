var fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  schema = {};

/**
 * Merges all configuration schema into one JSON object
 */
fs.readdirSync(__dirname).forEach(function (file) {
  if (path.extname(file) === '.json') {
    _.merge(schema, require('./' + file));
  }
});

module.exports = schema;
