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
		socket.emit('init', {
			msglist: classrooms[data.classroom].messages,
			questionList: classrooms[data.classroom].questions,
			teaching: user.teaching
		});
	});

	// Send/receive message
	socket.on('chat', function (data) {
		var classroom = classrooms[socket.classroom];
		classroom.messages.push(data.msg);

		var question;
		if (data.msg.includes('@teacher')) {
			question = createQuestion(data.msg.replace('@teacher', ''), -1);
			classroom.questions.push(question);
		}

		classroom.teacher.socket.emit('chat', { msg: data.msg });
		if (question) classroom.teacher.socket.emit('question', { question: question });

		for (var i = 0; i < classroom.students.length; i++) {
			classroom.students[i].socket.emit('chat', { msg: data.msg });
			if (question) classroom.students[i].socket.emit('question', { question: question});
		}
	});
});

function createClassroom(name, teacherName, teacherSocket) {
	return {
		name: name,
		teacher: createUser(teacherName, teacherSocket, true),
		messages: [],
		students: [],
		questions: []
	};
}

function createUser(name, socket, teaching) {
	return {
		name: name,
		socket: socket,
		teaching: teaching
	};
}

function createQuestion(question, resolvedTime) {
	return {
		question: question,
		resolvedTime: resolvedTime // in seconds
	};
}