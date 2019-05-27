var express = require('express');
var app = express();
var path = require('path');

var server = require('http').Server(app);
var io = require('socket.io')(server);

// Static file serving in public/ directory
app.use(express.static('public'));
app.use(express.static('files'));

// Home route
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/chat', function (req, res) {
	res.sendFile(path.join(__dirname + '/chat.html'));
});

app.get('/teacher', function (req, res) {
	res.sendFile(path.join(__dirname + '/indexteacher.html'));
});

// Server code
server.listen(8000);


// Socket variable
var classrooms = {};


// Socket connection
io.on('connection', function (socket) {

	// Initialize new classroom / load existing classroom
	socket.on('classroom-select', function (data) {
		var user;

		if (classrooms[data.classroom] == undefined) {
			classrooms[data.classroom] = createClassroom('classroom', data.name, socket);
			user = classrooms[data.classroom].teacher;
		}
		else {
			user = createUser(data.name, socket, false);
			classrooms[data.classroom].students.push(user);
		}

		socket.classroom = data.classroom;
		socket.emit('init', { msglist: classrooms[data.classroom].messages, teaching: user.teaching });
	});

	// Send/receive message
	socket.on('chat', function (data) {
		var classroom = classrooms[socket.classroom];
		classroom.messages.push(data.msg);
		classroom.teacher.socket.emit('chat', { msg: data.msg });

		for (var i = 0; i < classroom.students.length; i++)
			classroom.students[i].socket.emit('chat', { msg: data.msg });
	});
});

function createClassroom(name, teacherName, teacherSocket) {
	return {
		name: name,
		teacher: createUser(teacherName, teacherSocket, true),
		messages: [],
		students: []
	};
}

function createUser(name, socket, teaching) {
	return {
		name: name,
		socket: socket,
		teaching: teaching
	};
}
