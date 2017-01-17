const jsdom = require('jsdom');
const fs = require('fs');
const jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.min.js", "utf-8");

const getSounds = require('./model/getSounds');
const uploadSounds = require('./model/uploadSounds');

const rl = require('./lib/rl');
const db = require('./lib/db');

async function exec() {
    console.log('You can download playlist from music.163.com.');
    console.log('Enter the url to download');
    console.log('Enter download to continue download');
    console.log('Enter upload to continue upload files.');
    console.log('Enter exit to exit the program.');
    let url;
    do {
        url = await rl.questionSync('please input url:\n');
    } while (!(url = checkUrl(url)));
    switch (url) {
        case 'download':
            await keepDownload();break;
        case 'upload':
            await keepUpload();break;
        case 'exit':
            break;
        default:
            await getSoundsDetail(url);
    }
    rl.close();
}

async function getSoundsDetail(url) {
    await db.removeSync({ type: 'album' }, { multi: true });
    await db.removeSync({ type: 'sound' }, { multi: true });
    jsdom.env({
        url: url,
        src: [jquery],
        done: (err, window) => {
            if (!err) {
                let $ = window.$;
                let album_id = $("#content-operation").data('rid');
                if (album_id) {
                    let sounds = JSON.parse($($("textarea")[0]).text());
                    dealWithSounds(sounds, album_id);
                } else {
                    console.log('This playlist is not exist');
                }
            } else {
                console.log('net works bad, try again later');
            } 
        }
    });
}

async function keepDownload() {
    let albums = await db.findSync({ type: 'album', download: false });
    if (albums.length) {
        let album_ids = albums.map((album) => {
            return album.id;
        });
        let ids = album_ids.join(',');
        console.log(`You have these albums ${ids}`);
        let album_id;
        do {
            album_id = await rl.questionSync('Which album do you want to download:\n');
        } while (!album_ids.find((id) => { return id == album_id}))
        let sounds = await db.findSync({ 
            type: 'sound',
            album_id: parseInt(album_id),
            $or: [{pic_download: false}, {sound_download: false}],
        });
        getSounds(sounds, album_id);
    } else {
        console.log('You don\'t have any albums not finish download');
    }
}

async function keepUpload() {
    let albums = await db.findSync({ type: 'album', download: true, upload: false });
    if (albums.length) {
        let album_ids = albums.map((album) => {
            return album.id;
        });
        let ids = album_ids.join(',');
        console.log(`You have these albums ${ids}`);
        let album_id;
        do {
            album_id = await rl.questionSync('Which album do you want to download:\n');
        } while (!album_ids.find((id) => { return id == album_id}))
        uploadSounds(album_id);
    } else {
        console.log('You don\'t have any albums not finish download');
    }
}

async function dealWithSounds(sounds, album_id) {
    // 删除没有权限的音频
    sounds = sounds.filter((sound) => {
        return sound.privilege.st >= 0;
    });
    album = {
        id: album_id,
        type: 'album',
        download: false,
        upload: false
    }
    sounds = sounds.map((sound) => {
        return {
            id: sound.id,
            name: sound.name,
            picUrl: sound.album.picUrl,
            album_id: album_id,
            type: 'sound',
            pic_download: false,
            sound_download: false,
            upload: false,
        }
    });
    await db.insertSync(album);
    await db.insertSync(sounds);
    getSounds(sounds, album_id);
}

function checkUrl(url) {
    switch (url) {
        case 'exit':
        case 'download':
        case 'upload':
            return url;
    }

    url = url.replace('#/', '');
    if (/^https?:\/\/music.163.com\/playlist\?id=\d+/.test(url)) {
        return url;
    } else {
        console.log('You don\'t enter a right url');
        return false;
    }
}

exec().catch(console.log);