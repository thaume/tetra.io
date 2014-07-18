'use strict';

var path = require('path'),
  tetra = require('../../lib'),
  LangHelper = require('../../lib/lang');

exports.init = function (grunt, done) {
  var config = tetra.config,
    profile = tetra.buildProfile();

  // Build the server and client localization files
  // Find all components
  // Build and write localization files
  var langHelper = new LangHelper(config);
  langHelper.buildProfile(profile.components, function (err, data) {
    if (err) {
      grunt.log.error();
      grunt.verbose.error(err);
      grunt.fail.warn('An error occurred when writing translation files to staging');
      return false;
    }

    var serverLang = data.server,
      clientLang = data.client,
      filepath;

    Object.keys(serverLang).forEach(function (locale) {
      grunt.log.write('Writing locale %s', locale, '... ');

      filepath = path.resolve(config._staging, config._translations_dir_name, locale, 'translation.json');
      grunt.file.write(filepath, JSON.stringify(serverLang[locale]), {
        encoding: 'utf8'
      });

      filepath = path.resolve(config._staging, config._webroot_dir_name, config._translations_dir_name, locale, 'translation.json');
      grunt.file.write(filepath, JSON.stringify(clientLang[locale]), {
        encoding: 'utf8'
      });

      grunt.log.ok();
    });

    done();
  });
};
