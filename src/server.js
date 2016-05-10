var express = require('express'),
    _config = require('../_config.js'),
    url = require('url'),
    cookie = require('cookie-parser'),
    moment = require('moment'),
    app = express(),
    redis = require('redis');

const util = require('util');

//use cookie 
app.use(cookie());

//use crossdomain
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', '*');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Pass to next layer of middleware
    next();
});

//send boot.js
app.get('/boot.js', function (req, res) {

    var referer = req.get('Referrer');

    if (!referer) {

        res.send(util.format("typeof callback != 'undefined' && callback(%s)", JSON.stringify({ code: 401, msg: 'No Referrer' })));
        return;
    }

    var host = '';

    try {

        host = url.parse(referer).host;

    } catch (err) {

        res.send(util.format("typeof callback != 'undefined' && callback(%s)", JSON.stringify({ code: 500, msg: 'Referrer Not Correct' })));
        return;
    }

    if (!host) {

        res.send(util.format("typeof callback != 'undefined' && callback(%s)", JSON.stringify({ code: 500, msg: 'Referrer Not Correct' })));
        return;
    }

    //校验 referrer 中域名或ip 是否在我们需要记录的表中
    if (_config.hosts.indexOf(host) == -1) {

        res.send(util.format("typeof callback != 'undefined' && callback(%s)", JSON.stringify({ code: 500, msg: 'Referrer Not Correct' })));
        return;
    }

    var user = {},
        uid = '',
        client = redis.createClient(_config.redis_url);

    user.userName = uid = req.query.userName || '';
    user.userType = req.query.userType || '';
    user.schoolCode = req.query.schoolCode || '';
    user.campuszoneId = req.query.campuszoneId || '';
    user.classId = req.query.classId || '';

    if (!uid) {
        uid = req.cookies.lStatistic;

        if (!uid) {

            uid = (+new Date()).toString(36);
            res.cookie('lStatistic', uid, { maxAge: 31536000000, httpOnly: true });

            user.cookie = uid;
        }
    }

    //store the visitor info
    client.setnx(uid, JSON.stringify({
        uid: uid,
        host: host,
        date_created: moment().format("YYYY-MM-DD HH:mm:ss"),
        user_agent: req.get('user-agent')
    }));

    //add user to today online
    client.hmset(util.format("%s:online", moment().format("YYYYMMDD")), uid, moment().format("YYYY-MM-DD HH:mm:ss"));
    client.quit();

    //send js file        
    send_boot(res, user);
});

//send today info about pv
app.get('/', function (req, res) {

    var client = redis.createClient(_config.redis_url);

    //get today info about pv
    client.get(moment().format("YYYY-MM-DD"), function (err, reply) {
        if (err) throw err;

        reply = JSON.parse(reply);
        reply == null && (reply = { online: 0, total: 0, today: 0 });

        res.jsonp({
            online: reply.online,
            total: reply.total,
            today: reply.today
        });

    });

    client.quit();
});

//get all online user info
app.get('/users', function (req, res) {

    mongoClient.connect(_config.mongodb_url, function (err, db) {
        if (err) throw err;

        var collection = db.collection('visitor');

        collection.find({
            host: { $in: _config.hosts },
            sockets: {
                $not: { $size: 0 }
            }
        }).toArray(function (err, online) {
            var data = [];

            online.forEach(function (e) {
                data.push(e.uid);
            }, this);

            res.send(JSON.stringify(data));
        });
    });

});

//generate the boot.js
var send_boot = function (res, user) {
    var js = "var socket=io('{{url}}'),send=function(){socket.emit('message',{url:document.location.href,referrer:document.referrer,title:document.title,userId:'{{userName}}',userType:'{{userType}}',schoolCode:'{{schoolCode}}',campuszoneId:'{{campuszoneId}}',classId:'{{classId}}',cookie:'{{cookie}}',})};socket.on('connect',function(){send();window.onhashchange=send});";

    js = js.replace('{{url}}', _config.socket_url);
    js = js.replace('{{userName}}', user.userName);
    js = js.replace('{{userType}}', user.userType);
    js = js.replace('{{schoolCode}}', user.schoolCode);
    js = js.replace('{{campuszoneId}}', user.campuszoneId);
    js = js.replace('{{classId}}', user.classId);
    js = js.replace('{{cookie}}', user.cookie || '');

    res.set('Content-Type', 'text/javascript');
    res.send(js);
};

//定时取出创建时间小于当前时间3小时的用户，将其置于离线状态
// setInterval(function () {
//     mongoClient.connect(_config.mongodb_url, function (err, db) {

//         if (err) throw err;

//         var _date = new Date(),
//             _utc_date = new Date();

//         _utc_date.setUTCFullYear(_date.getUTCFullYear());
//         _utc_date.setUTCMonth(_date.getUTCMonth());
//         _utc_date.setUTCDate(_date.getUTCDate());
//         _utc_date.setUTCHours(_date.getUTCHours());
//         _utc_date.setUTCMinutes(_date.getUTCMinutes());
//         _utc_date.setUTCSeconds(_date.getUTCSeconds());

//         _utc_date.setUTCHours(_utc_date.getUTCHours() - 3);   //当前时间减去3小时

//         db.collection('visitor').update(
//             {
//                 sockets: {
//                     $not: { $size: 0 }
//                 },
//                 'datecreated': { $lte: _utc_date }
//             },
//             {
//                 $set: {
//                     sockets: [] //将sockets 置为空数组即代表离线
//                 },
//                 $currentDate: { lastModified: true }
//             }, { multi: true }, function (err, res) {

//                 db.close();
//                 console.log(moment().format("YYYY-MM-DD HH:mm:ss") + ' 共主动离线了' + res.result.nModified + '个在线用户');
//             });
//     });
// }, 1000 * 60 * 10);

module.exports = app;