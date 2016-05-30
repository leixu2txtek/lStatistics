var client = require('./src/connection.js'),
    moment = require('moment');

var time = moment();

var data = [];
for (var index = 0; index < 100000; index++) {
    
    data.push({
        uid: (+new Date()).toString(36),
        user_type: 1,
        school_code: '032',
        campus_zone_id: 'heiidhakhuenkjduhduyaee_e',
        class_id: 'oeji_eakjdahdhekjjciauje',
        host: 'www.ahcjzx.cn',
        url: '',
        search: '',
        hash: '',
        ip: '10.1.11.154',
        referrer: 'http://www.ahcjzx.cn',
        title: '首页-安徽继续教育在线',
        year: time.year(),
        month: time.month() + 1,
        day: time.date(),
        time: time.format('HH:mm:ss'),
        date_in: new Date(),
        socket_id: (+new Date()).toString(18),
        active: 1
    });
};

client.connect(function (db) {
    console.time();
    
    db.collection('pv_view').insertMany(data, function (err, data) {

        if (!!err) {
            console.error('Mongo insert error: %s', err.stack);
            return;
        }
        console.timeEnd();
    });
});