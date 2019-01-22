var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http'); // used for calling external server
var request = require('request'); // used for calling external server <-- da togliere
var querystring = require('querystring');
var datetime = require('node-datetime');
var app = express();
var router = express.Router();

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:

//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// SERVER setting:
// set the server listening port
const port = process.env.PORT || 8082;

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
// ROUTING SETUP
//////////////////////////////////////////////////////////////////////////////
/**  route used for test*/
router.get('/client', function (req, res) {
	// send a feedback to the client
	res.sendFile(path.join(__dirname + '/client/index.html'));
});

// ROUTES
var possible_routes =
	"GET		/transactions/:id_user" + "<br>" +
	"POST 		/buy" + "<br>" + 
	"	 		/sell";

router.get('/routes', function (req, res) {
	res.send(possible_routes);
});


/** Defines the / API,
 *  Given the ID of the user, return the list of all transactions that have been executed in the past
*/
router.get('/transactions/:user_id', function (req, res) { 
	try
	{
		// step 1: extract the ID of the user from the req
		var ID_user = req.params.user_id;
		console.log("ID_user: " + ID_user); // DEBUG

		// step 2: call the wb /database/.. in order to gather the user informations
		// OSS: the data received from the /database ws should be already in the json format
		var sdtwsdb = organizeDataToBeSendAndSend(ID_user); 
		sdtwsdb.then(function(result) {
			//	enter here when Promise response. Result is the value return by the promise -> resolve("success");
			res.statusCode = 200; 
			res.send(result);

		}, function(err) { // enter here when Promise reject
			// an error has occurred
			res.statusCode = 400; /*** 400 messo a caso */
			res.send('{"status":"Unexpected error has occurred."}');
		});
	}
	catch(error)
	{
		// an error has occurred
		res.statusCode = 400; /*** 400 messo a caso */
		res.send('{"status":"user id has not been specified."}');
	}
});


/////////////////////////////////////////
///////////////// IDEA 1
/** Defines the /buy API.
 *  This function receives the command from the client or from the plannedaction ws in order performe a "buy" action
  */
 /*router.post('/buy', function (req, res) { 
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	// first of all, let's check if the request comes from the client or from the ws plannedaction
	// Data send by the user:
	// - ID_user
	// - buy ETH or BTC 
	// Data send by the ws plannedaction:
	// - ID_plannedaction
	// - ID_user (contained in the details of the plannedaction)
	// - buy ETH or BTC (contained in the details of the plannedaction)
	// - price to buy (contained in the details of the plannedaction)
	try
	{	

		// it's a user
	}
	catch(error)
	{	
		
		// it's the ws
	}

	try
	{
		// step 1: check the price of the currency

		// step 2: compare it with the value specified by the user or the plannedaction

		// step 3: if it was a plannedaction, ask to delete it (or mark as completed) by calling /plannedaction/....

		// step 4: save the transaction in the db (call /database/.... )

		// set 5: update user balance by calling /user/... with PUT method (simulate the action "buy")

	}
	catch(error)
	{
		res.statusCode = 400; /*** 400 messo a caso *
		stringData = '{"status":"unexpected_error"}';
	}

	res.send(stringData);
});*/

