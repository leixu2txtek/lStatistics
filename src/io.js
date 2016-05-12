var _config = require('../_config.js'),
    moment = require('moment'),
    io = require('socket.io')(),
    url = require('url');

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
        // var _url = {};

        // try {

        //     _url = url.parse(message.url);

        // } catch (err) { return; }

        // var host = _url.host,
        //     uid = message.userId,
        //     ip = socket.handshake.address.replace('::ffff:', ''),
        //     date_in = moment().format("YYYY-MM-DD HH:mm:ss"),
        //     uid = uid || message.cookie,
        //     time = moment();

        // var client = redis.createClient(_config.redis_url);

        // client.sadd(util.format("%s:%s:pv", moment().format("YYYY-MM-DD"), uid), JSON.stringify({
        //     uid: uid,
        //     userType: message.userType,
        //     schoolCode: message.schoolCode,
        //     campuszoneId: message.campuszoneId,
        //     classId: message.classId,
        //     host: host,
        //     url: _url.pathname || '',
        //     search: _url.search || '',
        //     hash: _url.hash || '',
        //     ip: ip,
        //     referrer: message.referrer,
        //     title: message.title,
        //     year: time.year(),
        //     month: time.month(),
        //     day: time.date(),
        //     time: time.format('HH:mm:ss'),
        //     date_in: date_in,
        //     socketId: socket.id
        // }));

        // client.get(moment().format("YYYY-MM-DD"), function (err, reply) {
        //     if (err) throw err;

        //     reply = JSON.parse(reply);
        //     reply == null && (reply = { online: 0, total: 0, today: 0 });

        //     reply.today = reply.today + 1;
        //     reply.total = reply.total + 1;

        //     //update today & total pv
        //     client.set(moment().format("YYYY-MM-DD"), JSON.stringify(reply));
        // });
    });

    //disconnect
    socket.on('disconnect', function (a) {
        debugger;
    });
});

//update today pv info while user disconnect
var update_on_disconnect = function (db, socketId, s_uid, s_host) {
};