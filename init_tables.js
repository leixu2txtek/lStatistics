var client = require('./src/sql_connection.js').init();

client.query('CREATE TABLE statistic.pv_day ( Id INT NOT NULL AUTO_INCREMENT, date DATE, online INT, today BIGINT, total BIGINT, CONSTRAINT PK_pv_day PRIMARY KEY (Id) ) ENGINE=InnoDB DEFAULT CHARSET=utf8 ', {}, function (err, result) {

    if (!!err) {
        console.error('[init_table_pv_day_error] ' + err.stack);
        return;
    }
    console.log('init table pv_day ok');
});

client.query('CREATE TABLE statistic.pv_view (id INT NOT NULL AUTO_INCREMENT, uid VARCHAR(50), user_type VARCHAR(2), school_code VARCHAR(20), campus_zone_id VARCHAR(50), class_id VARCHAR(50), host VARCHAR(50), url VARCHAR(1000), search VARCHAR(1000), hash VARCHAR(1000), ip VARCHAR(20), referrer VARCHAR(1000), title VARCHAR(200), year INT, month INT, day INT, time VARCHAR(10), date_in DATETIME, date_out DATETIME, duration BIGINT, socket_id VARCHAR(20), active INT, CONSTRAINT PK_pv_view PRIMARY KEY (id) ) ENGINE=InnoDB DEFAULT CHARSET=utf8 ', {}, function (err, result) {

    if (!!err) {
        console.error('[init_table_pv_view_error] ' + err.stack);
        return;
    }
    console.log('init table pv_view ok');
});

client.query('CREATE TABLE statistic.pv_visitor ( id INT NOT NULL AUTO_INCREMENT, uid VARCHAR(50), host VARCHAR(50), date_created DATETIME, user_agent VARCHAR(200), last_visit_time DATETIME, active INT, CONSTRAINT PK_pv_visitor PRIMARY KEY (id) ) ENGINE=InnoDB DEFAULT CHARSET=utf8', {}, function (err, result) {

    if (!!err) {
        console.error('[init_table_pv_visitor_error] ' + err.stack);
        return;
    }
    console.log('init table pv_visitor ok');
});