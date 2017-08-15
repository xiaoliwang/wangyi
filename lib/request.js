const request = require('request');
const promiseify = require('../lib/promiseify');


request.getSync = promiseify(request.get);
request.postSync = promiseify(request.post);

module.exports = request;