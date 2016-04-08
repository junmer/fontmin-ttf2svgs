/**
 * @file ttf2svgs fontmin plugin
 * @author junmer
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _b3b = require('b3b');

var _fonteditorCore = require('fonteditor-core');

var _fonteditorCoreTtfUtilContours2svg = require('fonteditor-core/ttf/util/contours2svg');

var _fonteditorCoreTtfUtilContours2svg2 = _interopRequireDefault(_fonteditorCoreTtfUtilContours2svg);

var svgTpl = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg version="1.1" id="<%=name%>" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"<%if (size) {%> width="<%=size%>" height="<%=size%>"<%}%> viewBox="<%=viewBox%>">\n<path fill="<%=fillColor%>" d="<%=d%>" transform="translate(0, <%=acent%>) scale(1, -1)" />\n</svg>';

var renderSVG = _lodash2['default'].template(svgTpl);

/**
 * rename
 *
 * @param  {string} filepath filepath
 * @param  {Object} opts     options
 * @return {string}          filepath
 */
var rename = function rename(filepath, opts) {
    var pathObject = _path2['default'].parse(filepath);
    pathObject = _lodash2['default'].assign(pathObject, opts || {});
    pathObject.base = pathObject.name + pathObject.ext;
    return _path2['default'].format(pathObject);
};

/**
 * assignHas
 *
 * @param  {Object} source    source
 * @param  {Object} target    target
 * @param  {Array} propertys propertys
 * @return {Object}           assigned object
 */
var assignHas = function assignHas(source, target, propertys) {
    target = target || {};
    propertys.forEach(function (key) {
        if (target.hasOwnProperty(key)) {
            source[key] = target[key];
        }
    });
    return source;
};

/**
 * ttf2svgs fontmin plugin
 *
 * @param {Object} opts opts
 * @param {string=} opts.fillColor fillColor
 * @param {string=} opts.size size
 * @param {Function=} opts.name name
 * @param {Function|boolean=} opts.exclude exclude
 * @param {Object} opts.name opts
 * @return {Object} stream.Transform instance
 * @api public
 */
module.exports = function (opts) {

    opts = _lodash2['default'].assign({ fillColor: '#333', exclude: true }, opts);

    /**
     * exclude notdef glyf
     *
     * @param  {Object} glyf glyf
     * @return {boolean}      result
     */
    var exclude = function exclude(glyf) {

        if (_lodash2['default'].isFunction(opts.exclude)) {
            return opts.exclude(glyf);
        }

        return opts.exclude ? glyf.name !== '.notdef' && glyf.name !== '.null' && glyf.name !== 'nonmarkingreturn' : true;
    };

    return _through22['default'].ctor({
        objectMode: true
    }, function (file, enc, cb) {

        // check null
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        // check stream
        if (file.isStream()) {
            cb(new Error('Streaming is not supported'));
            return;
        }

        // check ttf
        if (_path2['default'].extname(file.path) !== '.ttf') {
            cb(null, file);
            return;
        }

        // clone
        this.push(file.clone());

        // parse ttf
        var ttf = file.ttfObject ? file.ttfObject : new _fonteditorCore.TTFReader(opts).read((0, _b3b.b2ab)(file.contents));

        // glyf map
        var glyfMap = {};

        for (var i = 0, l = ttf.glyf.length; i < l; i++) {

            var glyf = ttf.glyf[i];

            if (!glyf.compound && glyf.contours && glyf.contours.length && glyf.unicode && glyf.unicode.length && exclude(glyf)) {

                // size
                var unitsPerEm = ttf.head.unitsPerEm;
                var width = glyf.xMax - glyf.xMin || unitsPerEm;
                var height = glyf.yMax - glyf.yMin || unitsPerEm;
                var x = glyf.xMin || 0;
                var y = glyf.yMin || 0;
                var acent = glyf.yMax + glyf.yMin;
                var _name = opts.name ? opts.name(glyf) : glyf.name;

                // glyf data
                var glyfObject = {
                    name: _name,
                    fillColor: opts.fillColor,
                    d: (0, _fonteditorCoreTtfUtilContours2svg2['default'])(glyf.contours),
                    width: width,
                    height: height,
                    viewBox: [x, y, width, height].join(' '),
                    acent: acent,
                    size: opts.size
                };

                // new svg file
                var svgFile = file.clone();
                svgFile.path = rename(svgFile.path, { ext: '.svg', name: glyf.name });
                svgFile.contents = new Buffer(renderSVG(glyfObject));
                this.push(svgFile);

                // add glyfMap
                glyfMap[_name] = {};
                assignHas(glyfMap[_name], glyfObject, ['d', 'viewBox', 'acent']);

                if (opts.size) {
                    glyfMap[_name] = opts.size;
                } else {
                    assignHas(glyfMap[_name], glyfObject, ['width', 'height']);
                }
            }
        }

        file.path = rename(file.path, { ext: '.json' });
        file.contents = new Buffer(JSON.stringify(glyfMap, '', 4));
        cb(null, file);
    });
};

