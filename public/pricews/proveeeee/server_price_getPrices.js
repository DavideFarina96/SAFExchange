var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http'); // used for calling external server
var querystring = require("querystring");
var app = express();
var router = express.Router();

 // here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables
var ourBTCValue = 0, ourETHValue = 0; // value BTC -> USD and ETH -> USD for buying and selling on SAFEx
var rangeBTC = 0.5, rangeETH = 0.01; // the last computed value of BTC is different from the one saved on the db if it's outside the db value +- range
var timerInterval = 1000; // milliseconds timer interval

// initially, the value for ourBTC and ourETH are set to zero by default. 
// In order to use the "range" and check if the new value is different from the previous one, we need to correctly initialize it
var hasBTCbeenInitialize = false; 
var hasETHbeenInitialize = false; 

var debugBTCHistory = new Array(), debugETHHistory = new Array();
var debugisBTCchanged = false, debugisETHchanged = false;
var seconds = 0;
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// SERVER setting:
// set the server listening port
var port = process.env.PORT || 8084;

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
// Defines the /prices API, which is used to start the getPrices() request.
router.get('/prices', function (req, res) {
	getPrices('all')
		.then(() => {
			//var finalObject = createCombinedObject();
			//console.log("Sending obj to client");
			//console.log(finalObject);
			//res.send(finalObject);
		});
});



/** default route used for test*/
router.get('/', function (req, res) {
	// send a feedback to the client
	//res.sendFile(path.join(__dirname + '/client/index.html'));
});

//Defines the /prices API, which is used to start the getPrices() request.
router.get('/prices', function (req, res) {
	// automatically call both /BTCUSD and /ETHUSD in order to update the respective prices
	// TODO: call /BTCUSD
	// TODO: call /ETHUSD
});


//Defines the /prices API, which is used to start the getPrices() request.
router.get('/BTCUSD', function (req, res) {
	getPrices('BTCUSD')
		.then(() => {
			//res.contentType('html');
			//res.send("<li>average: " + debugBTCHistory[debugBTCHistory.length - 1] + " final: " + ourBTCValue + " </li>");
			//console.log("BTC: average: " + debugBTCHistory[debugBTCHistory.length - 1] + " final: " + ourBTCValue);
		});
});

//Defines the /prices API, which is used to start the getPrices() request.
router.get('/ETHUSD', function (req, res) {
	getPrices('ETHUSD')
		.then(() => {
			//res.contentType('html');
			//res.send("<li>average: " + debugETHHistory[debugETHHistory.length - 1] + " final: " + ourETHValue + " </li>");
			//console.log("ETH: average: " + debugETHHistory[debugETHHistory.length - 1] + " final: " + ourETHValue);
		});
});

//////////////////////////////////////////////////////////////////////////////
//
// FUNCTIONS and METHODS
//
//Get the BTC prices using the APIs defined in "server_methods.js".
async function getPrices(currency) {
	//console.log("Getting current "+ currency +" prices");

	var tmpCurrencyVal = 0;
	var tmpBTCValue = 0, tmpETHValue = 0;
	var numOfExchanges = 4.0;
	
	try {

		if(currency == "all" || currency == "BTCUSD")
		{
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

			//console.log(tmpBTCValue + " :---: " + ourBTCValue);
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
		}
		if(currency == "all" || currency == "ETHUSD")
		{
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

			//console.log(tmpETHValue + " :---: " + ourETHValue);
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
		}
	}
	catch (error) {
		//console.log(error);
	}


}

function updateCurrency() {
	seconds++;
	console.log(seconds + ' seconds');

	getPrices('BTCUSD')
		.then((resIsBTCChanged) => {
			if(resIsBTCChanged)
			{
				console.log("BTC changed: average: " + debugBTCHistory[debugBTCHistory.length - 1] + " final: " + ourBTCValue + "<---");
			}
			else
				console.error("BTC same: "+ ourBTCValue);
		});

	getPrices('ETHUSD')
		.then((resIsETHChanged) => {
			if(resIsETHChanged)
			{
				console.log("ETH changed: average: " + debugETHHistory[debugETHHistory.length - 1] + " final: " + ourETHValue + "<---");
			}
			else
				console.error("ETH same: " + ourETHValue);
		});
  }


function sendDataToWS(_host, _port, _path, _method, _port, _header, _data)
{
	var options = {
		host: _host, // 'requestb.in',
		port: _port, // 80,
		path: _path, // '/nfue7rnf',
		method: _method, // 'POST',
		headers: _header/*{
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'Content-Length': Buffer.byteLength(data)
		}*/
	  };
	
	  var httpreq = http.request(options, function (response) {
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
		  console.log("body: " + chunk);
		});
		response.on('end', function() {
		  res.send('ok');
		})
	  });
	  httpreq.write(_data);
	  httpreq.end();
}

//////////////////////////////////////////////////////////////////////////////
app.use('/', router); // set the initial path for the "router"

// listen in a specific port
app.listen(port, function () {
	console.log("App listening on port " + port);

	// inizialize timer for update the currencies values
	setInterval(updateCurrency, 1500);
	console.log("Timer inizialized....");
});