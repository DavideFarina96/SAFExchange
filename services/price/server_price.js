var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http'); // used for calling external server
var querystring = require('querystring');
var datetime = require('node-datetime');
var app = express();
var router = express.Router();

 // here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables
var ourBTCValue = 0, ourETHValue = 0; // value BTC -> USD and ETH -> USD for buying and selling on SAFEx
const rangeBTC = 0.1, rangeETH = 0.01; // the last computed value of BTC is different from the one saved on the db if it's outside the db value +- range
const timerInterval = 5000; // milliseconds timer interval // 1500; --> error code 429 (To many requests)

// initially, the value for ourBTC and ourETH are set to zero by default. 
// In order to use the "range" and check if the new value is different from the previous one, we need to correctly initialize it
var hasBTCbeenInitialize = false; 
var hasETHbeenInitialize = false; 

var debugBTCHistory = new Array(), debugETHHistory = new Array();
var seconds = 0;
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// SERVER setting:
// set the server listening port
const port = process.env.PORT || 8084;

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
/** default route used for test*/
router.get('/', function (req, res) {
	// send a feedback to the client
	res.sendFile(path.join(__dirname + '/client/index.html'));
});

/** Defines the /prices API,
 *  This function allows the client to retrive both the value of BTC and ETH as a JSON object
*/
router.get('/prices', function (req, res) { // automatically call both BTCUSD and ETHUSD in order to update the respective prices
	var stringData = "{";

	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try
	{
		stringData += '"status":'+ res.statusCode;

		/** BTC section */
		// let's first check if the BTC value has been initialized
		if(hasBTCbeenInitialize)
		{	// YES: return the latest saved one to the client
			stringData += ', "btcusd":'+ ourBTCValue;
		}
		else
		{	// NO: inizialize the value and send it to the client
			getPriceBTC().then(() => {
				stringData += ', "btcusd":'+ ourBTCValue;
			});

		}
		/****************/

		/** ETH section */
		// let's first check if the ETH value has been initialized
		if(hasETHbeenInitialize)
		{	// YES: return the latest saved one to the client
			stringData += ', "ethusd":'+ ourETHValue;
		}
		else
		{	// NO: inizialize the value and send it to the client
			getPriceETH().then(() => {
				stringData += ', "ethusd":'+ ourETHValue;
			});
		}
		/****************/

		stringData += "}";
	}
	catch(error)
	{
		res.statusCode = 400; /*** 400 messo a caso */
		stringData = '{"status":"unexpected_error"}';
	}

	res.send(stringData);
});


/** Defines the /BTCUSD API.
 *  This function can be used from a client to get the value of the BTC as a json object
  */
router.get('/BTCUSD', function (req, res) {
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try
	{
		// let's first check if the BTC value has been initialized
		if(hasBTCbeenInitialize)
		{	// YES: return the last saved one to the client
			res.send('{"btcusd":"'+ ourBTCValue +'"}');
		}
		else
		{	// NO: inizialize the value and send it to the client
			getPriceBTC().then(() => {
				res.send('{"btcusd":"'+ ourBTCValue +'"}');
			});
		}
	}
	catch(error)
	{
		res.statusCode = 400;
		res.send('{"btcusd":"unexpected_error"}');
	}
});

/** Defines the /ETHUSD API.
 *  This function can be used from a client to get the value of the ETH as a json object
  */
router.get('/ETHUSD', function (req, res) {

	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try
	{
		// let's first check if the ETH value has been initialized
		if(hasETHbeenInitialize)
		{	// YES: return the last saved one to the client
			res.send('{"ethusd":"'+ ourETHValue +'"}');
		}
		else
		{	// NO: inizialize the value and send it to the client
			getPriceETH().then(() => {
				res.send('{"ethusd":"'+ ourETHValue +'"}');
			});
		}
	}
	catch(error)
	{
		res.statusCode = 400;
		res.send('{"ethusd":"unexpected_error"}');
	}
});

