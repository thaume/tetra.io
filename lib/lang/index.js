var fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  utils = require('../utils'),
  LangError = require('../errors/LangError');

/**
 * A helper for building a single concatenated translation file, for each locale,
 * for the client- and server-side.
 */
function LangHelper(config) {
  var localePath, _this = this;

  // Fetch all locales for the application
  this.locales = [];
  fs.readdirSync(path.resolve(config._translations)).forEach(function (dir) {
    localePath = path.resolve(config._translations, dir);
    if (dir.charAt(0) !== '_' && fs.statSync(localePath).isDirectory()) {
      _this.locales.push(dir);
    }
  });

  this.config = config;
}

/**
 *
 */
LangHelper.prototype.buildProfile = function (components, done) {
  var _this = this,
    rootFileName = this.config._root_file_name + '.json',
    pattern = this.config.files_glob + '.json',
    targets = [this.config._translations],
    server = {}, client = {}, compLocales = [],
    json, comp, hasComponents, rel, parent, locale, context, compName;

  // Initialise the obj with keys for each locale
  this.locales.forEach(function (locale) {
    server[locale] = {};
    client[locale] = {};
  });

  // Collect the set of potential component translation paths
  Object.keys(components).forEach(function (name) {
    compLocales.push(path.resolve(components[name].dir, _this.config._translations_dir_name));
  });

  // Setup target paths
  targets = targets.concat(compLocales);

  // Build the server- and client-side translations
  utils.glob(targets, pattern, function (err, translations) {
    if (!err) {
      translations.map(path.normalize).forEach(function (transPath) {
        compName = null;
        comp = null;

        if (transPath.indexOf(_this.config._translations) !== -1) {
          parent = _this.config._translations;
          rel = path.relative(parent, transPath);
        }
        // Local component locales
        else if (transPath.indexOf(_this.config._components) !== -1) {
          parent = path.relative(_this.config._components, transPath);
          parent = parent.split(path.sep);

          compName = parent[0];
          rel = parent.slice(2, parent.length).join(path.sep);
        }
        // External component locales
        else if (transPath.indexOf(_this.config.external_components) !== -1) {
          parent = path.relative(_this.config.external_components, transPath);
          parent = parent.split(path.sep);

          compName = parent[0];
          rel = parent.slice(2, parent.length).join(path.sep);
        }

        locale = rel.substr(0, rel.indexOf(path.sep));
        rel = rel.substr(rel.indexOf(locale) + locale.length + 1);

        if (server[locale]) {
          if (compName) {
            comp = {};
            comp[compName] = {};
            context = comp[compName];
          } else {
            context = server[locale];
          }

          if (rel === rootFileName) {
            try {
              json = require(transPath);
            } catch (e) {
              throw new LangError('An error occurred reading the root localization JSON file ' + transPath + ' Error: ' + e.message);
            }

            _.merge(context, json);
          } else {
            _.merge(context, _this._buildSubJSON(transPath, rel));
          }

          if (comp) {
            hasComponents = true;
            if (!client[locale].comp) {
              client[locale].comp = {};
            }
            _.merge(client[locale].comp, comp);
          }
        }
      });

      if (hasComponents) {
        _.merge(server, client);
      }
    }

    done(err, {
      locales: _this.locales,
      server: server,
      client: client
    });
  });
};

/**
 *
 *
 * @param transPath
 * @param relPath
 * @returns {{}}
 * @private
 */
LangHelper.prototype._buildSubJSON = function (transPath, relPath) {
  var root = {}, context = root,
    json, parts;

  parts = relPath.split(path.sep);
  parts.forEach(function (part) {
    if (path.extname(part) !== '.json') {
      context[part] = {};
      context = context[part];
    } else {
      part = path.basename(part, '.json');
      context[part] = {};
      context = context[part];

      try {
        json = require(transPath);
      } catch (e) {
        throw new LangError('An error occurred reading the root localization JSON file ' + transPath + ' Error: ' + e.message);
      }

      _.merge(context, json);
    }
  });

  return root;
};

exports = module.exports = LangHelper;
