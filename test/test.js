/* global describe, beforeEach, it */
'use strict';
import {expect} from 'chai';
import {File} from 'gulp-util';
import {join} from 'path';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('gulp-alex', () => {
  let alexProxy, fileWithOneError, reporter, validFile;

  beforeEach(() => {
    reporter = sinon.stub();
    alexProxy = proxyquire('../lib', {'vfile-reporter': reporter});

    fileWithOneError = new File({
      base: './',
      path: join('users', 'dustin', 'project', 'awesome.project.md'),
      contents: new Buffer('Garbagemen versus Abe Lincoln!')
    });

    validFile = new File({
      base: './',
      path: join('users', 'dustin', 'project', 'awesome.project.md'),
      contents: new Buffer('Abe Lincoln is awesome.')
    });
  });

  it('should not report if no files passed', (done) => {
    let stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(undefined);
      expect(reporter.called).to.eql(false);
      done();
    });

    stream.write();

    stream.end();
  });

  it('should report if an error is not found', (done) => {
    let stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(validFile);
      expect(reporter.calledOnce).to.eql(true);
      done();
    });

    stream.write(validFile);

    stream.end();
  });

  it('should report if an error is found', (done) => {
    let stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(fileWithOneError);
      expect(reporter.calledOnce).to.eql(true);
      done();
    });

    stream.write(fileWithOneError);

    stream.end();
  });

  describe('default options', () => {
    it('should call reporter with default options when none passed', (done) => {
      let stream = alexProxy()
        , actualOptions;

      stream.on('data', () => {
        actualOptions = reporter.args[0][1];
        expect(actualOptions).to.eql({});
        done();
      });

      stream.write(validFile);

      stream.end();
    });
  });

  describe('configured options', () => {
    it('should pass options to reporter', (done) => {
      let actualOptions, options, stream;

      options = {
        quiet: true,
        silent: true
      };

      stream = alexProxy(options);

      stream.on('data', () => {
        actualOptions = reporter.args[0][1];
        expect(actualOptions.quiet).to.eql(true);
        expect(actualOptions.silent).to.eql(true);
        done();
      });

      stream.write(validFile);

      stream.end();
    });
  });

  describe('fail option', () => {
    it('should not emit an error if fail is false', (done) => {
      let options, stream;

      options = {
        fail: false
      };

      stream = alexProxy(options);

      stream.on('data', () => {
        done();
      });

      stream.on('error', () => {
        throw new Error('Should not emit an error');
      });

      stream.write(fileWithOneError);

      stream.end();
    });

    it('should emit an error if fail is true', (done) => {
      let options, stream;

      options = {
        fail: true
      };

      stream = alexProxy(options);

      stream.on('error', (error) => {
        expect(error.plugin).to.eql('gulp-alex');

        expect(error.name).to.eql('AlexError');
        expect(error.message).to.eql(`Alex failed for ${fileWithOneError.path}`);
        done();
      });

      stream.write(fileWithOneError);

      stream.end();
    });
  });
});
