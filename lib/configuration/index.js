var debug = require('debug')('tetra:config'),
  path = require('path'),
  fs = require('fs'),
  convict = require('convict'),
  _ = require('lodash'),
  schema = require('./schema'),
  paths = require('./schema/paths'),
  utils = require('../utils'),
  ConfigurationError = require('../errors/ConfigurationError');

/**
 * Merges together the environment and global configurations and returns the
 * merged JSON object.
 *
 * @returns {validate|*|validate}
 * @private
 */
var env = process.env.NODE_ENV || 'development',
  configPath = path.resolve(process.cwd(), 'config/configurations'),
  globalConfig = utils.safeRequire(configPath + '/all.json'),
  envConfig = utils.safeRequire(configPath + '/' + env + '.json'),
  appSchema = utils.safeRequire(configPath + '/schema.json'),
  requiredPathKeys = ['_controllers', '_views', '_config'],
  rootConfig = {}, config;

try {
  if (appSchema) {
    debug('Found application convict schema');
    _.merge(schema, appSchema);
  }

  config = convict(schema);
  config.load(globalConfig || {});
  config.load(envConfig || {});
  config.validate();
  rootConfig = config.root();
} catch (e) {
  throw new ConfigurationError(e.message);
}

// Verify and normalize directories
Object.keys(paths).forEach(function (appPathKey) {
  if (requiredPathKeys.indexOf(appPathKey) !== -1 && !fs.existsSync(path.resolve(rootConfig[appPathKey]))) {
    throw new ConfigurationError('The application directory ' + rootConfig[appPathKey] + ' does not exist');
  }

  rootConfig[appPathKey] = path.normalize(rootConfig[appPathKey]);
});

// Setup config directory as being relative to the app root
rootConfig.configPath = path.relative(path.resolve(configPath, '../../'), configPath);

module.exports = rootConfig;
