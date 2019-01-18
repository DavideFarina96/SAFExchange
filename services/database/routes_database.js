var express = require('express');
router = express.Router();

var mongoose = require('mongoose');                     // mongoose for mongodb
var db_schemas = require('./schemas.js');

// VARIABLES
var debugObjectArray = [] // used to store the data received from the server_price ws


// MONGOOSE
mongoose.connect('mongodb://localhost:27017/eaglewebplatform',
	function (err) {
		if (err)
			console.log("db error");
		else
			console.log("Connected to db");
	});     // connect to mongoDB database

// SCHEMAS
var Users = mongoose.model('users');
var Subreports = mongoose.model('subreports');
var Reports = mongoose.model('reports');
var Weeks = mongoose.model('weeks');
var Tasks = mongoose.model('tasks');
var Bugs = mongoose.model('bugs');


// ROUTES

// Defines the /price API, which is used from pricews for saving the new value of the currencies
router.post('/price', function (req, res) {
	// configuration for the response
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try {
		//process
		// req.body.param_name --> get the specified parameter sent through the request parameter
		console.log("WS DATABASE");
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