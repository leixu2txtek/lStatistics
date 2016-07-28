var mongo = require('mongodb').MongoClient,
    config = require('../config.js');

var client = {
    db: null,   //db instance
    connect: function (callback) {
        var _this = this;

        if (_this.db) {
            callback && callback.apply(null, [_this.db]);
            return;
        }

        mongo.connect(config.mongo_config, {
            server: {
                auto_reconnect: true,
                poolSize: 500,
                socketOptions: {
                    connectTimeoutMS: 3600000,
                    keepAlive: 3600000,
                    socketTimeoutMS: 3600000
                }
            }
        }, function (err, db) {

            if (!!err) {
                console.error('Exception while connect to mongo: ' + err.stack);
                return;
            }

            db.on('error', function (err) {
                console.log('DB connection Error: ' + err);
            });

            db.on('open', function () {
                console.log('DB connected');
            });

            db.on('close', function (str) {
                console.log('DB disconnected: ' + str);
            });

            _this.db = db;

            callback && callback.apply(null, [db]);
        });
    },
    find: function (collection, query, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).find(query).limit(1).toArray(function (err, result) {

                if (!!err) {
                    console.error('Mongo find error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [result]);
            });
        });
    },
    query: function (collection, query, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).find(query).toArray(function (err, result) {

                if (!!err) {
                    console.error('Mongo find error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [result]);
            });
        });
    },
    insert: function (collection, data, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).insertOne(data, function (err, result) {

                if (!!err) {
                    console.error('Mongo insert error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [result]);
            });
        });
    },
    update: function (collection, query, data, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).updateOne(query, data, { upsert: true, w: 1 }, function (err, result) {

                if (!!err) {
                    console.error('Mongo update error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [result]);
            });
        });
    },
    update_many: function (collection, query, data, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).updateMany(query, data, { w: 1 }, function (err, result) {

                if (!!err) {
                    console.error('Mongo update error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [result]);
            });
        });
    },
    count: function (collection, query, callback) {

        var _this = this;
        _this.connect(function (db) {

            db.collection(collection).count(query, function (err, count) {

                if (!!err) {
                    console.error('Mongo count error: %s', err.stack);
                    return;
                }

                callback && callback.apply(null, [count]);
            });
        });
    }
};

module.exports = client;