/* global describe, beforeEach, it */
'use strict';
import {expect} from 'chai';
import {File} from 'gulp-util';
import {join} from 'path';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('gulp-alex', () => {
  let fileWithOneError, fileWithTwoErrors, validFile;

  beforeEach(() => {
    fileWithOneError = new File({
      base: './',
      path: join('users', 'dustin', 'project', 'awesome.project.md'),
      contents: new Buffer('Garbagemen versus Abe Lincoln!')
    });

    fileWithTwoErrors = new File({
      base: './',
      path: join('users', 'dustin', 'project', 'awesome.project.md'),
      contents: new Buffer('Garbagemen versus Abe Lincoln! Be like a man.')
    });

    validFile = new File({
      base: './',
      path: join('users', 'dustin', 'project', 'awesome.project.md'),
      contents: new Buffer('Abe Lincoln is awesome.')
    });
  });

  it('should not log if no files passed', (done) => {
    let alexProxy, gutilStub, stream;

    gutilStub = {
      log: sinon.stub()
    };

    alexProxy = proxyquire('../lib', {'gulp-util': gutilStub});

    stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(undefined);
      expect(gutilStub.log.called).to.eql(false);
      done();
    });

    stream.write();

    stream.end();
  });

  it('should not log if no errors found', (done) => {
    let alexProxy, gutilStub, stream;

    gutilStub = {
      log: sinon.stub()
    };

    alexProxy = proxyquire('../lib', {'gulp-util': gutilStub});

    stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(validFile);
      expect(gutilStub.log.called).to.eql(false);
      done();
    });

    stream.write(validFile);

    stream.end();
  });

  it('should log if an error is found', (done) => {
    let alexProxy, gutilStub, stream;

    gutilStub = {
      log: sinon.stub()
    };

    alexProxy = proxyquire('../lib', {'gulp-util': gutilStub});

    stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(fileWithOneError);
      expect(gutilStub.log.withArgs('awesome.project.md').calledOnce).to.eql(true);
      expect(gutilStub.log.withArgs('  1:1 `Garbagemen` may be insensitive, use `Garbage collectors`, `Waste collectors`, `Trash collectors` instead').calledOnce).to.eql(true);
      done();
    });

    stream.write(fileWithOneError);

    stream.end();
  });

  it('should right align row/col numbers for multiple errors', (done) => {
    let alexProxy, gutilStub, stream;

    gutilStub = {
      log: sinon.stub()
    };

    alexProxy = proxyquire('../lib', {'gulp-util': gutilStub});

    stream = alexProxy();

    stream.on('data', (file) => {
      expect(file).to.eql(fileWithTwoErrors);
      expect(gutilStub.log.withArgs('awesome.project.md').calledOnce).to.eql(true);
      expect(gutilStub.log.withArgs('   1:1 `Garbagemen` may be insensitive, use `Garbage collectors`, `Waste collectors`, `Trash collectors` instead').calledOnce).to.eql(true);
      expect(gutilStub.log.withArgs('  1:35 `like a man` may be insensitive, use `resolutely`, `bravely` instead').calledOnce).to.eql(true);
      done();
    });

    stream.write(fileWithTwoErrors);

    stream.end();
  });
});