//////////////////////////////////////////////////////////////////////////////
//
// FUNCTIONS and METHODS
//
/** Get the BTC price using the APIs defined in "server_methods_BTCUSD.js".  
 *  .......
*/
async function getPriceBTC() {

	var debugisBTCchanged = false;
	var tmpCurrencyVal = 0;
	var tmpBTCValue = 0;
	var numOfExchanges = 4.0;
	
	try {
		debugisBTCchanged = false;
		tmpCurrencyVal = 0;

		coinbaseObj = (await server_methods_BTCUSD.HTTPCoinbaseRequestJSON()).data;
		tmpCurrencyVal += parseFloat(coinbaseObj.price);

		krakenObj = (await server_methods_BTCUSD.HTTPKrakenRequestJSON()).data; 
		tmpCurrencyVal += parseFloat(krakenObj.result.XXBTZUSD.a[0]);

		bitfinexObj = (await server_methods_BTCUSD.HTTPBitfinexRequestJSON()).data;
		tmpCurrencyVal += parseFloat(bitfinexObj[0][1].toString());

		binanceObj = (await server_methods_BTCUSD.HTTPBinanceRequestJSON()).data;
		tmpCurrencyVal += parseFloat(binanceObj.price);

		tmpBTCValue = (tmpCurrencyVal / numOfExchanges); // compute the average value of the BTC among the N selected exchanges
		debugBTCHistory.push(tmpBTCValue);

		if(!hasBTCbeenInitialize)
		{
			hasBTCbeenInitialize = true;
			ourBTCValue = tmpBTCValue; // first initialization of the variable on the server
			debugisBTCchanged = true;
		}
		else
		{
			if(!((ourBTCValue - rangeBTC) < tmpBTCValue &&  (ourBTCValue + rangeBTC) > tmpBTCValue))
			{	// true --> the computed value is different from the saved one
				ourBTCValue = tmpBTCValue;
				debugisBTCchanged = true;	
			}
		}
		return debugisBTCchanged;
	}
	catch (error) {
		console.error(error);
		return false;
	}


}

/** Get the ETH price using the APIs defined in "server_methods_ETHUSD.js".  
 *  .......
*/
async function getPriceETH() {

	var debugisETHchanged = false;
	var tmpCurrencyVal = 0;
	var tmpETHValue = 0;
	var numOfExchanges = 4.0;
	
	try {
		debugisETHchanged = false;
		tmpCurrencyVal = 0;

		coinbaseObj = (await server_methods_ETHUSD.HTTPCoinbaseRequestJSON()).data;
		tmpCurrencyVal += parseFloat(coinbaseObj.price);

		krakenObj = (await server_methods_ETHUSD.HTTPKrakenRequestJSON()).data; 
		tmpCurrencyVal += parseFloat(krakenObj.result.XETHZUSD.a[0]);

		bitfinexObj = (await server_methods_ETHUSD.HTTPBitfinexRequestJSON()).data;
		tmpCurrencyVal += parseFloat(bitfinexObj[0][1].toString());

		binanceObj = (await server_methods_ETHUSD.HTTPBinanceRequestJSON()).data;
		tmpCurrencyVal += parseFloat(binanceObj.price);

		tmpETHValue = (tmpCurrencyVal / numOfExchanges); // compute the average value of the BTC among the N selected exchanges
		debugETHHistory.push(tmpETHValue);

		if(!hasETHbeenInitialize)
		{
			hasETHbeenInitialize = true;
			ourETHValue = tmpETHValue; // first initialization of the variable on the server
			debugisETHchanged = true;
		}
		else
		{
			if(!((ourETHValue - rangeETH) < tmpETHValue &&  (ourETHValue + rangeETH) > tmpETHValue))
			{	// true --> the computed value is different from the saved one
				ourETHValue = tmpETHValue;
				debugisETHchanged = true;	
			}
		}
		return debugisETHchanged;
	}
	catch (error) {
		console.error(error);
		return false;
	}
}

