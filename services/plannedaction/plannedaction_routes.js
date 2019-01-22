var express = require('express');
var path = require('path');
var router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var debugObjectArray = [] // used to store the data received from the server_price ws
//////////////////////////////////////////////////////////////////////////////

/** function that respond to the request server_path/, in both GET and POST */
router.all(['/index.js', '/style.css'], function (req, res) {
	var resource = req.originalUrl == '/' ? '/index.html' : req.originalUrl;
	// get the index.html file in the client directory on the server
	var file = path.join(__dirname + '/client' + resource);
	// send the file to the client
	res.sendFile(file);
});


//////////////////////////////////////////////////////////////////////////////
//
// ROUTING SETUP
//
// Defines the /price API, which is used from pricews for saving the new value of the currencies
router.post('/checkTriggers', function (req, res) {
	// configuration for the response
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try {
		//process
		// req.body.param_name --> get the specified parameter sent through the request parameter
		console.log("WS PLANNEDACTION");
		var _receivedTime = (req.body.time); console.log("_receivedTime: " + _receivedTime);
		var _receivedisBTCchanged = (req.body.isBTCchanged); console.log("_receivedisBTCchanged: " + _receivedisBTCchanged);
		var _receivedisETHChanged = (req.body.isETHChanged); console.log("_receivedisETHChanged: " + _receivedisETHChanged);
		var _receivedBTC = (req.body.BTC); console.log("_receivedBTC: " + _receivedBTC);
		var _receivedETH = (req.body.ETH); console.log("_receivedETH: " + _receivedETH);



		// store the element in the array 
		debugObjectArray.push({
			receivedTime: _receivedTime,
			receivedisBTCchanged: _receivedisBTCchanged,
			receivedisETHChanged: _receivedisETHChanged,
			receivedBTC: _receivedBTC,
			receivedETH: _receivedETH,
		});

		/////////////
		/// do things..........
		/////////////

		res.send('{"status": "OK"}');
	}
	catch (error) {
		res.statusCode = 400;
		res.send('{"status": "' + error + '"}');
	}
});



// EXPORT router to be used in the main file
module.exports = router;