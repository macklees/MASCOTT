/*
	SerialToJson.js
	a node.js app to read serial strings, convert them to
	JSON objects, and send them to webSocket clients
	requires:
		* node.js (http://nodejs.org/)
		* express.js (http://expressjs.com/)
		* socket.io (http://socket.io/#how-to-use)
		* serialport.js (https://github.com/voodootikigod/node-serialport)

	To call it type:
		node index.js portname

	where portname is the path to the serial port you want to open.

	created 1 Nov 2012 by Tom Igoe.

*/

var SerialPort = require("serialport");				    // include the serialport library
var express = require('express');
var app = express();                              // start Express framework
var server = require('http').createServer(app);		// start an HTTP server
var io = require('socket.io').listen(server);		  // filter the server using socket.io
var path = require("path");

var portName = process.argv[2];						// third word of the command line should be serial port name
console.log("opening serial port: " + portName);	// print out the port you're listening on

server.listen(8080);								// listen for incoming requests on the server
console.log("Listening for new clients on port 8080");
var connected = false;

// open the serial port. Change the name to the name of your port, just like in Processing and Arduino:
var myPort = new SerialPort(portName, {
	// look for return and newline at the end of each data packet:
	parser: SerialPort.parsers.readline("\r\n")
});

app.use( express.static( path.join(__dirname, 'static') ) )

// respond to web GET requests with the index.html page:
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


// listen for new socket.io connections:
io.sockets.on('connection', function (socket) {
	// if the client connects:
	if (!connected) {
		// clear out any old data from the serial bufffer:
		myPort.flush();
		// send a byte to the serial port to ask for data:
		myPort.write('c');
    	console.log('user connected');
    	connected = true;
    }

	// if the client disconnects:
	socket.on('disconnect', function () {
		myPort.write('x');
    	console.log('user disconnected');
    	connected = false;
  	});

	// listen for new serial data:
	myPort.on('data', function (data) {
		// Convert the string into a JSON object:
		var serialData = JSON.parse(data);
		// for debugging, you should see this in the terminal window:
		console.log(data);
		// send a serial event to the web client with the data:
		socket.emit('serialEvent', serialData);
	});
});
