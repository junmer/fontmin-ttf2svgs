fontmin-ttf2svgs
===

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Dependencies][dep-image]][dep-url]


> fontmin ttf2svgs plugin


## Usage

```javascript
var Fontmin = require('fontmin');
var ttf2svgs = require('fontmin-ttf2svgs');

var fontmin = new Fontmin()
    .src('font.ttf')
    .use(ttf2svgs({
    	size: 500,
    	fillColor: '#666'
    }))

// => *.svg, font.json

```


## Related

- [fontmin](https://github.com/ecomfe/fontmin)


[travis-url]: https://travis-ci.org/junmer/fontmin-ttf2svgs
[travis-image]: http://img.shields.io/travis/junmer/fontmin-ttf2svgs.svg
[downloads-image]: http://img.shields.io/npm/dm/fontmin-ttf2svgs.svg
[npm-url]: https://npmjs.org/package/fontmin-ttf2svgs
[npm-image]: http://img.shields.io/npm/v/fontmin-ttf2svgs.svg
[dep-url]: https://david-dm.org/junmer/fontmin-ttf2svgs
[dep-image]: http://img.shields.io/david/junmer/fontmin-ttf2svgs.svg
