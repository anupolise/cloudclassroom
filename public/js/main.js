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
	const FREEKEY = '7b1dce0b-374d-4bff-b62f-079adcd55386'; // for http://localhost:8000
	const PAIDKEY = 'c0f20fe4-3e65-4fcf-823a-d821138cc8a7'; // for https://cloud-classroom.herokuapp.com domain
	var key = (url.hostname === 'localhost') ? FREEKEY : PAIDKEY;

	aww = new AwwBoard('#aww-wrapper', {
	    apiKey: key,
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

function show_chat(){
	document.getElementById("message-display").style.display = "block";
	document.getElementById("question-display").style.display = "none";
	var msg = document.getElementById("show-chat-btn");
	var ques = document.getElementById("show-ques-btn");
	msg.classList.remove("btn-secondary");
	msg.classList.add("btn-primary");
	ques.classList.remove("btn-primary");
	ques.classList.add("btn-secondary")
}

function show_questions(){
	document.getElementById("message-display").style.display = "none";
	document.getElementById("question-display").style.display = "block";
	var msg = document.getElementById("show-chat-btn");
	var ques = document.getElementById("show-ques-btn");
	msg.classList.remove("btn-primary");
	msg.classList.add("btn-secondary");
	ques.classList.remove("btn-secondary");
	ques.classList.add("btn-primary")
}

function get_stream_time_stamp(){
	var xmlHttp = new XMLHttpRequest();
	var url = "https://api.twitch.tv/kraken/streams/tropicalmangopunch"
	xmlHttp.open( "GET", url, false );
    xmlHttp.setRequestHeader("Client-ID","c7f027q1czl0pu51905r4beqtzwzb7");
    xmlHttp.send(null);
	var response = JSON.parse(xmlHttp.responseText);
	var stream_start_time = new Date(response["stream"]["created_at"]);
	var curr_date = new Date(new Date().toISOString());
	var diff = curr_date - stream_start_time;
	var minutes = 0, seconds;
	if (diff > 60e3){
		minutes = diff / 60e3
	}
	seconds = (diff % 60e3) / 1e3;
	console.log("minutes: ", minutes, "seconds: ", seconds);
}

$.ajax({
    'method': 'GET',
    'url': 'https://awwapp.com/static/widget/sample_toolbar.html'
}).done(function(res, status) {
    $('#aww-wrapper').append(res);
    initToolbar();
});