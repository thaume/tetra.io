// Grunt task - Used to init directories and build the localization files

module.exports = function (grunt) {
  grunt.registerTask('tetra', 'Sets up required directories and builds the localization files', function () {

    if (!this.args.length) {
      require('./lib/setup').init(grunt);
      require('./lib/lang').init(grunt, this.async());
    } else {
      if (this.args[0] === 'setup') {
        require('./lib/setup').init(grunt);
      } else if (this.args[0] === 'lang') {
        require('./lib/lang').init(grunt, this.async());
      }
    }
  });
};
