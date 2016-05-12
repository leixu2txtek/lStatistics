var _config = require('../_config.js'),
    moment = require('moment'),
    io = require('socket.io')(),
    url = require('url'),
    mysql = require('mysql');

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
            time = moment(),
            connection = mysql.createConnection(_config.mysql_url);

        connection.query('insert into pv_view set ?', {
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
            month: time.month(),
            day: time.date(),
            time: time.format('HH:mm:ss'),
            date_in: date_in,
            socket_id: socket.id,
            active: 1
        }, function (err, rows) {

            if (err) throw err;

            connection.query(mysql.format("select * from pv_visitor where uid = ? ", uid), function (err, data) {
                if (err) throw err;

                data = data[0];

                //update visitor last_visit_time & active
                connection.query(mysql.format('update pv_visitor set last_visit_time = ?, active = 1 where uid = ?', [date_in, uid]), function (err, result) {
                    if (err) throw err;

                    var date = moment().format('YYYY-MM-DD');
                    connection.query(mysql.format('select * from pv_day where date = ?', date), function (err, day) {
                        if (err) throw err;

                        //if today info is null then add today info
                        var online = ((data == null || data.active == 1) ? 0 : 1);
                        if (day.length == 0) {

                            connection.query('insert into pv_day set ?', { online: 0, today: 0, total: 0, date: date }, function (err, rows) {

                                connection.query(mysql.format('update pv_day set online = online + ?, today = today + 1, total = total + 1 where date = ?', [online, date]), function (err, data) {
                                    if (err) throw err;

                                    connection.destroy();
                                });

                            });

                        } else {

                            //update today info
                            connection.query(mysql.format('update pv_day set online = online + ?, today = today + 1, total = total + 1 where date = ?', [online, date]), function (err, data) {
                                if (err) throw err;

                                connection.destroy();
                            });

                        }
                    });


                });
            });
        });
    });

    //disconnect
    socket.on('disconnect', function (a) {
    });
});

//update today pv info while user disconnect
var update_on_disconnect = function (db, socketId, s_uid, s_host) {
};