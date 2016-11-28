const readline = require('readline');
var jsdom = require('jsdom');
var fs = require('fs');

var getSounds = require('./model/getSounds');

var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.min.js", "utf-8");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// http://music.163.com/#/playlist?id=82448843
rl.question('please input url: ', (url) => {
  // TODO: Log the answer in a database
  url = "http://music.163.com/#/playlist?id=511794000";
  url = url.replace('#/', '');
  jsdom.env({
    url: url, //"http://music.163.com/playlist?id=82448843",
    src: [jquery],
    done: function(err, window) {
      var $ = window.$;
      var album_name = $("h2.f-ff2").text();
      var sounds = JSON.parse($($("textarea")[0]).text());
      getSounds(sounds, album_name);
    }
  });
  
  rl.close();
  
});