router.post('/buy/:plannedaction_id', function (req, res) { 
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	// Data send by the ws plannedaction:
	// - ID_plannedaction
	// - ID_user (contained in the details of the plannedaction)
	// - buy ETH or BTC (contained in the details of the plannedaction)
	// - price to buy (contained in the details of the plannedaction)
	try
	{	
		var _ID_plannedaction = req.params.plannedaction_id;
		var _ID_user = req.body.user_id;
		var _currency = req.body.currency; // ETH or BTC
		var _price = req.body.price;

		// step 1: check the price of the currency
		// create the object with the data to send
		var tmpObj =  querystring.stringify({
			ID_plannedaction: _ID_plannedaction,
			ID_user: _ID_user,			// ID of the user that has requested the action
			currency: _currency,
			price: _price
		});
						
		// step 2: create the header to send the data
		var _header = {
			'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
			'Content-Length': Buffer.byteLength(tmpObj)
		}

		var serverPath = "";
		if(_currency == "BTCUSD")
			serverPath = "/price/BTCUSD";
		if(_currency == "ETHUSD")
			serverPath = "/price/ETHUSD";
		
		// Return new promise 
		return new Promise(function(resolve, reject) {
			// Do async job
			
			// step 3: call the function "sendDataToWS(...)" in order to get the transaction history of the specified user
			var sdtwsdb = sendDataToWS('localhost', 8080, serverPath, 'GET',  _header, tmpObj); 
			sdtwsdb.then(function(result) {
				//	enter here when Promise response. Result is the value return by the promise -> resolve("success");
				console.log("[wsdb] " + result);
				var resultOBJ = JSON.parse(result);
				
				// step 2: compare it with the value specified by the user or the plannedaction
				var updatedValue = 0;
				if(_currency == "BTCUSD")
				{
					updatedValue = parseFloat(resultOBJ.btcusd);
				}
				if(_currency == "ETHUSD")
				{
					updatedValue = parseFloat(resultOBJ.ethusd);
				}
				
				// compare the updateValue with the one received from the ws plannedactions
				if(parseFloat(price) == updatedValue)
				{	

					// step 3: if it was a plannedaction, ask to delete it (or mark as completed) by calling /plannedaction/....

					// step 4: save the transaction in the db (call /database/.... )

					// set 5: update user balance by calling /user/... with PUT method (simulate the action "buy")


				}
				else
					console.log("Error: price values are inconsistent");


			}, function(err) { // enter here when Promise reject
				console.log("[wsdb] Unexpected error: " + err);
			});
		});


	}
	catch(error)
	{
		res.statusCode = 400; /*** 400 messo a caso *
		stringData = '{"status":"unexpected_error"}';
	}

	res.send(stringData);
});

/** Defines the /sell API.
 *  This function receives the command from the client or from the plannedaction ws in order to performe a "sell" action
  */
 router.post('/sell', function (req, res) { 
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	// first of all, let's check if the request comes from the client or from the ws plannedaction
	// Data send by the user:
	// - ID_user
	// - sell ETH or BTC 
	// Data send by the ws plannedaction:
	// - ID_plannedaction
	// - ID_user (contained in the details of the plannedaction)
	// - sell ETH or BTC (contained in the details of the plannedaction)
	// - price to sell (contained in the details of the plannedaction)
	try
	{	

		// it's a user
	}
	catch(error)
	{	
		
		// it's the ws
	}

	try
	{
		// step 1: check the price of the currency

		// step 2: compare it with the value specified by the user or the plannedaction

		// step 3: if it was a plannedaction, ask to delete it (or mark as completed) by calling /plannedaction/....

		// step 4: save the transaction in the db (call /database/.... )

		// set 5: update user balance by calling /user/... with PUT method (simulate the action "sell")

	}
	catch(error)
	{
		res.statusCode = 400; /*** 400 messo a caso */
		stringData = '{"status":"unexpected_error"}';
	}

	res.send(stringData);
});

//////////////////////////////////////////////////////////////////////////////
// FUNCTIONS and METHODS
//////////////////////////////////////////////////////////////////////////////
/** TO BE COMMENTED */
async function organizeDataToBeSendAndSend(_ID_user)
{
	try
	{
		// step 1: create the object with the data to send
		var tmpObj =  querystring.stringify({
			ID_user: _ID_user,			// ID of the user that has requested the action
		});
						
		// step 2: create the header to send the data
		var _header = {
			'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
			'Content-Length': Buffer.byteLength(tmpObj)
		}

		var serverPath = '/database/transaction/user/' + _ID_user;

		// Return new promise 
		return new Promise(function(resolve, reject) {
			// Do async job
			
			// step 3: call the function "sendDataToWS(...)" in order to get the transaction history of the specified user
			var sdtwsdb = sendDataToWS('localhost', 8080, serverPath, 'GET',  _header, tmpObj); 
			sdtwsdb.then(function(result) {
				//	enter here when Promise response. Result is the value return by the promise -> resolve("success");
				console.log("[wsdb] " + result);
				
				resolve(result);

			}, function(err) { // enter here when Promise reject
				console.log("[wsdb] Unexpected error: " + err);
				reject(err);
			});
		});
	}
	catch(error)
	{
		console.log("CATCH Unexpected error: " + error);
		return null;
	}
}

/** This function connects to the specified host and send the _data with the choosen crud method */
async function sendDataToWS(_host, _port, _path, _method, _header, _data)
{
		var options = {
			host: _host, 		// es: 'localhost', 
			port: _port, 		// es: 8085,
			path: _path, 		// es: '/transaction',
			method: _method, 	// es: 'POST',
			headers: _header	/*  es: {
										'Content-Type': 'application/x-www-form-urlencoded',
										'Content-Length': Buffer.byteLength(data)
								}*/
		};
		
		// Return new promise 
		return new Promise(function(resolve, reject) {
			// Do async job
			var serverResponse;
			var httpreq = http.request(options, function (response) {
					
				response.setEncoding('utf8');
				response.on('data', function (chunk) {
					serverResponse = chunk;
				});
				response.on('end', function() {
					console.log('---------->call ended');
					resolve(serverResponse);
				})
			});
			
			httpreq.write(_data);
			httpreq.end();
		
			httpreq.on('error', function(err) {
				// Handle error
				console.error('httpreq: ' + err);
				reject(err);
			});
		});
}

//////////////////////////////////////////////////////////////////////////////
app.use('/', router); // set the initial path for the "router"

// listen in a specific port
app.listen(port, function () {
	console.log("WS transaction listening on port " + port);
});