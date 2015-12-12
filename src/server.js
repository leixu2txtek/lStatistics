var mongoClient = require('mongodb').MongoClient,
    express = require('express'),
    path = require('path'),
    _config = require('../_config.js'),
    uaParser = require('ua-parser'),
    urlParser = require('url'),
    cookieParser = require('cookie-parser'),
    moment = require('moment'),
    app = express();

//use cookie 
app.use(cookieParser());

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

app.use('/static', express.static(path.join(path.dirname(__dirname), 'public')));

//输出统计js
app.get('/boot.js', function (req, res) {

    var referer = req.get('Referrer');

    if (!referer) {
        res.send({ code: 401, msg: 'No Referrer' });
        return;
    }

    var host = '';
    try {
        host = urlParser.parse(referer).host;
    } catch (err) {
        res.send({ code: 500, msg: 'Referrer Not Correct' });
        return;
    }

    if (!host) {
        res.send({ code: 500, msg: 'Referrer Not Correct' });
        return;
    }

    //校验 referrer 中域名或ip 是否在我们需要记录的表中
    if (_config.hosts.indexOf(host) == -1) {
        res.send({ code: 500, msg: 'Referrer Not Correct' });
    }

    var user = {},
        uid = '';

    user.userName = uid = req.query.userName || '';
    user.userType = req.query.userType || '';
    user.schoolCode = req.query.schoolCode || '';
    user.campuszoneId = req.query.campuszoneId || '';
    user.classId = req.query.classId || '';

    if (uid) {

        //查询用户，如果没有查找到就新增一条数据
        mongoClient.connect(_config.mongodb_url, function (err, db) {
            if (err) throw err;

            var collection = db.collection('visitor');

            //查找并更新属性
            collection.findOneAndUpdate({ uid: uid, host: host },
                {
                    $set: { datecreated: new Date() },
                    $currentDate: { lastModified: true }
                }, function (err, r) {
                    if (err) throw err;

                    //没有查找到，则更新一个新的数据进去
                    if (!r.value) {

                        var ua = req.headers['user-agent'];

                        collection.insertOne({
                            uid: uid,
                            host: host,
                            datecreated: new Date(),
                            sockets: [],
                            user_agent: ua,
                            ua: uaParser.parseUA(ua),
                            os: uaParser.parseOS(ua),
                            device: uaParser.parseDevice(ua)
                        }, { w: 1 }, function (err, r) {

                            if (err) throw err;

                            db.close();
                            send_boot(res, user);
                        });

                    } else {

                        db.close();
                        send_boot(res, user);
                    }
                });
        });

    } else {

        uid = req.cookies.lStatistic;

        //第一次访问，而且未登录，写入一个cookie 用来标识这个用户
        if (!uid) {

            uid = (+new Date()).toString(36);
            res.cookie('lStatistic', uid, { maxAge: 31536000000, httpOnly: true });

            user.cookie = uid;
        }

        //查询用户，如果没有查找到就新增一条数据
        mongoClient.connect(_config.mongodb_url, function (err, db) {
            if (err) throw err;

            var collection = db.collection('visitor');
            collection.count({ uid: uid, host: host }, function (err, count) {

                if (err) throw err;

                if (count > 0) {

                    db.close();
                    send_boot(res, user);
                } else {

                    var ua = req.headers['user-agent'];

                    collection.insertOne({
                        uid: uid,
                        host: host,
                        datecreated: new Date(),
                        sockets: [],
                        user_agent: ua,
                        ua: uaParser.parseUA(ua),
                        os: uaParser.parseOS(ua),
                        device: uaParser.parseDevice(ua)
                    }, function (err, r) {

                        if (err) throw err;

                        db.close();
                        send_boot(res, user);
                    });

                }
            });
        });
    }
});

//统计接口
app.get('/', function (req, res) {

    mongoClient.connect(_config.mongodb_url, function (err, db) {
        if (err) throw err;

        var collection = db.collection('pageview.day'),
            dt = moment();

        //总数
        collection.aggregate({
            $match: { host: { $in: _config.hosts } }
        }, {
            $group: {
                _id: '$host',
                count: { $sum: '$total' }
            }
        }, function (err, total) {
            if (err) throw err;

            var _total = 0;

            //因为存在多域名情况，比如 www.ahcjzx.cn、ahcjzx.cn、218.22.21.232
            total.forEach(function (v) {
                _total += v.count;
            });

            //查询今天的总数
            collection.aggregate({
                $match: {
                    host: { $in: _config.hosts },
                    date: dt.format('l')
                }
            }, {
                $group: {
                    _id: '$host',
                    count: { $sum: '$total' }
                }
            }, function (err, today) {
                if (err) throw err;

                var _today = 0;

                //因为存在多域名情况，比如 www.ahcjzx.cn、ahcjzx.cn、218.22.21.232
                today.forEach(function (v) {
                    _today += v.count;
                });

                db.collection('visitor').count({
                    host: { $in: _config.hosts },
                    sockets: {
                        $not: { $size: 0 }
                    }
                }, function (err, online) {

                    if (err) throw err;

                    db.close();

                    res.jsonp({
                        online: online,
                        total: _total,
                        today: _today
                    });
                });
            });
        });
    });
});

//构造socket js
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
setInterval(function () {
    mongoClient.connect(_config.mongodb_url, function (err, db) {

        if (err) throw err;

        var _date = new Date(),
            _utc_date = new Date();

        _utc_date.setUTCFullYear(_date.getUTCFullYear());
        _utc_date.setUTCMonth(_date.getUTCMonth());
        _utc_date.setUTCDate(_date.getUTCDate());
        _utc_date.setUTCHours(_date.getUTCHours());
        _utc_date.setUTCMinutes(_date.getUTCMinutes());
        _utc_date.setUTCSeconds(_date.getUTCSeconds());

        _utc_date.setUTCHours(_utc_date.getUTCHours() - 3);   //当前时间减去3小时

        db.collection('visitor').update(
            {
                sockets: {
                    $not: { $size: 0 }
                },
                'datecreated': { $lte: _utc_date }
            },
            {
                $set: {
                    sockets: [] //将sockets 置为空数组即代表离线
                },
                $currentDate: { lastModified: true }
            }, { multi: true }, function (err, res) {

                db.close();
                console.log(moment().format('lll') + ' 共主动离线了' + res.n + '个在线用户');
            });
    });
}, 1000 * 60 * 10);

module.exports = app;