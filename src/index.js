'use strict';
import alex from 'alex';
import convertVinylToVfile from 'convert-vinyl-to-vfile';
import {PluginError} from 'gulp-util';
import reporter from 'vfile-reporter';
import through from 'through2';

module.exports = function () {
  return through.obj(function (file, encoding, callback) {
    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    file.alex = alex(file.contents.toString());

    callback(null, file);
  });
};

module.exports.reporter = function (reporterType) {
  let failedFiles = []
    , isDefaultReporter = !reporterType
    , isFailReporter = reporterType === 'fail'
    , isFailImmediatelyReporter = reporterType === 'failImmediately';

  return through.obj(function (file, encoding, callback) {
    let error = null
      , convertedFile, report;

    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    convertedFile = convertVinylToVfile(file);
    convertedFile.messages = file.alex.messages;

    // default report to console
    if (isDefaultReporter) {
      report = reporter(convertedFile, {quiet: true});
      if (report) {
        console.log(report);
      }
    }

    if (isFailImmediatelyReporter && file.alex.messages.length > 0) {
      error = new PluginError('gulp-alex', {
        name: 'AlexError',
        message: `Alex failed for ${file.path}`
      });
    }

    if (reporterType === 'fail' && file.alex.messages.length > 0) {
      failedFiles.push(file.path);
    }

    callback(error, file);
  }, function (callback) {
    if (isFailReporter && failedFiles.length) {
      this.emit('error', new PluginError('gulp-alex', {
        name: 'AlexError',
        message: `Alex failed for ${failedFiles.join(', ')}`
      }));
    }

    callback();
  });
};
