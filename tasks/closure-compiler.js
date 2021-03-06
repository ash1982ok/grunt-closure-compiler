module.exports = function(grunt) {

  var exec = require('child_process').exec,
      fs = require('fs'),
      gzip = require('zlib').gzip;

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('closure-compiler', 'Minify JS files using Closure Compiler.', function() {

    // Check for env var.
    if (process.env.CLOSURE_PATH === undefined) {
      grunt.log.error('' +
          '/!\\'.red +
          ' Set an environment variable called ' +
          'CLOSURE_PATH'.red +
          ' and\nmake it point to your root install of Closure Compiler.' +
          '\n');

      // Return an error and stop grunt.
      return false;
    }

    var closurePath = '',
        reportFile = '',
        data = this.data,
        done = this.async();

    if (data.closurePath) {
      closurePath = data.closurePath;
    } else if (process.env.CLOSURE_PATH) {
      closurePath = process.env.CLOSURE_PATH;
    } else {
      grunt.warn('Missing path to Closure Compiler.');
      return false;
    }

    var command = 'java -jar ' + closurePath + '/build/compiler.jar';

    data.js = grunt.file.expandFiles(data.js);

    // Sanitize options passed.
    if (!data.js.length) {
      // This task requires a minima an input file.
      grunt.warn('Missing js property.');
      return false;
    }

    // Build command line.
    command += ' --js ' + data.js.join(' --js ');

    if (data.jsOutputFile) {
      command += ' --js_output_file ' + data.jsOutputFile;
      reportFile = data.jsOutputFile + '.report.txt';
    }

    if (data.externs) {
      data.externs = grunt.file.expandFiles(data.externs);
      command += ' --externs ' + data.externs.join(' --externs ');
    }

    if (data.options.externs) {
      data.options.externs = grunt.file.expandFiles(data.options.externs);
    }

    for (var directive in data.options) {
      if (Array.isArray(data.options[directive])) {
        command += ' --' + directive + ' ' + data.options[directive].join(' --' + directive + ' ');
      } else {
        command += ' --' + directive + ' ' + String(data.options[directive]);
      }
    }

    // Minify WebGraph class.
    exec(command, function(err, stdout, stderr) {
      if (err) {
        grunt.warn(err);
        done(false);
      }

      if (stdout) {
        grunt.log.writeln(stdout);
      }

      // If OK, calculate gzipped file size.
      if (reportFile.length) {
        var min = fs.readFileSync(data.jsOutputFile, 'utf8');
        grunt.helper('min_info', min, function(err) {
          if (err) {
            grunt.warn(err);
            done(false);
          }

          // Write compile report to a file.
          fs.writeFile(reportFile, stderr, function(err) {
            if (err) {
              grunt.warn(err);
              done(false);
            }

            grunt.log.writeln('A report is saved in ' + reportFile + '.');
            done();
          });

        });
      }

    });

  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  // Output some size info about a file.
  grunt.registerHelper('min_info', function(min, onComplete) {
    gzip(min, function(err, buffer) {
      if (err) {
        onComplete.call(this, err);
      }

      var gzipSize = buffer.toString().length;
      grunt.log.writeln('Compressed size: ' + String((gzipSize / 1024).toFixed(2)).green + ' kb gzipped (' + String(gzipSize).green + ' bytes).');

      onComplete.call(this, null);
    });
  });

};
