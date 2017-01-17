/**
 * Created by tomcao on 2016/12/12.
 */
const EventEmitter = require('events');

const { download } = require('../config/config');
const uploadSounds = require('../model/uploadSounds');

const db = require('../lib/db');

class DownloadEvent extends EventEmitter {};
const downloadEvent = new DownloadEvent();

// 下载进度控制器,0为图片，1为音屏
let progress_bars = [{
    name: 'picture',
    loaded: 1,
    total: download.pic_con,
    finished: false
}, {
    name: 'sound',
    loaded: 1,
    total: download.sound_con,
    finished: false
}];

downloadEvent.on('part_finish', (type, album_id) => {
    let progress = progress_bars[type];
    if (progress.total === progress.loaded) {
        console.log(`all ${progress.name}s downloaded success`);
        downloadEvent.emit('all_finish', type, album_id);
    } else {
        console.log(`${progress.name} part ${progress.loaded} download finish`);
        ++progress.loaded;
    }
});

downloadEvent.on('all_finish', async (type, album_id) => {
    let progress = progress_bars[type];
    progress.finished = true;
    if (progress_bars.every((progress) => {
        return progress.finished
    })) {
        await db.updateSync(
            { id: album_id, type: 'album'},
            { $set: {download: true}}
        );
        console.log('all part download succeed');
        uploadSounds(album_id);
    }
});

module.exports = downloadEvent;