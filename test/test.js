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

  it('should not report if no files passed', done => {
    let stream = alexProxy();

    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(undefined);
        expect(reporter.called).to.eql(false);
        done();
      });

    stream.write();

    stream.end();
  });

  it('should report if an error is not found', done => {
    let stream = alexProxy();

    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(validFile);
        expect(reporter.calledOnce).to.eql(true);
        done();
      });

    stream.write(validFile);

    stream.end();
  });

  it('should report if an error is found', done => {
    let stream = alexProxy();

    stream
      .pipe(alexProxy.reporter())
      .on('data', file => {
        expect(file).to.eql(fileWithOneError);
        expect(reporter.calledOnce).to.eql(true);
        done();
      });

    stream.write(fileWithOneError);

    stream.end();
  });

  it('should not print if an error is not found', done => {
    let stream = alexProxy();

    reporter.returns('');
    sinon.spy(global.console, 'log');

    stream
      .pipe(alexProxy.reporter())
      .on('data', () => {
        expect(global.console.log.called).to.eql(false);
        global.console.log.restore();
        done();
      });

    stream.write(validFile);

    stream.end();
  });

  it('should print if an error is found', done => {
    let stream = alexProxy();

    reporter.returns('error');
    sinon.spy(global.console, 'log');

    stream
      .pipe(alexProxy.reporter())
      .on('data', () => {
        expect(global.console.log.calledWith('error')).to.eql(true);
        global.console.log.restore();
        done();
      });

    stream.write(validFile);

    stream.end();
  });

  describe('fail option', () => {
    it('should not emit an error if fail reporter is not being used', done => {
      let stream = alexProxy();

      stream
        .pipe(alexProxy.reporter())
        .on('error', () => {
          throw new Error('Should not emit an error');
        })
        .on('data', () => {
          done();
        });

      stream.write(fileWithOneError);

      stream.end();
    });

    it('should emit an error if using fail reporter', done => {
      let stream = alexProxy();

      stream
        .pipe(alexProxy.reporter('fail'))
        .on('error', error => {
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
