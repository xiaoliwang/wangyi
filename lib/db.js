const promiseify = require('./promiseify');
const Datastore = require('nedb'),
    db = new Datastore({
        filename: 'data/datafile',
        autoload: true
    });

db.insertSync = promiseify(db.insert);
db.findSync = promiseify(db.find);
db.findOneSync = promiseify(db.findOne);
db.updateSync = promiseify(db.update);
db.removeSync = promiseify(db.remove);

module.exports = db;