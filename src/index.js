'use strict';
import alex from 'alex';
import convertVinylToVfile from 'convert-vinyl-to-vfile';
import {PluginError} from 'gulp-util';
import reporter from 'vfile-reporter';
import through from 'through2';

export default function gulpAlex(opts = {}) {
  return through.obj(function (file, encoding, callback) {
    let error = null
      , convertedFile;

    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    convertedFile = convertVinylToVfile(file);

    alex(convertedFile);
    console.log(reporter(convertedFile, opts));

    if (opts.fail && convertedFile.messages.length > 0) {
      error = new PluginError('gulp-alex', {
        name: 'AlexError',
        message: `Alex failed for ${file.path}`
      });
    }

    callback(error, file);
  });
}
