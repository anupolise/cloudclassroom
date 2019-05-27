var express = require('express');
var app = express();
var path = require('path');

// Static file serving in public/ directory
app.use(express.static('public'));
app.use(express.static('files'));

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
