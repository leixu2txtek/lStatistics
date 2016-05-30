var config = require('./config.js'),
	http = require('http'),
	app = require('./src/server.js'),
	moment = require('moment');

httpServer = http.createServer(app);

//load socket.io
require('./src/io.js');

//start the server
httpServer.listen(config.http_server_port || 2345, function () {
	console.log(moment().format("YYYY-MM-DD HH:mm:ss") + '**************Server Started**************\r\n');
});