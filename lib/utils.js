var debug = require('debug')('tetra:utils'),
  path = require('path'),
  fs = require('fs'),
  glob = require('glob'),
  async = require('async'),
  _ = require('lodash');

/**
 * Verify that a module exists
 *
 * @param name
 * @returns {*}
 */
exports.exists = function (name) {
  try {
    return require.resolve(name);
  } catch (e) {
    return false;
  }
};

/**
 * Require a module if it exists and is valid; otherwise, return false. This prevents
 * exceptions due to invalid JSON from being thrown.
 *
 * If an exception occurs, we log it
 *
 * @param name
 * @returns {*}
 */
exports.safeRequire = function (name) {
  var module;
  try {
    if (this.exists(name)) {
      module = require(name);
      return (typeof module !== 'undefined') ? module : false;
    }
  } catch (e) {
    debug('There was a problem requiring module "%s", error: %s', name, e);
  }

  return false;
};

/**
 * Find all files in the given set of target directories, according to
 * the globbing pattern. Directories themselves are not returned
 *
 * @param targets
 * @param pattern
 * @param done
 * @private
 */
exports.glob = function (targets, pattern, done) {
  var globs = [];

  if (targets) {

    targets = (_.isArray(targets)) ? targets : [targets];

    targets.forEach(function (dir) {
      if (dir) {
        dir = path.resolve(dir, pattern);
        globs.push(function (next) {
          glob(dir, {
            strict: true
          }, next);
        });
      }
    });

    // Run all the globs and prepare a single object to return
    async.parallel(globs, function (err, results) {
      results = _.isArray(results) ? results : [];
      results = _.flatten(results);

      // Remove any directories
      results = results.filter(function (result) {
        return fs.statSync(result).isFile();
      });

      done(err, results);
    });
  } else {
    done(undefined, []);
  }
};

/**
 * Returns a default partial naming scheme, in the absence of one implemented on tmpl. It names
 * the partial as a forward-slash delimited path, beginning at the project view directory,
 * if the partial is a view partial. If the partial is for a component, we prefix
 * it with comp/[name]/
 *
 * @returns {Function}
 * @private
 * @param config app config
 */
exports.processName = function (config) {
  var ext = config.template_ext,
    root = path.resolve(config.configPath, '../../'),
    components = path.relative(root, config._components),
    externalComponents = path.relative(root, config.external_components),
    componentPartialPrefix = config.component_partial_prefix || 'comp',
    partialsDirName = config._partials_dir_name,
    views = path.relative(root, config._views),
    rel, name;

  return function (partialPath) {
    // Make the path separators consistent
    partialPath = path.normalize(partialPath);

    if (partialPath.indexOf(components) !== -1 || partialPath.indexOf(externalComponents) !== -1) {
      rel = (partialPath.indexOf(components) !== -1) ? components : externalComponents;
      name = path.dirname(path.relative(rel, partialPath));
      name = componentPartialPrefix + path.sep + name.replace(path.sep + partialsDirName, '');
    } else {
      rel = path.resolve(views, partialsDirName);
      name = path.dirname(path.relative(rel, partialPath));
    }

    name = (name !== '.') ? name + '/' : '';
    name = name.replace(/\\/g, '/');
    name += path.basename(partialPath, ext);

    return name;
  };
};
