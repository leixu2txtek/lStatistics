exports.io = io = require('socket.io').listen(httpServer.server);

mongoClient = require('mongodb').MongoClient;

var url_parser = require('url');

var cookie = require('cookie');


io.configure(function () {

});

io.set('authorization', function (handshakeData, accept) {
    if (handshakeData.headers.cookie) {
        accept(null, true);
    } else {
        return accept('No cookie transmitted.', false);
    }
});

io.of('/pv').on('connection', function (socket) {
    socket.on('message', function (message) {

        var url;

        try {
            url = url_parser.parse(message.url);
        }
        catch (err) {
            return;
        }

        var host = url.host;
        socket.join(host);

        var uid = message.userId;

        socket.tj_uid = uid ? uid : message.cookie;
        socket.tj_host = host;

        var ip = socket.handshake.address.address;
        var socketid = socket.id;

        io.of('/stat').emit('pageview', {
            'connections': io.of('/pv').clients().length,
            'ip': ip,
            'id': socket.id,
            'url': message.url,
            'xdomain': socket.handshake.xdomain,
            'timestamp': new Date()
        });

        mongoClient.connect(config.conn_str, function (err, db) {
            if (err) throw err;

            var collection_pageview = db.collection('pageview');

            var dt = new Date();
            var hour = dt.getHours();
            hour = (hour < 10 ? "0" : "") + hour;
            var min = dt.getMinutes();
            min = (min < 10 ? "0" : "") + min;
            var sec = dt.getSeconds();
            sec = (sec < 10 ? "0" : "") + sec;

            collection_pageview.insert({
                uid: uid,
                userType: message.userType,
                schoolCode: message.schoolCode,
                campuszoneId: message.campuszoneId,
                classId: message.classId,
                host: host,
                url: url.pathname,
                search: url.search,
                hash: url.hash,
                ip: ip,
                referrer: message.referrer,
                title: message.title,
                year: dt.getFullYear(),
                month: dt.getMonth(),
                day: dt.getDate(),
                time: hour + ':' + min + ':' + sec,
                socketid: socketid,
                date_in: dt,
                active: 1
            }, { w: 1 }, function () {
                update_visitor_onconnect(db, socketid, socket.tj_uid, host);
            });
        });
    });

    socket.on('disconnect', function () {
        var socketid = socket.id;
        var tj_uid = socket.tj_uid;
        var tj_host = socket.tj_host;

        mongoClient.connect(config.conn_str, function (err, db) {
            if (err) throw err;

            var collection_pageview = db.collection('pageview');
            collection_pageview.findOne({ socketid: socketid }, function (err, item) {
                if (item) {
                    var dt = new Date();
                    collection_pageview.update({ _id: item._id }, {
                        $set: { date_out: dt, active: 0, duration: (dt - item.date_in) / 1000 }
                    }, { w: 1 }, function () {
                        update_visitor_ondisconnect(db, socketid, tj_uid, tj_host);
                    });
                } else {
                    update_visitor_ondisconnect(db, socketid, tj_uid, tj_host);
                }
            });
        });

        io.of('/stat').emit('pageview', {
            'connections': Math.max(io.of('/pv').clients().length - 1, 0),
            'id': socketid
        });
    });
});

var update_visitor_onconnect = function (db, socketid, tj_uid, tj_host) {
    var collection_visitor = db.collection('visitor');
    collection_visitor.findOne({ uid: tj_uid, host: tj_host }, function (err, item) {

        if (item) {
            collection_visitor.update({ _id: item._id }, {
                $addToSet: { sockets: socketid }
            }, { w: 1 }, function () {
                db.close();
            });
        } else {
            db.close();
        }
    });
};

var update_visitor_ondisconnect = function (db, socketid, tj_uid, tj_host) {
    var collection_visitor = db.collection('visitor');
    collection_visitor.findOne({ uid: tj_uid, host: tj_host }, function (err, item) {
        if (item) {
            collection_visitor.update({ _id: item._id }, {
                $pull: { sockets: socketid }
            }, { w: 1 }, function () {
                db.close();
            });
        }
        else {
            db.close();
        }
    });
};