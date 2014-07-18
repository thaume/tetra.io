'use strict';
var path = require('path'),
  rimraf = require('rimraf');

exports.init = function (grunt) {
  var tetra = require('../../lib'),
    config = tetra.config,
    stagingDirs = ['_webroot_dir_name', '_translations_dir_name', '_partials_dir_name'],
    webrootDirs = ['_translations_dir_name', '_scripts_dir_name', '_styles_dir_name'],
    buildProfilePath,
    keys;

  if (!config || !config._staging) {
    grunt.verbose.error();
    grunt.fail.warn('Your application is misconfigured. Cannot find staging property');
    return false;
  }

  buildProfilePath = path.resolve(config._staging, '_profile.json');

  if (grunt.file.exists(config._staging)) {
    // Check that the staging directory is correctly configured
    // Code from grunt-clean

    if (grunt.file.isPathCwd(config._staging)) {
      grunt.verbose.error();
      grunt.fail.warn('Cannot delete the current working directory.');
      return false;
    } else if (!grunt.file.isPathInCwd(config._staging)) {
      grunt.verbose.error();
      grunt.fail.warn('Cannot delete files outside the current working directory.');
      return false;
    }

    // Clear require cache, in case this was relaunched from an active process
    try {
      delete require.cache[require.resolve(buildProfilePath)];
    } catch (e) {
      // Nothing to do
    }

    // Destroy!
    try {
      grunt.log.write('Destroying staging ... ');
      rimraf.sync(config._staging);
      grunt.log.ok();
    } catch (e) {
      grunt.log.error();
      grunt.fail.warn('Unable to delete staging "' + config._staging + '" file (' + e.message + ').', e);
      return false;
    }
  }

  keys = stagingDirs.concat(webrootDirs);
  for (var i = 0; i < keys.length; i++) {
    if (!config[keys[i]]) {
      grunt.verbose.error();
      grunt.fail.warn('Your application is misconfigured. Cannot find directory name properties');
      return false;
    }
  }

  grunt.log.write('Initializing staging ... ');

  try {
    stagingDirs.forEach(function (dir) {
      grunt.file.mkdir(path.resolve(config._staging, config[dir]));
    });
  } catch (e) {
    grunt.log.error();
    grunt.verbose.error(e);
    grunt.fail.warn('Unable to initialise staging directory');
    return false;
  }

  // Build required directories in webroot
  try {
    webrootDirs.forEach(function (dir) {
      grunt.file.mkdir(path.resolve(config._staging, config._webroot_dir_name, config[dir]));
    });
  } catch (e) {
    grunt.log.error();
    grunt.verbose.error(e);
    grunt.fail.warn('Unable to initialise webroot directory');
    return false;
  }
  grunt.log.ok();

  // Write the build profile to staging
  grunt.log.write('Writing build profile to staging ... ');
  grunt.file.write(buildProfilePath, JSON.stringify(tetra.buildProfile()), {
    encoding: 'utf8'
  });

  grunt.log.ok();
  return true;
};
