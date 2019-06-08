var url = new URL(location.href);
var socket = io.connect(); // init socket connection
var name = url.searchParams.get('name') || "Instructor"; // user name for current session
var code = url.searchParams.get('code'); // user name for current session
var aww;
var teaching = url.pathname == '/teacher';

setTopBar();

socket.emit('classroom-select', { classroom: code, name: name });
socket.emit('board-code');

// initialize classroom (old messages)
socket.on('init', function (data) {
	var messageDisplay = document.getElementById('message-display');
	var questionDisplay = document.getElementById('question-display');

	for (var i = 0; i < data.msglist.length; i++)
		addMessage(messageDisplay, data.msglist[i]);

	for (var i = 0; i < data.questionList.length; i++) {
		console.log(data.questionList[i]);
		addQuestion(questionDisplay, data.questionList[i]);
	}

	$('.message .checkbox').on('click', function() {
		var timestamp = new Date().getMinutes() + ":" + new Date().getSeconds();
		if ($(this).is(':checked'))
			$(this).prev().text(timestamp);
		else
			$(this).prev().text('');
	});
});

// receive new message
socket.on('chat', function (data) {
	var messageDisplay = document.getElementById('message-display');
	addMessage(messageDisplay, data);

	var chatFocused = $('#message-display').css('display') == 'block';
	if (!chatFocused)
		$('#show-chat-btn').addClass('blink');
});

// receive new message
socket.on('question', function (data) {
	var questionDisplay = document.getElementById('question-display');
	addQuestion(questionDisplay, data);

	var chatFocused = $('#message-display').css('display') == 'block';
	if (chatFocused)
		$('#show-ques-btn').addClass('blink');
});

// get board code
socket.on('board-code', function(data) {
	const FREEKEY = '7b1dce0b-374d-4bff-b62f-079adcd55386'; // for http://localhost:8000
	const PAIDKEY = 'c0f20fe4-3e65-4fcf-823a-d821138cc8a7'; // for https://cloud-classroom.herokuapp.com domain
	var key = (url.hostname === 'localhost') ? FREEKEY : PAIDKEY;

	if(teaching){
		aww = new AwwBoard('#aww-wrapper', {
	    apiKey: key,
	    boardLink: data.code,
	    enableZoom: false,
	    //multiPage: true
		});
	}
	else{
		aww = new AwwBoard('#aww-wrapper', {
	    apiKey: key,
	    boardLink: data.code,
	    // multiPage: true
		});
	}
	

	// if (!teaching)
		// $('#aww-wrapper').css('pointer-events', 'none');
});

// send new message
$('#classroom-chat').submit(function(e){
	e.preventDefault();

	var messageInput = document.getElementById('input-field');
	socket.emit('chat', { message: messageInput.value, sender: name });
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
function addMessage(element, data) {
	$(`\
		<div class="message">\
			<div class="sender"> ${ data.sender } </div>\
			<div class="text" style="background-image: linear-gradient(to right, ${ hexToRgb('#' + data.color, 0.5) } , ${ hexToRgb('#' + data.color, 0.2) });"> ${ data.message } </div>\
		</div>\
	`).appendTo(element);
	element.scrollTop = element.scrollHeight;
}

// add new message
function addQuestion(element, data) {
	var checkbox;
	if (teaching)
		checkbox = '<input type="checkbox" class="checkbox float-right col-1">';
	else
		checkbox = '';

	$(`\
		<div class="message">\
			<div class="sender"> ${ data.sender } </div>\
			<div class="text row" style="background-image: linear-gradient(to right, ${ hexToRgb('#' + data.color, 0.5) } , ${ hexToRgb('#' + data.color, 0.2) });">
				<div class="col-8 pl-0 pr-0"> ${ data.message } </div>
				<div class="col-3"></div>
				${ checkbox }
			</div>\
		</div>\
	`).appendTo(element);
	element.scrollTop = element.scrollHeight;
}


function show_chat(){
	document.getElementById("message-display").style.display = "block";
	document.getElementById("classroom-chat").style.display = "block";
	document.getElementById("question-display").style.display = "none";
	var msg = document.getElementById("show-chat-btn");
	var ques = document.getElementById("show-ques-btn");
	msg.classList.add("active");
	ques.classList.remove("active");

	$('#show-chat-btn').removeClass('blink');
}

function show_questions(){
	document.getElementById("message-display").style.display = "none";
	document.getElementById("classroom-chat").style.display = "none";
	document.getElementById("question-display").style.display = "block";
	var msg = document.getElementById("show-chat-btn");
	var ques = document.getElementById("show-ques-btn");
	msg.classList.remove("active");
	ques.classList.add("active");

	$('#show-ques-btn').removeClass('blink');
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

// set top bar
function setTopBar() {
	var username = $('#topbar #user-name');
	var invitelink = $('#topbar #invite-link');

	username.text(name);
	invitelink.text("Invite Link: " + url.origin + '?code=' + code);
	invitelink.attr('href', url.origin + '?code=' + code);
}

// https://stackoverflow.com/a/5624139/8443192
function hexToRgb(hex, trans) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? `rgba(\
		${ parseInt(result[1], 16) },\
		${ parseInt(result[2], 16) },\
		${ parseInt(result[3], 16) },\
		${ trans })` : '';
}

if (teaching)
	$.ajax({
	    'method': 'GET',
	    'url': 'https://awwapp.com/static/widget/sample_toolbar.html'
	}).done(function(res, status) {
	    $('#aww-wrapper').append(res);
	    initToolbar();
	});
