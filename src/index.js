/* eslint no-invalid-this: 0 */
'use strict'
import alex from 'alex'
import convertVinylToVfile from 'convert-vinyl-to-vfile'
import findUp from 'find-up'
import fs from 'fs'
import readPkgUp from 'read-pkg-up'
import {PluginError} from 'gulp-util'
import reporter from 'vfile-reporter'
import through from 'through2'

const runAlex = (callback, file, allow = []) => {
  file.alex = alex(file.contents.toString(), allow)
  return callback(null, file)
}

module.exports = () =>
  through.obj(function (file, encoding, callback) {
    if (!file || file.isNull()) {
      this.push()
      return callback()
    }

    findUp('.alexrc')
      .then(alexRcPath => {
        if (!alexRcPath) {
          readPkgUp().then(({pkg}) => {
            if (pkg && pkg.alex && pkg.alex.allow) {
              return runAlex(callback, file, pkg.alex.allow)
            }

            return runAlex(callback, file)
          })
        }

        fs.readFile(alexRcPath, 'utf8', (err, fileContents) => {
          if (err) {
            throw err
          }

          const {allow} = JSON.parse(fileContents)
          return runAlex(callback, file, allow)
        })
      })
  })

module.exports.reporter = reporterType => {
  const failedFiles = []
    , isDefaultReporter = !reporterType
    , isFailReporter = reporterType === 'fail'
    , isFailImmediatelyReporter = reporterType === 'failImmediately'

  return through.obj(function (file, encoding, callback) {
    let error = null
      , foundIssues = false
      , convertedFile, report

    if (!file || file.isNull()) {
      this.push()
      return callback()
    }

    convertedFile = convertVinylToVfile(file)
    convertedFile.messages = file.alex.messages

    // default report to console
    if (isDefaultReporter) {
      report = reporter(convertedFile, {quiet: true})
      if (report) {
        console.log(report)
      }
    }

    foundIssues = !!file.alex.messages.length

    if (isFailImmediatelyReporter && foundIssues) {
      error = new PluginError('gulp-alex', {
        name: 'AlexError',
        message: `Alex failed for ${file.path}`
      })
    }

    if (isFailReporter && foundIssues) {
      failedFiles.push(file.path)
    }

    callback(error, file)
  }, function (callback) {
    if (isFailReporter && failedFiles.length) {
      this.emit('error', new PluginError('gulp-alex', {
        name: 'AlexError',
        message: `Alex failed for ${failedFiles.join(', ')}`
      }))
    }

    callback()
  })
}
