var config = {
    download: {
        // download concurrency
        pic_con: 2,
        sound_con: 5,
        only: false // true or false
    },
    upload: {
        domain: 'https://www.missevan.com/',
        album_dir: './temp/网易云音乐喜欢的音乐',
        only: true // true or false
    }
}

module.exports = config;