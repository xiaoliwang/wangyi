var request = require('request');
var promiseify = require('./promiseify');

request.get = promiseify(request.get);
request.post = promiseify(request.post);

request.get('http://testslb.missevan.com/mobile/site/version').then((response) => {
    var body = response[1];
    console.log(JSON.parse(body));
});