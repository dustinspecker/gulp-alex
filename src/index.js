'use strict';
import alex from 'alex';
import convertVinylToVfile from 'convert-vinyl-to-vfile';
import indentString from 'indent-string';
import {log} from 'gulp-util';
import through from 'through2';

/**
 * Return number of digits in line + column
 * @param {Object} message - message to analyze
 * @param {Number} message.column - column number of warning
 * @param {Number} message.line - line number of warning
 * @return {Number} - number of digits in message's line and column
 */
function getLineColLength(message) {
  return (message.column.toString() + message.line.toString()).length;
}

/**
 * Return the max getLineColLength for a list of messages
 * @param {Object[]} messages - list of messages
 * @return {Number} - max line + col length
 */
function getMaxLineColLength(messages) {
  let maxLineColLength = 0;

  messages.forEach((message) => {
    const lineColLength = getLineColLength(message);

    if (lineColLength > maxLineColLength) {
      maxLineColLength = lineColLength;
    }
  });

  return maxLineColLength;
}

export default function gulpAlex() {
  return through.obj(function (file, encoding, callback) {
    let convertedFile, maxLineColLength;

    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    convertedFile = convertVinylToVfile(file);

    alex(convertedFile);

    if (convertedFile.messages.length > 0) {
      maxLineColLength = getMaxLineColLength(convertedFile.messages);

      log(convertedFile.filename + '.' + convertedFile.extension);

      convertedFile.messages.forEach((message) => {
        let formattedReason, numOfSpaces;

        // always indent at least 2 spaces
        numOfSpaces = 2 + maxLineColLength - getLineColLength(message);

        formattedReason = `${message.line}:${message.column} ${message.reason}`;
        formattedReason = indentString(formattedReason, ' ', numOfSpaces);

        log(formattedReason);
      });
    }

    callback(null, file);
  });
}
