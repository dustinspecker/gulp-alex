'use strict';
import alex from 'alex';
import convertVinylToVfile from 'convert-vinyl-to-vfile';
import reporter from 'vfile-reporter';
import through from 'through2';

export default function gulpAlex(opts = {}) {
  return through.obj(function (file, encoding, callback) {
    let convertedFile;

    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    convertedFile = convertVinylToVfile(file);

    alex(convertedFile);
    console.log(reporter(convertedFile, opts));

    callback(null, file);
  });
}
