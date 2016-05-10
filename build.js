var fs = require('fs.extra'),
	path = require('path');

//设置build 的目录
var path_build = path.join(__dirname, 'lStatisitc');

//创建文件夹
fs.rmrfSync(path_build);
fs.mkdirSync(path_build);

//复制相关文件
console.log('开始复制 node_modules 文件夹下文件');
fs.copyRecursive(path.join(__dirname, 'node_modules', 'cookie-parser'), path.join(path_build, 'node_modules', 'cookie-parser'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'express'), path.join(path_build, 'node_modules', 'express'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'mongodb'), path.join(path_build, 'node_modules', 'mongodb'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'moment'), path.join(path_build, 'node_modules', 'moment'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'ua-parser'), path.join(path_build, 'node_modules', 'ua-parser'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'url'), path.join(path_build, 'node_modules', 'url'), function (err) {
	if (err) throw err;
});
fs.copyRecursive(path.join(__dirname, 'node_modules', 'socket.io'), path.join(path_build, 'node_modules', 'socket.io'), function (err) {
	if (err) throw err;

	console.log('复制 node_modules 文件夹下文件成功');
});

console.log('开始复制 src 文件夹下文件');
fs.copyRecursive(path.join(__dirname, 'src'), path.join(path_build, 'src'), function (err) {
	if (err) throw err;

	console.log('复制 src 文件夹下文件成功');
});

console.log('开始复制 _config.js 文件');
fs.copy(path.join(__dirname, '_config.js'), path.join(path_build, '_config.js'), function (err) {
	if (err) throw err;

	console.log('复制 _config.js 文件成功');
});

console.log('开始复制 index.js 文件');
fs.copy(path.join(__dirname, 'index.js'), path.join(path_build, 'index.js'), function (err) {
	if (err) throw err;

	console.log('复制 index.js 文件成功');
});