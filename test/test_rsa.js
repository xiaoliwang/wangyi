var request = require('request');
var rsa = require('../lib/rsa');

var object = {
    ids: [26620105],
    br: 128000,
    csrf_token: ''  
}

var obj = rsa(object);

request.post({
    url: "http://music.163.com/weapi/song/enhance/player/url?csrf_token=",
    form: {
        params: obj.encText,
        encSecKey: obj.encSecKey
    }
}, function(err, response, body){
    console.log(body);
});