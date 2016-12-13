const readline = require('readline');
const jsdom = require('jsdom');
const fs = require('fs');
const co = require('co');

const { upload } = require('./config/config');
const getSounds = require('./model/getSounds');
const uploadSounds = require('./model/uploadSounds');

const jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.min.js", "utf-8");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

if (upload.only) {
  if (fs.existsSync(upload.album_dir)) {
    global.album_dir = upload.album_dir;
    co(uploadSounds);
  } else {
    console.log('folder doesn\'t exist, please check');
  }
} else {
  // 设置标准输入，标准输出
  console.log('You can download playlist from music.163.com.');
  console.log('Enter the url to download or exit to exit the program.');
  rl.question('please input url:', checkUrl);
}


function checkUrl(url) {
  // 读取到exit退出程序
  if (url === 'exit') {
    rl.close();
    process.exit();
  }

  url = url.replace('#/', '');
  if (/^https?:\/\/music.163.com\/playlist\?id=\d+/.test(url)) {
    getSoundsDetail(url);
    rl.close();
  } else {
    console.log('url is illegal');
    rl.question('please input url again:', checkUrl);
  }
}

function getSoundsDetail(url) {
  jsdom.env({
    url: url, //"http://music.163.com/playlist?id=82448843",
    src: [jquery],
    done: function(err, window) {
      if (!err) {
        let $ = window.$;
        let album_name = $("#content-operation").data('rid');
        if (album_name) {
          let sounds = JSON.parse($($("textarea")[0]).text());
          sounds = sounds.filter((sound) => {
            return sound.privilege.st >= 0;
          });
          getSounds(sounds, album_name);
        } else {
          console.log('This playlist is not exist');
        }
      } else {
        console.log('net works bad, try again later');
      }
    }
  });
}