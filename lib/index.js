var path = require('path'),
  locomotive = require('locomotive'),
  bootable = require('bootable'),
  bootableEnvironment = require('bootable-environment'),
  routing = require('./boot/routing'),
  templating = require('./boot/templating'),
  config = require('./configuration'),
  utils = require('./utils'),
  tmplConfig, tmpl;

// Setup templating global
tmplConfig = path.resolve(config.configPath, '../templates.js');
tmpl = utils.safeRequire(tmplConfig);
if (tmpl) {
  tmpl = tmpl(config);
  if (!tmpl.processName || typeof tmpl.processName !== 'function') {
    tmpl.processName = utils.processName(config);
  }
}

/**
 * Safe-boots the locomotive server.
 *
 * @param dir the root directory of the application
 * @param options boot options
 * @param next optional callback
 */
function server(dir, options, next) {
  next = next || function (err) {
    if (err) {
      throw err;
    }
  };

  var app = new locomotive.Application();
  app.phase(locomotive.boot.controllers(dir + '/app/controllers'));
  app.phase(locomotive.boot.views());
  app.phase(templating(config, tmpl));
  app.phase(bootableEnvironment(dir + '/config/environments'));
  app.phase(bootable.initializers(dir + '/config/initializers'));
  app.phase(locomotive.boot.routes(dir + '/config/routes'));
  app.phase(routing(config, app));
  if (options.clustering) {
    app.phase(locomotive.boot.httpServerCluster(options.port, options.address, options.clustering));
  } else {
    app.phase(locomotive.boot.httpServer(options));
  }
  app.boot(options.env, next);
}

/**
 * Returns an application profile for use by the build.
 *
 * @type {*}
 */
function buildProfile() {
  return require('./profile').getBuildProfile(config);
}

exports.server = server;
exports.buildProfile = buildProfile;
exports.locomotive = locomotive;
exports.config = config;
exports.tmpl = tmpl;
require('pkginfo')(module, 'version');
