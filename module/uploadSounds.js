var request = require('request');
const co = require('co');
var FormData = require('form-data');
var fs = require('fs');
const config = require('../config/login.js');
const promiseify = require('../lib/promiseify');

request= request.defaults({jar: true});

request.post = promiseify(request.post);
request.get = promiseify(request.get);

function *uploadSound() {
    // 登录M站
    yield request.post({
        url: "http://test.com/member/login",
        headers: {
            'User-Agent': 'Iphone 8S Plus'
        },
        form: {
            "LoginForm[username]": config.username,
            "LoginForm[password]": config.password
        }
    });

    // 上传图片
    var formData = {
        my_field: 'my_vaule',
        my_buffer: new Buffer([1, 2, 3]),
        my_file: fs.createReadStream('C:/Users/tomcao/Desktop/wangyi/temp/AHSA/1217823.jpg'),
    };
    // let [response, body] = yield request.post({url:'http://test.com/', formData: formData});  
    // console.log(body);
}

co(uploadSound);