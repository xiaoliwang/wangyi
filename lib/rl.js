const readline = require('readline');
const promiseify = require('./promiseify');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.questionSync = function(question) {
    return new Promise((resolve, reject) => {
        rl.question(question, (input) => {
            resolve(input);
        });
    });
}

module.exports = rl;