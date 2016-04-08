/**
 * @file ttf2svgs fontmin plugin
 * @author junmer
 */

import path from 'path';
import through from 'through2';
import _ from 'lodash';
import {b2ab} from 'b3b';
import {TTFReader} from 'fonteditor-core';
import contours2svg from 'fonteditor-core/ttf/util/contours2svg';


const svgTpl = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" id="<%=name%>" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"<%if (size) {%> width="<%=size%>" height="<%=size%>"<%}%> viewBox="<%=viewBox%>">
<path fill="<%=fillColor%>" d="<%=d%>" transform="translate(0, <%=acent%>) scale(1, -1)" />
</svg>`;

const renderSVG = _.template(svgTpl);

/**
 * rename
 *
 * @param  {string} filepath filepath
 * @param  {Object} opts     options
 * @return {string}          filepath
 */
const rename = (filepath, opts) => {
    let pathObject = path.parse(filepath);
    pathObject = _.assign(pathObject, opts || {});
    pathObject.base = pathObject.name + pathObject.ext;
    return path.format(pathObject);
};

/**
 * assignHas
 *
 * @param  {Object} source    source
 * @param  {Object} target    target
 * @param  {Array} propertys propertys
 * @return {Object}           assigned object
 */
const assignHas = (source, target, propertys) => {
    target = target || {};
    propertys.forEach(key => {
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
module.exports = opts => {

    opts = _.assign({fillColor: '#333', exclude: true}, opts);

    /**
     * exclude notdef glyf
     *
     * @param  {Object} glyf glyf
     * @return {boolean}      result
     */
    let exclude = glyf => {

        if (_.isFunction(opts.exclude)) {
            return opts.exclude(glyf);
        }

        return opts.exclude
            ? (glyf.name !== '.notdef'
              && glyf.name !== '.null'
              && glyf.name !== 'nonmarkingreturn')
            : true;
    };

    return through.ctor({
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
        if (path.extname(file.path) !== '.ttf') {
            cb(null, file);
            return;
        }

        // clone
        this.push(file.clone());

        // parse ttf
        let ttf = file.ttfObject
            ? file.ttfObject
            : new TTFReader(opts).read(b2ab(file.contents));

        // glyf map
        let glyfMap = {};

        for (var i = 0, l = ttf.glyf.length; i < l; i++) {

            let glyf = ttf.glyf[i];

            if (
                !glyf.compound
                && glyf.contours
                && glyf.contours.length
                && glyf.unicode
                && glyf.unicode.length
                && exclude(glyf)
                ) {

                // size
                let unitsPerEm = ttf.head.unitsPerEm;
                let width = (glyf.xMax - glyf.xMin) || unitsPerEm;
                let height = (glyf.yMax - glyf.yMin) || unitsPerEm;
                let x = glyf.xMin || 0;
                let y = glyf.yMin || 0;
                let acent = glyf.yMax + glyf.yMin;
                let name = opts.name ? opts.name(glyf) : glyf.name;

                // glyf data
                let glyfObject = {
                    name: name,
                    fillColor: opts.fillColor,
                    d: contours2svg(glyf.contours),
                    width: width,
                    height: height,
                    viewBox: [x, y, width, height].join(' '),
                    acent: acent,
                    size: opts.size
                };

                // new svg file
                let svgFile = file.clone();
                svgFile.path = rename(svgFile.path, {ext: '.svg', name: glyf.name});
                svgFile.contents = new Buffer(renderSVG(glyfObject));
                this.push(svgFile);

                // add glyfMap
                glyfMap[name] = {};
                assignHas(glyfMap[name], glyfObject, ['d', 'viewBox', 'acent']);

                if (opts.size) {
                    glyfMap[name] = opts.size;
                }
                else {
                    assignHas(glyfMap[name], glyfObject, ['width', 'height']);
                }
            }
        }

        file.path = rename(file.path, {ext: '.json'});
        file.contents = new Buffer(JSON.stringify(glyfMap, '', 4));
        cb(null, file);

    });

};
