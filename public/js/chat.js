var socket = io.connect(); // init socket connection
var name; // user name for current session

// initialize classroom (old messages)
socket.on('init', function (data) {
	for (var i = 0; i < data.msglist.length; i++)
		addMessage(data.msglist[i]);
});

// receive new message
socket.on('chat', function (data) {
	addMessage(data.msg);
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
function addMessage(msg) {
	var messageDisplay = document.getElementById('message-display');
	var node = document.createElement("li");
	node.innerText = msg;
	messageDisplay.appendChild(node);
}

// init popup window
$('#select-modal').modal();
