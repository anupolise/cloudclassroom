var express = require('express');
var app = express();
var path = require('path');

// Static file serving in public/ directory
app.use(express.static('public'));
app.use(express.static('files'));


// Global variables
var classrooms = {
	"<cid1>": {
		"name": "<...>",
		"teacher": "<tid1>",
		"students": ["sid1", "sid2", "sid3"]
	},
	"<cid2>": {
		"name": "<...>",
		"teacher": "<tid2>",
		"students": ["sid1", "sid3", "sid4"]
	}
};


// Home route
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// Server code
var server = app.listen(8000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Server running on port %s", port)
});
