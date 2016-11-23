/**
 * Created by tomcao on 2016/10/18.
 */
"use strict"
var assert = require('assert');
var slice = Array.prototype.slice;

module.exports = promiseify;

// 对对象进行promise封装
promiseify.wrap = function(obj, keys) {
    assert('object' === typeof obj, 'Object required');
    assert(Array === keys.constructor, 'Array required');
    for (let key of keys) {
        if (obj[key]) {
            obj[key] = promiseify.call(obj, obj[key]);
        }
    }
    return obj;
};

// 将函数promise化处理
function promiseify(fn) {
    assert('function' === typeof fn, 'function required');

    return function() {
        var args = Array.from(arguments);
        var ctx = this;

        return new Promise((resolve, reject) => {
            args.push(function(err, res) {
                if (err) return reject(err);
                if (arguments.length > 2) res = slice.call(arguments, 1);
                resolve(res);
            });

            try {
                fn.apply(ctx, args);
            } catch (err) {
                reject(err);
            }
        });
    }
}