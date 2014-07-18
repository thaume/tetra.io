var templatingHelper = require('../templates'),
  profileHelper = require('../profile');

module.exports = function (config, tmpl) {

  var profile = profileHelper.getAppProfile(config);

  return function templating() {
    templatingHelper.register(profile, tmpl);
    templatingHelper.validate(profile, tmpl);
  };
};
