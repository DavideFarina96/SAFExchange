var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var debugObjectArray = [] // used to store the data received from the server_price ws
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// SERVER settings:
// set the server listening port
var port = process.env.PORT || 8085;

/* Configure express app to use bodyParser()
 * to parse body as URL encoded data
 * (this is how browser POST form data)
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// needed to send file to the client (i.e. style file)
app.use(express.static(path.join(__dirname, 'public')));
// END of the SERVER CONFIGURATION 
//////////////////////////////////////////////////////////////////////////////

/** middleware route to support CORS and preflighted requests */
app.use(function (req, res, next) {

	if (req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
		res.header("Access-Control-Allow-Credentials", false);
		res.header("Access-Control-Max-Age", '86400'); // 24 hours
		res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
	}
	else {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	}
	next();
});

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
router.post('/price', function (req, res) {
	// configuration for the response
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try
	{
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
	catch(error)
	{
		res.statusCode = 400;
		res.send('{"status": "'+error+'"}');
	}
});


//////////////////////////////////////////////////////////////////////////////
app.use('/', router); // set the initial path for the "router"

// listen in a specific port
app.listen(port, function () {
	console.log("WS database is on port " + port);
});