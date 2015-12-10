var Service = require('node-windows').Service,
	path = require('path');

// 创建服务对象
var svc = new Service({
	name: 'ahceo_pv',
	description: '安徽成人高等教育在线平台页面统计服务',
	script: path.join(__dirname, 'index.js')
});

//install
svc.install();