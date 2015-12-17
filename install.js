var Service = require('node-windows').Service,
	path = require('path');

// 创建服务对象
var svc = new Service({
	name: 'Ahceo_PageView_Server',
	description: '安徽成人高等教育在线平台页面统计服务',
	script: path.join(__dirname, 'index.js')
});

//安装后出发的事件
svc.on('install', function () {
	console.log('安徽成人高等教育在线平台页面统计服务，已经安装成功，正在启动……');
	svc.start();
	console.log('安徽成人高等教育在线平台页面统计服务，已成功启动……');
});

//install
svc.install();