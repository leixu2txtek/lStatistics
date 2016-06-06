var config = require('../config.js'),
    moment = require('moment'),
    io = require('socket.io')(),
    url = require('url'),
    client = require('./connection.js');

const util = require('util');

//将 socket.io 监听到该 http 服务
io.listen(httpServer);

//配置
io.use(function (socket, next) {
    var request = socket.request;

    if (request.headers.cookie) {
        next();
    } else {
        next(new Error('No cookie transmitted.'));
    }
});

//connection
io.of('/pv').on('connection', function (socket) {

    //got a message of pv
    socket.on('message', function (message) {
        var _url = {};

        try {

            _url = url.parse(message.url);

        } catch (err) { return; }

        var host = _url.host,
            uid = message.userId,
            ip = socket.handshake.headers['X-Real-IP'] || socket.handshake.address.replace('::ffff:', ''),
            uid = uid || message.cookie,
            time = moment();

        if (!uid) return;

        io.of('/stat').emit('pv', {
            connections: io.of('/pv').sockets.length,
            ip: ip,
            id: socket.id,
            url: message.url,
            time: time.format('YYYY-MM-DD HH:mm:ss')
        });

        socket.date_in = new Date();
        socket.uid = uid;

        client.insert('pv_view', {
            uid: uid,
            user_type: message.userType,
            school_code: message.schoolCode,
            campus_zone_id: message.campuszoneId,
            class_id: message.classId,
            host: host,
            url: _url.pathname || '',
            search: _url.search || '',
            hash: _url.hash || '',
            ip: ip,
            referrer: message.referrer,
            title: message.title,
            year: time.year(),
            month: time.month() + 1,
            day: time.date(),
            time: time.format('HH:mm:ss'),
            date_in: socket.date_in,
            socket_id: socket.id,
            active: 1
        }, function () {

            //update while socket is connected
            update_on_connected(socket);
        });
    });

    //disconnect
    socket.on('disconnect', function () {

        io.of('/stat').emit('pv', {
            connections: Math.max(io.of('/pv').sockets.length - 1, 0),
            id: socket.id
        });

        var dt = moment();

        //update duration
        client.update('pv_view', { socket_id: socket.id }, {
            $set: {
                date_out: dt._d,
                active: 0,
                duration: dt.diff(socket.date_in) / 1000
            }
        }, function (result) {

            //update while socket is disconnected
            update_on_disconnected(socket);
        });
    });
});

//update while socket is connected
var update_on_connected = function (socket) {

    //update user page_view socketid
    client.update('pv_visitor', { uid: socket.uid }, { $addToSet: { sockets: socket.id } }, function (result) {

        client.count('pv_visitor', { sockets: { $not: { $size: 0 } } }, function (online) {

            client.update('pv_day', { date: moment().format('YYYY-MM-DD') }, { $set: { online: online }, $inc: { today: 1, total: 1 } });
        });
    });
};

//update while socket is disconnected
var update_on_disconnected = function (socket) {

    //remove user page_view socketid
    client.update('pv_visitor', { uid: socket.uid }, { $pull: { sockets: socket.id } }, function (result) {

        client.count('pv_visitor', { sockets: { $not: { $size: 0 } } }, function (online) {

            client.update('pv_day', { date: moment().format('YYYY-MM-DD') }, { $set: { online: online } });
        });
    });
};