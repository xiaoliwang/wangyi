var request = require('request');
var fs = require('fs');
const readline = require('readline');
var jsdom = require('jsdom');
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.min.js", "utf-8");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// http://music.163.com/#/playlist?id=82448843
rl.question('please input url: ', (url) => {
  // TODO: Log the answer in a database
  url = url.replace('#/', '');
  jsdom.env({
    url: url, //"http://music.163.com/playlist?id=82448843",
    src: [jquery],
    done: function(err, window) {
      var $ = window.$;
      var datas = JSON.parse($($("textarea")[0]).text());
      for (let data of datas) {
        let name = data.name.replace(' ', '_');
        let url = data.album.picUrl;
        getPic(request, url, name);
      }
    }
  });
});

function getPic(request, url, name){
	request.get(url)
	.on('error', function(err){
		getPic(request, url, name);
	})
	.pipe(fs.createWriteStream('./temp/' + name + ".jpg"));
}