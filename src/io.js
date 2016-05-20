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
            month: time.month(),
            day: time.date(),
            time: time.format('HH:mm:ss'),
            date_in: date_in,
            socket_id: socket.id,
            active: 1
        }, function (err, rows) {

            client.query('select * from pv_visitor where uid = ? ', uid, function (err, data) {

                data = data[0];

                //update visitor last_visit_time & active
                client.update('update pv_visitor set last_visit_time = ?, active = 1 where uid = ?', [date_in, uid], function (err, result) {

                    var date = moment().format('YYYY-MM-DD');
                    client.query('select * from pv_day where date = ?', date, function (err, day) {

                        //if today info is null then add today info
                        var online = ((data == null || data.active == 1) ? 0 : 1);
                        if (day.length == 0) {

                            client.query('select total from pv_day where date = ?', moment().add(-1, 'd').format('YYYY-MM-DD'), function (err, rows) {

                                var total = 0;

                                if (rows && rows.length == 1) {
                                    total = rows[0].total;
                                }

                                client.insert('pv_day', { online: 0, today: 0, total: total, date: date }, function (err, rows) {

                                    client.update('update pv_day set online = online + ?, today = today + 1, total = total + 1 where date = ?', [online, date]);
                                });
                            });

                        } else {

                            //update today info
                            client.update('update pv_day set online = online + ?, today = today + 1, total = total + 1 where date = ?', [online, date]);
                        }
                    });
                });
            });
        });
    });

    //disconnect
    socket.on('disconnect', function () {

        var dt = moment(),
            params = [dt._d, dt.diff(socket.date_in) / 1000, socket.id];

        //update pageview duration
        client.update('update pv_view set date_out = ?, duration = ?, active = 0 where socket_id = ?', params);

        //update visitor's active status
        client.update('update pv_visitor set active = (select case when count(1) > 0 then 1 else 0 end from pv_view where uid = ? and active = 1) where uid = ?', [socket.uid, socket.uid]);

        //update online count
        client.update('update pv_day set online = (select count(1) from pv_visitor where active = 1) where date = ?', moment().format('YYYY-MM-DD'));
    });
});