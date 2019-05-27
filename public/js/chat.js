var socket = io.connect(); // init socket connection
var name; // user name for current session

// initialize classroom (old messages)
socket.on('init', function (data) {
	var messageDisplay = document.getElementById('message-display');
	var questionDisplay = document.getElementById('question-display');
	for (var i = 0; i < data.msglist.length; i++) {
		addMessage(messageDisplay, data.msglist[i]);
		addMessage(questionDisplay, data.questionList[i].question);
	}
});

// receive new message
socket.on('chat', function (data) {
	var messageDisplay = document.getElementById('message-display');
	addMessage(messageDisplay, data.msg);
});

// receive new message
socket.on('question', function (data) {
	var questionDisplay = document.getElementById('question-display');
	addMessage(questionDisplay, data.question.question);
});

// send new message
$('#classroom-chat').submit(function(e){
	e.preventDefault();

	var messageInput = document.getElementById('input-field');
	socket.emit('chat', { msg: name + ': ' + messageInput.value });
	messageInput.value = '';
	return false;
});

// create new classroom (from popup window)
$('#classroom-select').submit(function(e){
	e.preventDefault();

	var classroomInput = document.getElementById('classroom-select-field');
	var nameInput = document.getElementById('name-select-field');

	socket.emit('classroom-select', { classroom: classroomInput.value, name: nameInput.value });
	name = nameInput.value;

	$('#select-modal').modal('hide');
	return false;
});

// add new message
function addMessage(element, text) {
  var messageDisplay = document.getElementById('message-display');
	var node = document.createElement("div");
	node.innerText = text;
	node.setAttribute("class", "message");
	
	var hr = document.createElement("hr");

	messageDisplay.appendChild(hr);
	messageDisplay.appendChild(node);
	messageDisplay.scrollTop = messageDisplay.scrollHeight;
}

// init popup window
$('#select-modal').modal();