/** TO BE COMMENTED:  CORE FUNCTION */
function updateCurrency() {
	seconds++;
	console.log(seconds + ' seconds');

	try
	{
		getPriceBTC()
			.then((resIsBTCChanged) => {
				if(resIsBTCChanged)
				{
					console.log("BTC changed: average: " + debugBTCHistory[debugBTCHistory.length - 1] + " final: " + ourBTCValue + "<---");
					organiseDataToBeSendAndSend(true, false);
				}
				else
					console.error("BTC same: "+ ourBTCValue);
			});

		/* commentato tmp: getPriceETH()
			.then((resIsETHChanged) => {
				if(resIsETHChanged)
				{
					console.log("ETH changed: average: " + debugETHHistory[debugETHHistory.length - 1] + " final: " + ourETHValue + "<---");
					organiseDataToBeSendAndSend(false, true);
				}
				else
					console.error("ETH same: " + ourETHValue);
			});*/
	}
	catch(error)
	{
		console.log("Unexpected error: " + error);
	}
}

/** TO BE COMMENTED */
function organiseDataToBeSendAndSend(_isBTCChanged, _isETHChanged)
{
	try
	{
		var dt = datetime.create();
		var formattedDate = dt.format('d/m/Y H:M:S:N');

		/** call the databasews in order to store the new value  */
		// step 1: create the object with the data to send
		var tmpObj =  querystring.stringify({
			time: formattedDate,			// time of the last update
			isBTCchanged: _isBTCChanged,	// to avoid adding duplicate values in the db
			isETHChanged: _isETHChanged,	// to avoid adding duplicate values in the db
			BTC: ourBTCValue,				// last stored value for BTC
			ETH: ourETHValue				// last stored value for ETH
		});
						
		// step 2: create the header to send the data
		var _header = {
			'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
			'Content-Length': Buffer.byteLength(tmpObj)
		}

		console.log("HERE 1");
		// step 3: call the function "sendDataToWS(...)" and send the updated prices to the WS that manage the database 
		sendDataToWS('localhost', 8085, '/price', 'POST',  _header, tmpObj).then((res) => {
			console.log("RES:" + res);
			if(res)
			{
				// sendDataToWS('localhost', 8083, '/checkTriggers', 'POST',  _header, tmpObj);
			}
			else
				console.log("Unable to store data in the db");
		});	
	}
	catch(error)
	{
		console.log("Unexpected error: " + error);
	}
}

/** This function connects to the specified host and send the _data with the choosen crud method */
// SBAGLIATA: ritorna true ancora prima di vedere cosa risponde il server e se il server è attivo
async function sendDataToWS(_host, _port, _path, _method, _header, _data)
{ // code from: https://stackoverflow.com/questions/19392744/calling-a-web-service-using-nodejs
	try
	{
		var options = {
			host: _host, 		// es: 'localhost', 
			port: _port, 		// es: 8085,
			path: _path, 		// es: '/price',
			method: _method, 	// es: 'POST',
			headers: _header	/*  es: {
										'Content-Type': 'application/x-www-form-urlencoded',
										'Content-Length': Buffer.byteLength(data)
								}*/
		};
		
		var httpreq = http.request(options, function (response) {
			var serverResponse;
			
			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				serverResponse = chunk;
				console.log("--->"+ _port +": " + chunk);
			});
			response.on('end', function() {
				console.log('---------->call ended');
				return true;
			})
		});
		
		
		httpreq.on('error', function(err) {
			// Handle error
			console.error('httpreq: ' + err);
			return false;
		});
		httpreq.write(_data);
		httpreq.end();
	}
	catch(error)
	{
		console.error("sendDataToWS(): " + error);
		return false;
	}
}

//////////////////////////////////////////////////////////////////////////////
app.use('/', router); // set the initial path for the "router"

// listen in a specific port
app.listen(port, function () {
	console.log("WS price listening on port " + port);

	// inizialize timer for update the currencies values
	setInterval(updateCurrency, timerInterval);
	console.log("Timer inizialized....");
});