var express = require('express'),
    config = require('../_config.js'),
    url = require('url'),
    cookie = require('cookie-parser'),
    moment = require('moment'),
    app = express(),
    client = require('./sql_connection.js').init();

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

    //validate referrer if we need to record
    if (config.hosts.indexOf(host) == -1) {

        res.send(util.format("typeof callback != 'undefined' && callback(%s)", JSON.stringify({ code: 500, msg: 'Referrer Not Correct' })));
        return;
    }

    var user = {},
        uid = '';

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
        }

        user.cookie = uid;
    }

    //store the visitor info , if exists then update last_visit_time
    client.connection(function (err, connection) {

        var data = {
            uid: uid,
            host: host,
            date_created: moment().format("YYYY-MM-DD HH:mm:ss"),
            user_agent: req.get('user-agent'),
            last_visit_time: moment().format("YYYY-MM-DD HH:mm:ss"),
            active: 1
        };

        connection.query(client.format('INSERT INTO pv_visitor set ? ON DUPLICATE KEY UPDATE last_visit_time = VALUES (last_visit_time) , active = 1'), data, function (err, result) {
            connection.release();

            if (!!err) {
                console.error('[sql_insert_error] ' + err.stack);
                return;
            }

        });
    });

    //send js file        
    send_boot(res, user);
});

//send today info about pv
app.get('/', function (req, res) {

    //get today info about pv    
    client.query('select (select count(1) from pv_visitor where active = 1) as online , today , total from pv_day where date = ?', moment().format('YYYY-MM-DD 00:00:00'), function (err, rows) {

        var data = { online: 0, total: 0, today: 0 };

        if (!rows || rows.length == 0) {

            client.query('select total from pv_day where date = ?', moment().add(-1, 'd').format('YYYY-MM-DD'), function (err, rows) {

                if (rows && rows.length == 1) {
                    data.total = rows[0].total;
                }

                client.insert('pv_day', { today: 0, total: data.total, date: moment().format('YYYY-MM-DD') });

                res.jsonp({
                    online: data.online,
                    today: data.today,
                    total: data.total
                });

            });

        } else {

            if (rows && rows.length > 0) {
                data.online = rows[0].online;
                data.total = rows[0].total;
                data.today = rows[0].today;
            }

            res.jsonp({
                online: data.online,
                today: data.today,
                total: data.total
            });
        }
    });
});

//get all online user info
app.get('/users', function (req, res) {
    client.query('select uid from pv_visitor where active = 1', {}, function (err, online) {

        var data = [];

        online.forEach(function (e) {
            data.push(e.uid);
        }, this);

        res.send(JSON.stringify(data));
    });
});

//generate the boot.js
var send_boot = function (res, user) {
    var js = "var socket=io('{{url}}'),send=function(){socket.emit('message',{url:document.location.href,referrer:document.referrer,title:document.title,userId:'{{userName}}',userType:'{{userType}}',schoolCode:'{{schoolCode}}',campuszoneId:'{{campuszoneId}}',classId:'{{classId}}',cookie:'{{cookie}}',})};socket.on('connect',function(){send();window.onhashchange=send});";

    js = js.replace('{{url}}', config.socket_url);
    js = js.replace('{{userName}}', user.userName);
    js = js.replace('{{userType}}', user.userType);
    js = js.replace('{{schoolCode}}', user.schoolCode);
    js = js.replace('{{campuszoneId}}', user.campuszoneId);
    js = js.replace('{{classId}}', user.classId);
    js = js.replace('{{cookie}}', user.cookie || '');

    res.set('Content-Type', 'text/javascript');
    res.send(js);
};

//gets the last visit time by more than three hours. force offline
setInterval(function () {

    client.update('update pv_visitor set active = 0 where last_visit_time < ?', moment().add(-3, 'h').format("YYYY-MM-DD HH:mm:ss"), function (err, result) {
        console.log(moment().format("YYYY-MM-DD HH:mm:ss") + '：' + result.changedRows + ' users are forced offline\r\n');
    });

}, 1000 * 60 * 10);

module.exports = app;