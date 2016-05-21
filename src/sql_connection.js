var mysql = require('mysql'),
    config = require('../_config.js'),
    pool = null;

var sql = {

    //init the mysql connection pool
    init: function () {

        if (pool == null) {
            pool = mysql.createPool(config.mysql_url);
        }
    },

    //execute query sql statement
    query: function (sql, args, callback) {

        pool.getConnection(function (err, connection) {

            if (err) {
                console.error('[sql_query_error] ' + err.stack);
                return;
            }

            connection.query(mysql.format(sql, args), function (err, result) {
                connection.release();

                if (err) {
                    console.error('[sql_query_error] ' + err.stack);
                    return;
                }

                callback && callback.apply(null, [err, result]);
            });
        });
    },

    //execute update sql statement
    update: function (sql, args, callback) {

        pool.getConnection(function (err, connection) {

            if (err) {
                console.error('[sql_update_error] ' + err.stack);
                return;
            }

            connection.query(mysql.format(sql, args), function (err, result) {
                connection.release();

                if (err) {
                    console.error('[sql_update_error] ' + err.stack);
                    return;
                }

                callback && callback.apply(null, [err, result]);
            });
        });
    },

    //execute delete sql statement
    remove: function (sql, args, callback) {

        pool.getConnection(function (err, connection) {

            if (err) {
                console.error('[sql_update_error] ' + err.stack);
                return;
            }

            connection.query(mysql.format(sql, args), function (err, result) {
                connection.release();

                if (err) {
                    console.error('[sql_update_error] ' + err.stack);
                    return;
                }

                callback && callback.apply(null, [err, result]);
            });
        });

    },

    //execute insert sql statement
    insert: function (table, data, callback) {

        pool.getConnection(function (err, connection) {

            if (err) {
                console.error('[sql_insert_error] ' + err.stack);
                return;
            }

            connection.query(mysql.format('REPLACE INTO ?? set ?', table), data, function (err, result) {
                connection.release();

                if (err) {
                    console.error('[sql_insert_error] ' + err.stack);
                    return;
                }

                callback && callback.apply(null, [err, result]);
            });
        });

    },

    //get connection
    connection: function (callback) {

        pool.getConnection(function (err, connection) {

            if (err) {
                console.error('[sql_get_connection_error] ' + err.stack);
                return;
            }

            callback && callback.apply(null, [err, connection]);
        });
    },

    //close all connections    
    end: function () {

        pool.end();
    }
};

//public client class
var client = {
    init: function () {

        if (!!pool) return client;

        sql.init();
        
        client.format = mysql.format;
        
        client.query = sql.query;
        client.update = sql.update;
        client.remove = sql.remove;
        client.insert = sql.insert;
        client.connection = sql.connection;

        return client;
    },
    end: function () {

        sql.end();
    }
};

module.exports = client;