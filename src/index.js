'use strict';
import alex from 'alex';
import convertVinylToVfile from 'convert-vinyl-to-vfile';
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

/**
 * Determine number of spaces to prepend a reason to right-align line/col numbers
 * @param {Object} message - message to determine number of spaces for
 * @param {Number} message.column - column of reason
 * @param {Number} message.line - line of reason
 * @param {Number} maxLineColLength - known max col/line length of any reason for a file
 * @return {String} - prefix spaces to right-align col/line
 */
function getNumOfSpacesToPrepend(message, maxLineColLength) {
  const lineColLength = getLineColLength(message);

  let spaces = '  '
    , i;

  for (i = lineColLength; i < maxLineColLength; i++) {
    spaces += ' ';
  }

  return spaces;
}

export default function gulpAlex() {
  return through.obj(function (file, encoding, callback) {
    let alexResult, convertedFile, maxLineColLength;

    if (!file || file.isNull()) {
      this.push();
      return callback();
    }

    convertedFile = convertVinylToVfile(file);

    alexResult = alex(convertedFile);

    if (alexResult.messages.length > 0) {
      maxLineColLength = getMaxLineColLength(alexResult.messages);

      log(alexResult.filename + '.' + alexResult.extension);

      alexResult.messages.forEach((message) => {
        let spaces = getNumOfSpacesToPrepend(message, maxLineColLength);

        log(`${spaces}${message.line}:${message.column} ${message.reason}`);
      });
    }

    callback(null, file);
  });
}
