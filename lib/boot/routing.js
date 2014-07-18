var routingHelper = require('../routes/locomotive');

module.exports = function (config, app) {

  var router = app.__router,
    routes = router._entries || {}, helpers = app._helpers;

  return function initRouting() {
    routingHelper.validate(config, routes);
    routingHelper.register(router, routes, helpers);
  };
};
