/*
	SerialToJson.js
	a node.js app to read serial strings, convert them to
	JSON objects, and send them to webSocket clients
	requires:
		* node.js (http://nodejs.org/)
		* express.js (http://expressjs.com/)
		* socket.io (http://socket.io/#how-to-use)
		* serialport.js (https://github.com/voodootikigod/node-serialport)

	To start server:
	$ `node index.js [ArduinoPortName]`
	where [ArduinoPortName] is the path to the serial port you want to open.

	Initial Socket.io code adapted from Tom Igoe:
	http://www.tigoe.com/pcomp/code/arduinowiring/1109/
*/

var serialport = require("serialport");				    // include the serialport library
var express = require('express');
var app = express();                              // start Express framework
var server = require('http').createServer(app);		// start an HTTP server
var io = require('socket.io').listen(server);		  // filter the server using socket.io
var path = require('path');

var portName = process.argv[2];						// third word of the command line should be serial port name
console.log('opening serial port: ' + portName);	// print out the port you're listening on

server.listen(8080);								// listen for incoming requests on the server
console.log('Listening for new clients on port 8080');
var connected = false;

// open the serial port. Change the name to the name of your port, just like in Processing and Arduino:
var myPort = new serialport(portName, {
	// look for return and newline at the end of each data packet:
	parser: serialport.parsers.readline("\r\n")
});

// Find static files under /static.
app.use( express.static( path.join(__dirname, 'static') ) )

// Respond to web GET requests with the index.html page.
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


// Listen for new socket.io connections.
io.sockets.on('connection', function (socket) {

	// if the client connects:
	if (!connected) {
		// clear out any old data from the serial buffer:
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

	// Listen for new serial data.
	myPort.on('data', function (data) {

		console.log(data);

		if ( data.charAt(0) == '{' ) { // Ignore input that isn't JSON. Ignore the piss-poor validation.

			// Convert the string into a JSON object:
			var serialData = JSON.parse(data);

			// send a serial event to the web client with the data:
			socket.emit('serialEvent', serialData);
		}

	});

	// Handle incoming Socket.IO message from the browser.
	socket.on('missionRequest', function (mission) {

			// The message is received as an object,
			// convert it to a comma separated string with code and rover.
			var missionMsg = String(mission.code + ',' + mission.rover + '\n');
			var asciiMissionMsg = Buffer.from(missionMsg).toString('ascii');
			console.log(asciiMissionMsg);

			// Sending String character by character
			for(var i=0; i<missionMsg.length; i++){

					myPort.write(missionMsg[i]);
			}

			// Sending the newline char to signal end of message.
			// myPort.write(new Buffer(, 'ascii'), function(err, results) {
			// 		// console.log('err ' + err);
			// 		// console.log('results ' + results);
			// });

			console.log('New Mission, ' +  mission.code + ', sent to ' + mission.rover + '.');
	});
});
