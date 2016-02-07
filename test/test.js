/* global describe, beforeEach, it */
'use strict'
import austin from 'austin'
import {expect} from 'chai'
import {File} from 'gulp-util'
import {join} from 'path'
import Promise from 'pinkie-promise'
import proxyquire from 'proxyquire'

describe('gulp-alex', () => {
  const filePath = join('users', 'dustin', 'project', 'awesome.project.md')
  let alexProxy, fileWithOneError, findUpStub, readPkgUpStub, reporter, stream, validFile

  beforeEach(() => {
    findUpStub = austin.spy().withArgs('.alexrc').returns(Promise.resolve(null))
    readPkgUpStub = austin.spy().returns(Promise.resolve({}))
    reporter = austin.spy()
    alexProxy = proxyquire('../lib', {
      'find-up': findUpStub,
      'read-pkg-up': readPkgUpStub,
      'vfile-reporter': reporter
    })

    stream = alexProxy()

    fileWithOneError = new File({
      base: './',
      path: filePath,
      contents: new Buffer('Garbagemen versus Abe Lincoln!')
    })

    validFile = new File({
      base: './',
      path: filePath,
      contents: new Buffer('Abe Lincoln is awesome.')
    })
  })

  it('should not report if no files passed', done => {
    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(undefined)
        expect(reporter.callCount()).to.eql(0)
        done()
      })

    stream.write()

    stream.end()
  })

  it('should report if an error is not found', done => {
    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(validFile)
        expect(reporter.callCount()).to.eql(1)
        done()
      })

    stream.write(validFile)

    stream.end()
  })

  it('should report if an error is found', done => {
    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(fileWithOneError)
        expect(reporter.callCount()).to.eql(1)
        done()
      })

    stream.write(fileWithOneError)

    stream.end()
  })

  it('should not print if an error is not found', done => {
    reporter.returns('')
    austin.spy(global.console, 'log')

    stream
      .pipe(alexProxy.reporter())
      .on('data', () => {
        expect(global.console.log.callCount()).to.eql(0)
        global.console.log.restore()
        done()
      })

    stream.write(validFile)

    stream.end()
  })

  it('should print if an error is found', done => {
    reporter.returns('error')
    austin.spy(global.console, 'log')

    stream
      .pipe(alexProxy.reporter())
      .on('data', () => {
        expect(global.console.log.calledWith('error')).to.eql(true)
        global.console.log.restore()
        done()
      })

    stream.write(validFile)

    stream.end()
  })

  describe('failImmediately reporter', () => {
    it('should not emit an error if failImmediately reporter is not being used', done => {
      stream
        .pipe(alexProxy.reporter())
        .on('error', () => {
          throw new Error('Should not emit an error')
        })
        .on('end', done)
        .resume()

      stream.write(fileWithOneError)

      stream.end()
    })

    it('should emit an error if using failImmediately reporter', done => {
      stream
        .pipe(alexProxy.reporter('failImmediately'))
        .on('error', error => {
          expect(error.plugin).to.eql('gulp-alex')

          expect(error.name).to.eql('AlexError')
          expect(error.message).to.eql(`Alex failed for ${fileWithOneError.path}`)
          done()
        })

      stream.write(fileWithOneError)

      stream.end()
    })
  })

  describe('fail reporter', () => {
    it('should not emit an error if no issues', done => {
      stream
        .pipe(alexProxy.reporter())
        .pipe(alexProxy.reporter('fail'))
        .on('error', () => {
          throw new Error('Should not emit an error')
        })
        .on('end', done)
        .resume()

      stream.write(validFile)
      stream.write(validFile)

      stream.end()
    })

    it('should emit an error after all files have been processed', done => {
      stream
        .pipe(alexProxy.reporter())
        .pipe(alexProxy.reporter('fail'))
        .on('error', error => {
          expect(error.plugin).to.eql('gulp-alex')

          expect(error.name).to.eql('AlexError')
          expect(error.message).to.eql(`Alex failed for ${filePath}, ${filePath}`)
          done()
        })

      stream.write(fileWithOneError)
      stream.write(fileWithOneError)

      stream.end()
    })
  })

  describe('allowables', () => {
    it('should use .alexrc', done => {
      findUpStub = austin.spy().withArgs('.alexrc').returns(Promise.resolve('.alexrc'))
      const fsStub = {
        readFile(file, encoding, cb) {
          cb(null, '{"allow": ["garbagemen-garbagewomen"]}')
        }
      }

      alexProxy = proxyquire('../lib', {
        'find-up': findUpStub,
        fs: fsStub,
        'vfile-reporter': reporter
      })

      stream
        .pipe(alexProxy())
        .pipe(alexProxy.reporter('fail'))
        .on('data', () => undefined)
        .on('error', () => {
          expect(true).to.eql('an error should not happen')
        })
        .on('end', () => {
          expect(findUpStub.callCount()).to.eql(2)
          done()
        })

      stream.write(validFile)
      stream.write(fileWithOneError)

      stream.end()
    })

    it('should use package.json if .alexrc file not found', done => {
      readPkgUpStub = austin.spy().returns(Promise.resolve({
        pkg: {
          alex: {
            allow: ['garbagemen-garbagewomen']
          }
        }
      }))
      alexProxy = proxyquire('../lib', {
        'find-up': findUpStub,
        'read-pkg-up': readPkgUpStub,
        'vfile-reporter': reporter
      })

      stream
        .pipe(alexProxy())
        .pipe(alexProxy.reporter('fail'))
        .on('data', () => undefined)
        .on('error', () => {
          expect(true).to.eql('an error should not happen')
        })
        .on('end', () => {
          done()
        })

      stream.write(validFile)
      stream.write(fileWithOneError)

      stream.end()
    })
  })
})
