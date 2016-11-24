const EventEmitter = require('events');
const { download } = require('../config/config');

class DownloadEmitter extends EventEmitter {}

const downloadController = new DownloadEmitter;

let index = [1, 1];
let all_part = [download.pic_con, download.sound_con];
let name = ['picture', 'sound'];

downloadController.on('part_finish', (type) => {
    if (index[type] === all_part[type]) {
        console.log(`${name[type]}s download succeed`);
        downloadController.emit('finish');
    } else {
        console.log(`${name[type]} part ${index[type]} download finish`);
        ++index[type]
    }
});

var finished = 0;
downloadController.on('finish', () => {
    ++finished;
    if (finished >= all_part.length) {
        console.log('all part download succeed')
    }
});

module.exports = downloadController;