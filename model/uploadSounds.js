var fs = require('fs');

var request = require('request');
var FormData = require('form-data');

const config = require('../config/login');
const { upload } = require('../config/config')
const promiseify = require('../lib/promiseify');

const domain = upload.domain;

request= request.defaults({jar: true});

request.post = promiseify(request.post);
request.get = promiseify(request.get);

function *uploadSound() {
    // 登录M站
    yield request.post({
        url: `${domain}/member/login`,
        headers: {
            'User-Agent': 'Iphone 8S Plus'
        },
        form: {
            "LoginForm[username]": config.username,
            "LoginForm[password]": config.password
        }
    });

    let album_sounds = fs.readFileSync('./temp/soundlist.txt');
    album_sounds = JSON.parse(album_sounds);

    const dir = album_sounds.album_dir;

    for (let sound of album_sounds.sounds) {
        // 上传音频
        var formData = {
            "files[]": fs.createReadStream(`${dir}/${sound.id}.mp3`),
        };
        let [response, body] = yield request.post({
            url:`${domain}/msound/UploadSounds`, 
            formData: formData
        });
        let sound_info = JSON.parse(body);
        let sound_path = sound_info.files[0].url;
        
        console.log(`sound ${sound.name} upload success`);
        console.log(sound_path);

        formData = {
            "files[]": fs.createReadStream(`${dir}/${sound.id}.jpg`),
        }

        console.log('test');

        [response, body] = yield request.post({
            url: `${domain}/msound/UploadImages?minrequire=1`,
            formData: formData
        });
        let pic_info = JSON.parse(body);
        let pic_path = pic_info.files[0].url;

        console.log(`picture ${sound.name} upload success`);
        console.log(pic_path);

        [resposne, body] = yield request.post({
            url: `${domain}/msound/create`,
            form: {
                "MSound[soundstrlist][]": sound.name,
                keepvalue: 1,
                "MSound[soundurl][]": sound_path,
                "MSound[cover_image]": pic_path,
                "MSound[soundstr]": sound.name,
                "MSound[intro]": "",
                "MSound[catalog_id]": config.catalog_id,
                "MSound_bind_album": config.album_id,
                tags: '',
                "MSound[source]": 0,
                "MSound[download]": 0,
                x: 0,
                y: 0,
                w: 320,
                h: 320,
                d: 320,
                yt0: "确定上传",
            }
        });

        console.log(`${sound.name} upload success`);
    }
    console.log('success at all');
}

module.exports = uploadSound;