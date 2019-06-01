var express = require('express');
var app = express();
var path = require('path');

var server = require('http').Server(app);
var io = require('socket.io')(server);

// Socket variable
const TIMESTAMP = Math.floor(new Date() / 1000);
var classrooms = {};

// Static file serving in public/ directory
app.use(express.static('public'));
app.use(express.static('files'));

// Home route
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// Student route
app.get('/student', function (req, res) {
	if (req.query.code == undefined || classrooms[req.query.code] == undefined)
		res.redirect('/');
	else
		res.sendFile(path.join(__dirname + '/student.html'));
});

// Teacher route
app.get('/teacher', function (req, res) {
	if (req.query.code == undefined || classrooms[req.query.code] == undefined)
		res.redirect('/');
	else
		res.sendFile(path.join(__dirname + '/teacher.html'));
});

// Create classroom route
app.get('/create', function(req, res) {
	if (req.query.code == undefined)
		res.redirect('/');

	var code = req.query.code;
	if (classrooms[code] == undefined)
		classrooms[code] = createClassroom('Classroom');

	res.end();
});

// Server code
server.listen(process.env.PORT || 8000, function() {
	console.log('Server listening on port 8000.');
});


// Socket connection
io.on('connection', function (socket) {

	// Initialize new classroom / load existing classroom
	socket.on('classroom-select', function (data) {
		var code = data.classroom;
		var name = data.name;
		var teaching = data.teaching;
		var user;

		if (classrooms[code] == undefined) {
			socket.emit('error', { message: `Classroom ${ code } does not exist.` })
			return;
		}

		if (teaching) {
			classrooms[code].teacher = createUser(name, socket, true);
			user = classrooms[code].teacher;
		}
		else {
			user = createUser(name, socket, false);
			classrooms[code].students.push(user);
		}

		socket.classroom = code;
		socket.emit('init', {
			msglist: classrooms[code].messages,
			questionList: classrooms[code].questions,
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

		if (classroom.teacher != undefined) {
			classroom.teacher.socket.emit('chat', { msg: data.msg });
			if (question) classroom.teacher.socket.emit('question', { question: question });
		}

		for (var i = 0; i < classroom.students.length; i++) {
			classroom.students[i].socket.emit('chat', { msg: data.msg });
			if (question) classroom.students[i].socket.emit('question', { question: question});
		}
	});

	socket.on('board-code', function(data) {
		socket.emit('board-code', {
			code: encode(socket.classroom)
		});
	});
});

function createClassroom(name) {
	return {
		name: name,
		teacher: undefined,
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


function encode(code) {
	return TIMESTAMP + code;
}
