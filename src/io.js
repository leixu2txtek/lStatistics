var config = require('../_config.js'),
    moment = require('moment'),
    io = require('socket.io')(),
    url = require('url'),
    client = require('./sql_connection.js').init();

const util = require('util');

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
        var _url = {};

        try {

            _url = url.parse(message.url);

        } catch (err) { return; }

        var host = _url.host,
            uid = message.userId,
            ip = socket.handshake.address.replace('::ffff:', ''),
            date_in = moment().format("YYYY-MM-DD HH:mm:ss"),
            uid = uid || message.cookie,
            time = moment();

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
            date_in: date_in,
            socket_id: socket.id,
            active: 1
        });
    });

    //disconnect
    socket.on('disconnect', function () {

        var dt = moment(),
            params = [dt._d, dt.diff(socket.date_in) / 1000, socket.id];

        //update pageview duration
        client.update('update pv_view set date_out = ?, duration = ?, active = 0 where socket_id = ?', params, function () {

            //update visitor's active status
            client.update('update pv_visitor set active = (select case when count(1) > 0 then 1 else 0 end from pv_view where uid = ? and active = 1) where uid = ?', [socket.uid, socket.uid]);

        });
    });
});