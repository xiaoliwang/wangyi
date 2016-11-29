var request = require('request');
var fs = require('fs');
var { download } = require('../config/config');
var downloadController = require('../controller/downloadController');

var rsa = require('../lib/rsa');

var s_index = 0;

const pic_thread = download.pic_con;
const sound_thread = download.sound_con;

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

    var album_sounds = {
        album_dir: dir,
        sounds: new_sounds
    }

    fs.writeFileSync(`./temp/soundlist.txt`, JSON.stringify(album_sounds));

    multipleDownload(new_sounds, dir, pic_thread);

    var enc = getEnc(new_sounds);
    request.post({
        url: "http://music.163.com/weapi/song/enhance/player/url?csrf_token=",
        form: {
            params: enc.encText,
            encSecKey: enc.encSecKey
        }
    }, (err, response, body) => {
        body = JSON.parse(body);
        multipleDownload(body.data, dir, sound_thread, false);
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

/**
 * type 1为图片， 10为音频
 */
function multipleDownload(sounds, dir, num, is_pic = true) {
    var len = sounds.length;
    var begin = 0;
    var step = Math.floor(len / num);
    while(begin < len) {
        if ((begin + 2 * step) > len) {
            step = len - begin;
        }

        if (is_pic) {
            downloadPics(sounds.slice(begin, begin + step), dir);
        } else {
            downloadSounds(sounds.slice(begin, begin + step), dir);
        }
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
        downloadController.emit('part_finish', 0);
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
        downloadController.emit('part_finish', 1);
    }
}

module.exports = getSounds;