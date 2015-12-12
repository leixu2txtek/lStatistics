/* global httpServer */
var _config = require('./_config.js'),
	http = require('http'),
	app = require('./src/server.js');

//创建 http 服务，并将 socket.io 监听到该 http 服务
httpServer = http.createServer(app);

//加载socket.io
require('./src/io.js');

//start the server
httpServer.listen(_config.http_server_port || 2345, function () {
	console.log('**************Server Started**************');
});