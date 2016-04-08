/**
 * @file test
 * @author junmer
 */

/* eslint-env node */

'use strict';

var assert = require('assert');
var fs =  require('fs');
var path = require('path');
var vfs = require('vinyl-fs');
var del = require('del');

var ttf2svgs = require('../');

var outputPath = path.resolve(__dirname, 'output');
var fontName = 'fontawesome-webfont';
var size = 500;

before(function (done) {
    del(outputPath).then(function () {
        done();
    });
});

describe('ttf2svgs', function() {

    var github = path.resolve(outputPath, 'github.svg');
    var githubSvg;

    before(function (done) {

        var fsOpt = {cwd: __dirname};
        var stream = vfs.src('fixtures/' + fontName + '.ttf', fsOpt)
        .pipe(ttf2svgs({
            size: size,
            fillColor: "#666"
        })())
            .pipe(vfs.dest('output', fsOpt));

        stream.on('end', function () {
            githubSvg = fs.readFileSync(github, 'utf-8');
            done();
        });

    });

    it('output shoud have `.json`', function () {
        var json = path.resolve(outputPath, fontName + '.json');
        assert(fs.existsSync(json));
    });


    it('output shoud have `github.svg`', function () {
        assert(fs.existsSync(github));
    });

    it('size of `github.svg` should be ' + size, function () {
        assert(new RegExp('width=\"' + size + '\"').test(githubSvg));
    });

    it('fillColor of `github.svg` should be `#666`', function () {
        assert(/fill=\"\#666\"/.test(githubSvg));
    });

});


