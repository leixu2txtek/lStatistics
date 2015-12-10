/* global io */
var socket = io('{{url}}'),
	send = function () {

		socket.emit('message', {
			url: document.location.href,
			referrer: document.referrer,
			title: document.title,
			userId: '{{userName}}',
			userType: '{{userType}}',
			schoolCode: '{{schoolCode}}',
			campuszoneId: '{{campuszoneId}}',
			classId: '{{classId}}',
			cookie: '{{cookie}}',
		});
	};

socket.on('connect', function () {
	send();
	window.onhashchange = send;
});