var debug = require('debug')('tetra:templates'),
  fs = require('fs'),
  path = require('path'),
  TemplatingError = require('../errors/TemplatingError');

/**
 * Register all partials and helpers, given an app profile and
 * a configured templating library
 *
 * @param profile application profile
 * @param tmpl global templating object
 */
function register(profile, tmpl) {
  var helpers = [],
    partials = [],
    comp, helper, name;

  if (tmpl) {
    helpers = profile.app.helpers;
    partials = profile.app.partials;
    Object.keys(profile.components).forEach(function (name) {
      comp = profile.components[name];
      partials = partials.concat(comp.partials || []);
      helpers = helpers.concat(comp.helpers || []);
    });

    if (tmpl.registerHelper) {
      helpers.forEach(function (helperPath) {
        try {
          helperPath = path.resolve(helperPath);
          helper = require(helperPath);

          if (helper.register) {
            debug('Registering helper at %s', helperPath);
            helper.register(tmpl);
          } else {
            debug('The helper at %s does not define a register callback', helperPath);
          }
        } catch (e) {
          throw new TemplatingError('An error occurred registering the helper ' + helperPath + ' Error: ' + e.message);
        }
      });
    }

    if (tmpl.registerPartial) {
      partials.forEach(function (partial) {
        name = tmpl.processName(partial);

        debug('Registering partial with name "%s"', name);

        tmpl.registerPartial(name, fs.readFileSync(path.resolve(partial), 'utf8'));
      });
    }
  }
}

/**
 * Validate a collection of templates.
 *
 * @param profile
 * @param tmpl
 */
function validate(profile, tmpl) {
  var partials = [];

  if (tmpl && typeof tmpl.validate === 'function') {

    partials = partials.concat(profile.app.partials);
    Object.keys(profile.components).forEach(function (name) {
      partials = partials.concat(profile.components[name].partials || []);
    });

    partials.forEach(function (partial) {
      try {
        tmpl.validate(fs.readFileSync(path.resolve(partial), 'utf8'));
      } catch (e) {
        throw new TemplatingError('Validation error:' + e.message + ' in template: ' + partial);
      }
    });
  }
}

exports.register = register;
exports.validate = validate;
