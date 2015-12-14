/* global httpServer */
var mongoClient = require('mongodb').MongoClient,
    _config = require('../_config.js'),
    moment = require('moment'),
    io = require('socket.io')(),
    urlParser = require('url');

//将 socket.io 监听到该 http 服务
io.listen(httpServer);

//配置
io.use(function (socket, next) {
    var handshakeData = socket.request;

    if (handshakeData.headers.cookie) {
        next();
    } else {
        next(new Error('No cookie transmitted.'));
    }
});

//connection
io.of('/pv').on('connection', function (socket) {

    //got a message of pv
    socket.on('message', function (message) {
        var url = {};

        try {
            url = urlParser.parse(message.url);
        } catch (err) {
            console.log(err);
            return;
        }

        var host = url.host,
            uid = message.userId,
            ip = socket.handshake.address.replace('::ffff:', ''),
            socketId = socket.id,
            date_in = new Date();

        socket.s_uid = uid ? uid : message.cookie;
        socket.s_host = host;
        socket.s_date_in = date_in;

        io.of('/stat').emit('pageview', {
            'connections': io.of('/pv').sockets.length,
            'ip': ip,
            'id': socketId,
            'url': message.url,
            'xdomain': socket.handshake.xdomain,
            'timestamp': new Date()
        });

        //写入数据库
        mongoClient.connect(_config.mongodb_url, function (err, db) {
            if (err) throw err;

            var time = moment();

            db.collection('pageview').insertOne({
                uid: uid,
                userType: message.userType,
                schoolCode: message.schoolCode,
                campuszoneId: message.campuszoneId,
                classId: message.classId,
                host: host,
                url: url.pathname || '',
                search: url.search || '',
                hash: url.hash || '',
                ip: ip,
                referrer: message.referrer,
                title: message.title,
                year: time.year(),
                month: time.month(),
                day: time.date(),
                time: time.format('HH:mm:ss'),
                socketId: socketId,
                date_in: date_in,
                active: 1
            }, function (err, r) {
                if (err) throw err;

                //update user onconnect
                update_on_connect(db, socketId, socket.s_uid, socket.s_host);
            });
        });
    });

    //disconnect
    socket.on('disconnect', function () {
        var socketId = socket.id;

        io.of('/stat').emit('pageview', {
            'connections': Math.max(io.of('/pv').sockets.length - 1, 0),
            'id': socketId
        });

        mongoClient.connect(_config.mongodb_url, function (err, db) {
            if (err) throw err;

            var dt = moment();

            db.collection('pageview').updateMany({
                socketId: socketId
            }, {
                $set: {
                    date_out: dt._d,
                    active: 0,
                    duration: dt.diff(socket.s_date_in) / 1000
                },
                $currentDate: { lastModified: true }
            }, function (err, r) {
                if (err) throw err;

                //update user disconnect
                update_on_disconnect(db, socketId, socket.s_uid, socket.s_host);
            });
        });
    });
});

//用户上线后更新用户访问页
var update_on_connect = function (db, socketId, s_uid, s_host) {

    //写入用户当前访问的页面的 socketId
    db.collection('visitor').findOneAndUpdate({
        uid: s_uid,
        host: s_host
    }, {
        $addToSet: {
            sockets: socketId
        },
        $currentDate: { lastModified: true }
    }, function (err, r) {
        if (err) throw err;

        //更新今天的统计数
        db.collection('pageview.day').update({
            host: s_host,
            date: moment().format('l')
        }, {
            $inc: { total: +1 } //在原来的数上 +1 
        }, {
            upsert: true
        }, function (err, r) {
            if (err) throw err;

            db.close();
        });
    });
};

//用户下线后更新用户访问页
var update_on_disconnect = function (db, socketId, s_uid, s_host) {

    db.collection('visitor').findOneAndUpdate({
        uid: s_uid,
        host: s_host
    }, {
        $pull: {
            sockets: socketId
        },
        $currentDate: { lastModified: true }
    }, function (err, r) {
        if (err) throw err;

        db.close();
    });
};