var debug = require('debug')('tetra:components'),
  fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  slash = require('slash'),
  _ = require('lodash'),
  utils = require('../utils');

function ComponentHelper(config, packages) {
  this.root = path.resolve(config.configPath, '../../');
  this.packages = packages;

  this.partialsGlobPattern = config.files_glob + config.template_ext;
  this.helpersGlobPattern = config.files_glob + '.js';
  this.scriptsDirName = config._scripts_dir_name;
  this.stylesDirName = config._styles_dir_name;
  this.partialsDirName = config._partials_dir_name;
  this.helpersDirName = config._helpers_dir_name;
  this.releaseDirName = config._component_release_dir_name;
  this.rootFileName = config._root_file_name;
}

ComponentHelper.prototype.parse = function (dir) {
  var profile = {
    dir: slash(path.relative(this.root, dir))
  };

  // Collect scripts and styles
  _.merge(profile, this.getClientAssets(dir));

  // Collect templates and helpers
  _.merge(profile, this.getTemplateAssets(dir));

  return profile;
};

/**
 * Discover scripts and styles for a given component
 *
 * @private
 */
ComponentHelper.prototype.getClientAssets = function (dir) {
  var boilerplatePath = path.resolve(dir, 'component.json'),
    releasePath = path.resolve(dir, this.releaseDirName),
    _this = this,
    styles, filePath, boilerplate;

  var assets = {
    scripts: [],
    styles: []
  };

  // If the component has its own component.json
  if (fs.existsSync(boilerplatePath)) {
    boilerplate = utils.safeRequire(boilerplatePath);
    if (boilerplate) {
      if (boilerplate.scripts && _.isArray(boilerplate.scripts)) {
        assets.scripts = assets.scripts.concat(boilerplate.scripts.map(function (script) {
          return slash(path.relative(_this.root, path.resolve(dir, script)));
        }));
      }

      if (boilerplate.styles && _.isArray(boilerplate.styles)) {
        assets.styles = assets.styles.concat(boilerplate.styles.map(function (style) {
          return slash(path.relative(_this.root, path.resolve(dir, style)));
        }));
      }
    }
  }
  // If the component has been pre-built
  else if (fs.existsSync(releasePath)) {
    // We expect to find a main.css and main.js in the release directory
    // main.js should already include all templates, precompiled
    assets.scripts.push(slash(path.relative(_this.root, path.resolve(releasePath, this.rootFileName + '.js'))));
    assets.styles.push(slash(path.relative(_this.root, path.resolve(releasePath, this.rootFileName + '.css'))));
  }
  // Standard component
  else {
    // We expect to find a main.js in the scripts directory, and a main.{less,scss} in
    // the styles directory
    filePath = path.resolve(dir, this.scriptsDirName, this.rootFileName + '.js');
    if (fs.existsSync(filePath)) {
      assets.scripts.push(slash(path.relative(_this.root, filePath)));
    }

    styles = path.resolve(dir, this.stylesDirName);
    if (fs.existsSync(styles)) {
      fs.readdirSync(styles).some(function (style) {
        if (path.basename(style).indexOf('main.') !== -1) {
          filePath = path.resolve(styles, style);
          if (fs.statSync(filePath).isFile()) {
            assets.styles.push(slash(path.relative(_this.root, filePath)));
            return true;
          }
        }

        return false;
      });
    }
  }

  return assets;
};

/**
 * Discover partials and helpers for a component
 *
 * @param dir
 * @returns {Object}
 * @private
 */
ComponentHelper.prototype.getTemplateAssets = function (dir) {
  var partialsDir = path.resolve(dir, this.partialsDirName),
    helpersDir = path.resolve(dir, this.helpersDirName),
    releaseDir = path.resolve(dir, this.releaseDirName),
    _this = this,
    assets = {
      partials: [],
      helpers: []
    };

  if (fs.existsSync(partialsDir)) {
    if (!fs.existsSync(releaseDir)) {
      assets.partials = glob.sync(path.resolve(partialsDir, this.partialsGlobPattern)).map(function (dir) {
        return slash(path.relative(_this.root, dir));
      });
    }

    assets.helpers = glob.sync(path.resolve(helpersDir, this.helpersGlobPattern)).map(function (dir) {
      return slash(path.relative(_this.root, dir));
    });
  }

  return assets;
};

/**
 * Find all components in local or external directories.
 *
 * @returns {Object}
 */
function find(config, packages) {
  var helper, components = {}, pkg, pkgComponents, componentDir;

  if (packages) {
    helper = new ComponentHelper(config, packages);
    Object.keys(packages).forEach(function (name) {
      pkg = packages[name];
      pkgComponents = (pkg && pkg.components && _.isArray(pkg.components)) ? pkg.components : [];
      pkgComponents.forEach(function (compName) {
        if (compName && !components[compName]) {
          componentDir = path.resolve(config._components, compName);
          if (fs.existsSync(componentDir)) {
            debug('Found local component "%s"', compName);
            components[compName] = {};
            _.merge(components[compName], helper.parse(componentDir));
          } else {
            componentDir = path.resolve(config.external_components, compName);
            if (fs.existsSync(componentDir)) {
              debug('Found external component "%s"', compName);
              components[compName] = {};
              _.merge(components[compName], helper.parse(componentDir));
            }
          }
        }
      });
    });
  }

  return components;
}

exports.find = find;
