var url = new URL(location.href);
var socket = io.connect(); // init socket connection
var name = url.searchParams.get('name'); // user name for current session
var code = url.searchParams.get('code'); // user name for current session
var aww;
var teaching = url.pathname == '/teacher';

socket.emit('classroom-select', { classroom: code, name: name });
socket.emit('board-code');

// initialize classroom (old messages)
socket.on('init', function (data) {
	var messageDisplay = document.getElementById('message-display');
	var questionDisplay = document.getElementById('question-display');

	for (var i = 0; i < data.msglist.length; i++)
		addMessage(messageDisplay, data.msglist[i]);

	for (var i = 0; i < data.questionList.length; i++)
		addMessage(questionDisplay, data.questionList[i].question);
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

// get board code
socket.on('board-code', function(data) {
	aww = new AwwBoard('#aww-wrapper', {
	    apiKey: '7b1dce0b-374d-4bff-b62f-079adcd55386',
	    boardLink: data.code,
	    // multiPage: true
	});

	// if (!teaching)
		// $('#aww-wrapper').css('pointer-events', 'none');
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
	var node = document.createElement("div");
	node.innerText = text;
	node.setAttribute("class", "message");
	
	var hr = document.createElement("hr");

	element.appendChild(hr);
	element.appendChild(node);
	element.scrollTop = element.scrollHeight;
}

$.ajax({
    'method': 'GET',
    'url': 'https://awwapp.com/static/widget/sample_toolbar.html'
}).done(function(res, status) {
    $('#aww-wrapper').append(res);
    initToolbar();
});