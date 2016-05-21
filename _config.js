module.exports = {
    http_server_port: 2345,
    mysql_config: {
        connectionLimit: 400,
        host: '192.168.0.231',
        user: 'root',
        password: '',
        database: 'statistic'
    },
    socket_url: '192.168.0.231:2345/pv',
    hosts: ['192.168.0.245']
};