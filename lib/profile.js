var path = require('path'),
  _ = require('lodash'),
  glob = require('glob'),
  slash = require('slash'),
  utils = require('./utils'),
  componentHelper = require('./components'),
  appProfile;

exports.getAppProfile = function (config) {
  var projectRoot = path.resolve(config.configPath, '../../'),
    packagesPath = path.resolve(config.configPath, '../packages.js'),
    templatesGlobPattern = config.files_glob + config.template_ext,
    scriptsGlobPattern = config.files_glob + '.js',
    partialPath, helperPath, dirs = [],
    packages;

  if (!appProfile) {
    appProfile = {
      packages: {},
      components: {},
      app: {
        partials: [],
        helpers: []
      }
    };

    packages = utils.safeRequire(packagesPath);
    if (packages) {
      _.merge(appProfile.components, componentHelper.find(config, packages));
      _.merge(appProfile.packages, packages);
    }

    // Server-side templates
    dirs.push(config._views);
    Object.keys(appProfile.components).forEach(function (name) {
      dirs = dirs.concat(appProfile.components[name].partials || []);
    });

    dirs.forEach(function (target) {
      partialPath = path.resolve(target, config._partials_dir_name, templatesGlobPattern);
      helperPath = path.resolve(target, config._helpers_dir_name, scriptsGlobPattern);
      appProfile.app.partials = appProfile.app.partials.concat(glob.sync(partialPath).map(function (dir) {
        return slash(path.relative(projectRoot, dir));
      }));
      appProfile.app.helpers = appProfile.app.helpers.concat(glob.sync(helperPath).map(function (dir) {
        return slash(path.relative(projectRoot, dir));
      }));
    });
  }

  return appProfile;
};

exports.getBuildProfile = function (config) {
  var lockPath = path.resolve(config._staging, '_profile.json'),
    buildProfile = utils.safeRequire(lockPath),
    packagesPath, packages;

  if (!buildProfile) {
    buildProfile = {
      packages: {},
      components: {}
    };

    packagesPath = path.resolve(config.configPath, '../packages.js');
    packages = utils.safeRequire(packagesPath);
    if (packages) {
      _.merge(buildProfile.components, componentHelper.find(config, packages));
      _.merge(buildProfile.packages, packages);
    }
  }

  return buildProfile;
};
