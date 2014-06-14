/**
* JSONfn - javascript (both node.js and browser) plugin to stringify,
*          parse and clone objects with Functions, Regexp and Date.
*
* Version - 0.60.00
* Copyright (c) 2012 - 2014 Vadim Kiryukhin
* vkiryukhin @ gmail.com
* http://www.eslinstructor.net/jsonfn/
*
* Licensed under the MIT license ( http://www.opensource.org/licenses/mit-license.php )
*
*   USAGE:
*     browser:
*         JSONfn.stringify(obj);
*         JSONfn.parse(str[, date2obj]);
*         JSONfn.clone(obj[, date2obj]);
*
*     nodejs:
*       var JSONfn = require('path/to/json-fn');
*       JSONfn.stringify(obj);
*       JSONfn.parse(str[, date2obj]);
*       JSONfn.clone(obj[, date2obj]);
*
*
*     @obj      -  Object;
*     @str      -  String, which is returned by JSONfn.stringify() function;
*     @date2obj - Boolean (optional); if true, date string in ISO8061 format
*                 is converted into a Date object; otherwise, it is left as a String.
*/

"use strict";

(function (exports) {
  exports.util = {
  inspect: require('util-inspect'),
}

exports.uneval = function(obj, known) {
    var root = (known === undefined), result;
    known = known || [];

    // some values fail eval() if not wrapped in a ( ) parenthesises
    var wrapRoot = function(result) {
      return root ? ("(" + result + ")") : result;
    }

    // special objects
    if (obj === null)
      return "null";
    if (obj === undefined)
      return "undefined";
    if (obj !== obj) // isNaN does type coercion, so can't use that.
      return "NaN";
    if (obj === Infinity)
      return "Infinity";
    if (obj === -Infinity)
      return "-Infinity";

    // atoms
    switch (typeof obj) {
      case 'function':
        return wrapRoot(obj.toString());
      case 'string':
      case 'number':
      case 'boolean':
        return exports.util.inspect(obj);
    }

    // circular reference check for non-atoms
    if (known.indexOf(obj) !== -1)
      throw new Error("Circular references detected while uneval()-ing.");

    known.push(obj);

    // specialized types
    if (obj instanceof Array)
      return "[" + obj.map(function(o) { return exports.uneval(o, known); }).join(",") + "]";

    if (obj instanceof Date)
      return wrapRoot("new Date('" + obj.toString() + "')");

    // hashes
    var key, pairs = [];

    for (key in obj)
      pairs.push(exports.uneval(key, known) + ":" + exports.uneval(obj[key], known));

    return wrapRoot("{" + pairs.join(",") + "}");

  };


  exports.stringify = function (obj) {

    return JSON.stringify(obj, function (key, value) {
      if (value instanceof Function || typeof value == 'function') {
        return value.toString();
      }
      if (value instanceof RegExp) {
        return '_PxEgEr_' + value;
      }
      return value;
    });
  };

  exports.parse = function (str, date2obj) {

    var iso8061 = date2obj ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/ : false;

    return JSON.parse(str, function (key, value) {
      var prefix;

      if (typeof value != 'string') {
        return value;
      }
      if (value.length < 8) {
        return value;
      }

      prefix = value.substring(0, 8);

      if (iso8061 && value.match(iso8061)) {
        return new Date(value);
      }
      if (prefix === 'function') {
        return eval('(' + value + ')');
      }
      if (prefix === '_PxEgEr_') {
        return eval(value.slice(8));
      }

      return value;
    });
  };

  exports.clone = function (obj, date2obj) {
    return exports.parse(exports.stringify(obj), date2obj);
  };

  exports.parseSafe = function (str, date2obj) {

    var iso8061 = date2obj ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/ : false;

    var json = exports.uneval(JSON.parse(str, function (key, value) {
      var prefix;

      if (typeof value != 'string') {
        return value;
      }
      if (value.length < 8) {
        return value;
      }

      prefix = value.substring(0, 8);

      if (iso8061 && value.match(iso8061)) {
        return new Date(value);
      }
      if (prefix === 'function') {
        return eval('(' + value + ')');
      }
      if (prefix === '_PxEgEr_') {
        return eval(value.slice(8));
      }

      return value;
    }));
    return json;
  };

}(typeof exports === 'undefined' ? (window.JSONfn = {}) : exports));


