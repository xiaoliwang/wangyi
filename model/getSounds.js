var request = require('request');
var fs = require('fs');
var { download } = require('../config/config');
var downloadController = require('../controller/downloadController');

var rsa = require('../lib/rsa');

const pic_thread = download.pic_con;
const sound_thread = download.sound_con;

function getSounds(sounds, album_name) {
    let dir = `./temp/${album_name}`;
    global.album_dir = dir;

    // 创建专辑文件夹
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, 755);
    }

    let new_sounds = sounds.map((sound) => {
        return {
            id: sound.id,
            name: sound.name.replace('/\s/g', ''),
            picUrl: sound.album.picUrl
        }
    });

    var album_sounds = {
        album_dir: dir,
        sounds: new_sounds
    }

    fs.writeFileSync(`${dir}/soundlist.txt`, JSON.stringify(album_sounds));

    multipleDownload(new_sounds, dir, pic_thread);

    // 获取加密密钥
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
    let len = sounds.length;
    let begin = 0, end = 0;
    let step = Math.floor(len / num);
    let more_step = len % num;

    while (begin < len) {
        end = begin + step + ((more_step --> 0 ) ? 1 : 0);
        if (is_pic) {
            downloadPics(sounds.slice(begin, end), dir);
        } else {
            downloadSounds(sounds.slice(begin, end), dir);
        }
        begin = end;
    }
}

var mission_pic_index = 1;
function downloadPics(sounds, dir, p_index = 0) {
    if (!p_index) console.log(`picture mission ${mission_pic_index++} start`);
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

var mission_sound_index = 1;
function downloadSounds(sounds, dir, s_index = 0) {
    if (!s_index) console.log(`sound mission ${mission_sound_index++} start`);
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