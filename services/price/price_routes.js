var express = require('express');
//var bodyParser = require('body-parser');
//var request = require("request");
var path = require('path');
var http = require('http'); // used for calling external server
var querystring = require('querystring');
var datetime = require('node-datetime');
var router = express.Router();

 // here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
const host = "localhost"; // "safexchange.herokuapp.com"
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables
var ourBTCValue = 0, ourETHValue = 0; // value BTC -> USD and ETH -> USD for buying and selling on SAFEx
const rangeBTC = 0.1, rangeETH = 0.01; // the last computed value of BTC is different from the one saved on the db if it's outside the db value +- range
const timerInterval = 10000; // milliseconds timer interval // 1500; --> error code 429 (To many requests)

// initially, the value for ourBTC and ourETH are set to zero by default. 
// In order to use the "range" and check if the new value is different from the previous one, we need to correctly initialize it
var hasBTCbeenInitialize = false; 
var hasETHbeenInitialize = false; 

var debugBTCHistory = new Array(), debugETHHistory = new Array();
//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
// ROUTES SETUP
/* Provide the user the list of available operation on this server */
var possible_routes =
	"GET\t	/BTCUSD" + "<br>" +
	"\t		/ETHUSD";
router.get('/', function (req, res) {
	res.send(possible_routes);
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
		stringData = '{"status":"'+ error +'"}';
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
		res.send('{"btcusd":"'+ error +'"}');
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
		res.send('{"ethusd":"'+ error +'"}');
	}
});

//////////////////////////////////////////////////////////////////////////////
// FUNCTIONS and METHODS
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
	//seconds++;
	//console.log(seconds + ' seconds');

	try
	{
		getPriceBTC()
			.then((resIsBTCChanged) => {
				if(resIsBTCChanged)
				{
					// debug: console.log("BTC changed: average: " + debugBTCHistory[debugBTCHistory.length - 1] + " final: " + ourBTCValue + "<---");
					organizeDataToBeSendAndSend(true, false);
				}
				//else
				// debug: console.error("BTC same: "+ ourBTCValue);
			});

		getPriceETH()
			.then((resIsETHChanged) => {
				if(resIsETHChanged)
				{
					//console.log("ETH changed: average: " + debugETHHistory[debugETHHistory.length - 1] + " final: " + ourETHValue + "<---");
					organizeDataToBeSendAndSend(false, true);
				}
				//else
				// debug: console.error("ETH same: " + ourETHValue);
			});
	}
	catch(error)
	{
		console.log("[updateCurrency] " + error);
	}
}

/** TO BE COMMENTED */
function organizeDataToBeSendAndSend(_isBTCChanged, _isETHChanged)
{
	try
	{
		var dt = datetime.create();
		var formattedDate = dt.format('d/m/Y H:M:S:N');

		/** call the databasews in order to store the new value  */
		// step 1: create the object with the data to send
		var tmpObj =  querystring.stringify({
			//time: formattedDate,			// time of the last update
			//isBTCchanged: _isBTCChanged,	// to avoid adding duplicate values in the db
			//isETHChanged: _isETHChanged,	// to avoid adding duplicate values in the db
			BTC: ourBTCValue,			// last stored value for BTC
			ETH: ourETHValue				// last stored value for ETH
		});
						
		// step 2: create the header to send the data
		var _header = {
			'Host': host,
			'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
			'Content-Length': Buffer.byteLength(tmpObj)
		}
		
		// step 3: call the function "sendDataToWS(...)" and send the updated prices to the WS that manage the database 
		var sdtwsdb = sendDataToWS('localhost', 8080, '/database/price', 'POST',  _header, tmpObj); 
		sdtwsdb.then(function(result) {
			//	enter here when Promise response. Result is the value return by the promise -> resolve("success");
			// debug: console.log("[wsdb] "+ result);

			// send date to the ws plannedaction with the updated value of the currencies
			var sdtwspa = sendDataToWS(host, 8080, '/plannedaction/checkTriggers', 'POST',  _header, tmpObj);
			sdtwspa.then(function(result) {
				//	enter here when Promise response. Result is the value return by the promise -> resolve("success");
				// debug: 
				console.log("[wspa] "+ result);
			
			}, function(err) { // enter here when Promise reject
				console.log("[wsplannedaction] " + err);
			});


		}, function(err) { // enter here when Promise reject
			console.log("[wsdatabase] " + err);
		});
	}
	catch(error)
	{
		console.log("[organizeDataToBeSendAndSend] " + error);
	}
}

/** This function connects to the specified host and send the _data with the choosen crud method */
function sendDataToWS(_host, _port, _path, _method, _header, _data)
{  // source code: https://medium.com/dev-bits/writing-neat-asynchronous-node-js-code-with-promises-32ed3a4fd098
	
	var options = {
		host: _host, 		// es: 'localhost', 
		port: _port, 		// es: 8085,
		path: _path, 		// es: '/price',
		method: _method, 	// es: 'POST',
		headers: _header	
	};
	// Return new promise 
	return new Promise(function(resolve, reject) {
		// Do async job
		
		var httpreq = http.request(options, function (response) {
				
			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				// debug: console.log("--->"+ _port +": " + chunk);
			});
			response.on('end', function() {
				// debug: 
				console.log('---------->call ended');

				resolve("success");
			})
		});
			
		httpreq.write(_data);
		httpreq.end();
	
		httpreq.on('error', function(err) {
			console.error(err);
			reject(err);
		});
	});
}


//////////////////////////////////////////////////////////////////////////////
// inizialize timer for update the currencies values
//setInterval(updateCurrency, timerInterval);
//console.log("Timer \"price\" inizialized....");

// EXPORT router to be used in the main file
module.exports = router;