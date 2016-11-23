var request = require('request');
var fs = require('fs');

var rsa = require('../lib/rsa');

var s_index = 0;

function getSounds(sounds, album_name) {
    var dir = `./temp/${album_name}`;
    var new_sounds = sounds.map((sound) => {
        return {
            id: sound.id,
            name: sound.name.replace(' ', '_'),
            picUrl: sound.album.picUrl
        }
    });

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, 755);
    }

    multipleDownloadPics(new_sounds, dir, 2);

    var enc = getEnc(new_sounds);
    request.post({
        url: "http://music.163.com/weapi/song/enhance/player/url?csrf_token=",
        form: {
            params: enc.encText,
            encSecKey: enc.encSecKey
        }
    }, (err, response, body) => {
        body = JSON.parse(body);
        multipleDownloadSounds(body.data, dir, 5);
    });
}

function getEnc (new_sounds) {
    let ids = new_sounds.map((new_sound) => {
        return new_sound.id;
    });
    let object = {
        ids: ids,
        br: 128000,
        csrf_token: ''
    }
    return rsa(object);
}

function multipleDownloadPics(sounds, dir, num) {
    var len = sounds.length;
    var begin = 0;
    var step = Math.ceil(len / num);
    while(begin < len) {
        downloadPics(sounds.slice(begin, begin + step), dir);
        begin += step;
    }
}

function downloadPics(sounds, dir, p_index = 0) {
    let sound = sounds[p_index++];
    if (sound) {
        request.get(sound.picUrl)
            .on('error', (error) => {
                console.log(error);
            }).pipe(fs.createWriteStream(`${dir}/${sound.id}.jpg`)
                .on('finish', () => {
                    downloadPics(sounds, dir, p_index);
                }));
    } else {
        console.log('all pictures download successed');
    }
}

function multipleDownloadSounds(sounds, dir, num) {
    var len = sounds.length;
    var begin = 0;
    var step = Math.ceil(len / num);
    while(begin < len) {
        downloadSounds(sounds.slice(begin, begin + step), dir);
        begin += step;
    }
}

function downloadSounds(sounds, dir, s_index = 0) {
    let sound = sounds[s_index++];
    if (sound) {
        request.get(sound.url)
            .on('error', (error) => {
                console.log(error);
            }).pipe(fs.createWriteStream(`${dir}/${sound.id}.${sound.type}`)
                .on('finish', () => {
                    downloadSounds(sounds, dir, s_index);
                }));
    } else {
        console.log('all sounds download successed');
    }
}

module.exports = getSounds;