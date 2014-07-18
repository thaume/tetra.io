var debug = require('debug')('tetra:routes:locomotive'),
  path = require('path'),
  locoUtils = require('locomotive/node_modules/actionrouter/lib/utils'),
  Namespace = require('locomotive/node_modules/actionrouter/lib/namespace'),
  utils = require('../utils'),
  RoutingError = require('../errors/RoutingError');

/**
 * Register helpers for a collection of routes.
 *
 * @param router locomotive router
 * @param routes locomotive router 'entries' object
 * @param helpers existing locomotive helpers
 */
function register(router, routes, helpers) {
  var pathHelperName, urlHelperName, name, route;

  Object.keys(routes).forEach(function (key) {
    route = routes[key];

    name = route.controller.replace(/\//g, '_');
    name += '_' + route.action;

    // Setup path and URL helper names
    pathHelperName = locoUtils.functionize(name);
    urlHelperName = locoUtils.functionize(name);

    key = route.controller + '#' + route.action;
    if (!helpers[pathHelperName]) {
      debug('Generating helper with name "%s"', pathHelperName);
      router.assist(pathHelperName, route);
    } else {
      throw new RoutingError('The route helper ' + pathHelperName +
        ' conflicts with a helper generated automatically for route ' + key);
    }

    // TODO Resolve this for 0.4.0
    /*if(!this.dynamicHelpers[urlHelperName]) {
     debug('Generating dynamic helper with name "%s"', urlHelperName);
     this.app.__router.assist(urlHelperName, route);
     } else {
     throw new RoutingError('The dynamic route helper ' + urlHelperName +
     ' conflicts with a helper generated automatically for route ' + key);
     }*/
  });
}

/**
 * Validates a collection of routes
 *
 * 0. The route must specify a controller, action and pattern
 * 1. A route is invalid if it matches, in whole or part, route patterns defined in the config forbidden_route_patterns
 * 2. A route is invalid if either the controller or the action callback do not exist
 * 3. Route patterns must be unique
 *
 * @param config application config
 * @param routes locomotive router 'entries' object
 */
function validate(config, routes) {

  var forbidden = config.forbidden_routes,
    patterns = [],
    ns = new Namespace(),
    controllerPath, route;

  // Prepare the list of forbidden routes
  forbidden = forbidden.map(function (item) {
    return ns.qpath(item);
  });

  Object.keys(routes).forEach(function (key) {
    route = routes[key];

    // Make sure the route has all required attributes
    if (!route || !route.controller || !route.action || !route.pattern) {
      throw new RoutingError('An application route was empty or misconfigured ' + JSON.stringify(route, null, 2));
    }

    // Check for complete or partial matches of forbidden routes ...
    forbidden.forEach(function (bad) {
      if (route.pattern === bad || route.pattern.indexOf(bad) === 0) {
        throw new RoutingError('The route ' + route.pattern + ' matches the forbidden route pattern "' + bad + '"');
      }
    });

    // Check for duplicate patterns ...
    if (patterns.indexOf(route.pattern) !== -1) {
      throw new RoutingError('There are two or more routes with the identical pattern ' + route.pattern);
    }

    // Check that the controller and action exist for each route
    controllerPath = path.resolve(config._controllers, locoUtils.underscore(route.controller) + '_controller.js');
    if (!utils.exists(controllerPath)) {
      throw new RoutingError('The referenced Controller ' + route.controller + ' does not exist at ' + controllerPath);
    }
    if (!require(controllerPath)[route.action]) {
      throw new RoutingError('The referenced callback "' + route.action + '" does not exist in the controller ' + controllerPath);
    }

    // All good, so save the pattern
    patterns.push(route.pattern);
  });
}

exports.register = register;
exports.validate = validate;
