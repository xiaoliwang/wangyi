const request = require('../lib/request');
const fs = require('fs');

const { download } = require('../config');
const downloadEvent = require('../dispatchers');

const rsa = require('../lib/rsa');
const db = require('../lib/db');

const pic_thread = download.pic_con;
const sound_thread = download.sound_con;

async function getSounds(sounds, album_id) {
    let dir = `./temp/${album_id}`;
    // 创建专辑文件夹
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, 755);
    }

    let dPics = sounds.filter((sound) => {
        return !sound.pic_download;
    });

    if (!dPics.length) {
        downloadEvent.emit('all_finish', 0, parseInt(album_id));
    } else {
        multipleDownload(dPics, dir, album_id, pic_thread);
    }

    let dSounds = sounds.filter((sound) => {
        return !sound.sound_download;
    });

    if (!dSounds.length) {
        downloadEvent.emit('all_finish', 1, parseInt(album_id));
    } else {
        // 获取加密密钥
        var enc = getEnc(dSounds);
        let body = await request.postSync({
            url: "http://music.163.com/weapi/song/enhance/player/url?csrf_token=",
            form: {
                params: enc.encText,
                encSecKey: enc.encSecKey
            }
        });
        dSounds = JSON.parse(body[1]).data;
        dSounds = dSounds.map((sound) => {
            return Object.assign(sound, { album_id: parseInt(album_id) });
        });
        multipleDownload(dSounds, dir, album_id, sound_thread, false);
    }
}

function getEnc (sounds) {
    let ids = sounds.map((sound) => {
        return sound.id;
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
function multipleDownload(sounds, dir, album_id, num, is_pic = true) {
    let len = sounds.length;
    let begin = 0, end = 0;
    let step = Math.floor(len / num);
    let more_step = len % num;

    while (begin < len) {
        end = begin + step + ((more_step --> 0 ) ? 1 : 0);
        if (is_pic) {
            downloadPics(sounds.slice(begin, end), dir, album_id);
        } else {
            downloadSounds(sounds.slice(begin, end), dir, album_id);
        }
        begin = end;
    }
}

var mission_pic_index = 1;
function downloadPics(sounds, dir, album_id, p_index = 0) {
    if (!p_index) console.log(`picture mission ${mission_pic_index++} start`);
    let sound = sounds[p_index++];
    if (sound) {
        request.get(sound.picUrl)
            .on('error', (error) => {
                console.log(error);
            }).pipe(fs.createWriteStream(`${dir}/${sound.id}.jpg`)
                .on('finish', async () => {
                    await db.updateSync(
                        { id: sound.id, album_id: sound.album_id, type: 'sound'},
                        { $set: { pic_download: true } }
                    )
                    downloadPics(sounds, dir, album_id, p_index);
                }));
    } else {
        downloadEvent.emit('part_finish', 0, album_id);
    }
}

var mission_sound_index = 1;
function downloadSounds(sounds, dir, album_id, s_index = 0) {
    if (!s_index) console.log(`sound mission ${mission_sound_index++} start`);
    let sound = sounds[s_index++];
    if (sound) {
        request.get(sound.url)
            .on('error', (error) => {
                console.log(error);
            }).pipe(fs.createWriteStream(`${dir}/${sound.id}.${sound.type}`)
                .on('finish', async () => {
                    await db.updateSync(
                        { id: sound.id, album_id: sound.album_id, type: 'sound'},
                        { $set: {sound_download: true} }
                    )
                    downloadSounds(sounds, dir, album_id, s_index);
                }));
    } else {
        downloadEvent.emit('part_finish', 1, album_id);
    }
}

module.exports = getSounds;