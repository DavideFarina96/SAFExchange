var express = require('express');
var path = require('path');
var http = require('http'); 				// used for calling external server
var querystring = require('querystring');
var date = require('date-and-time');
var schedule = require('node-schedule');   // scheduler used for automatically call a specific function every N secs
var router = express.Router();

// here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
const host = global.app_domain; 
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables
var ourBTCValue = 0, ourETHValue = 0; // value BTC -> USD and ETH -> USD for buying and selling on SAFEx
const rangeBTC = 0.1, rangeETH = 0.01; // the last computed value of BTC is different from the one saved on the db if it's outside the db value +- range

// initially, the value for ourBTC and ourETH are set to zero by default. 
// In order to use the "range" and check if the new value is different from the previous one, we need to correctly initialize it
var hasBTCbeenInitialize = false;
var hasETHbeenInitialize = false;
//////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////
// ROUTES SETUP
/* Provide the user the list of available operation on this server */
var possible_routes =
	"GET \t	/prices \t get the latest value of BTC and ETH" + "<br>" +
	"\t	/BTCUSD	\t get the latest BTC value stored" + "<br>" +
	"\t	/BTCUSD?elem_number=N	\t get the latest N BTC values stored. N = 0 -> returns every record, N > 0 return the specified number of records." + "<br>" +
	"\t	/ETHUSD \t get the latest ETH value stored" + "<br>" +
	"\t	/ETHUSD?elem_number=N	\t get the latest N ETH values stored. N = 0 -> returns every record, N > 0 return the specified number of records.";
router.get('/', function (req, res) {
	res.send(possible_routes);
});

/** Defines the /prices API,
 *  This function allows the client to retrive both the value of BTC and ETH as a JSON object
*/
router.get('/prices', function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: create the header to send the data
		var _header = {
			'Host': host
		}

		var sDSG = sendDataSimpleGET(host, 8080, '/database/price/', 'GET', _header);
		sDSG.then(function (result) {
			// debug: console.log(result);
			res.json(result);

		}, function (err) { // enter here when Promise reject
			console.log("[GET /prices] " + err);
			res.json({error: err});
		});
	}
	catch(error)
	{
		console.log("[GET /prices] " + error);
		res.json({error: error});
	}
});

/** Defines the /BTCUSD API.
 *  This function can be used by the client to get the value of the BTC from the database, as a json object.
  */
router.get('/BTCUSD', function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the user send the param "num"
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null)
		{	// user is asking for the lastest value
			lastestNvalues = 1;
		}
		
		// step 2: create the header to send the data
		var _header = {
			'Host': host
		}

		// step 3: specify the server path on the database ws
		var serverPath = '/database/price/BTCUSD?elem_number=' + lastestNvalues;
		var sDSG = sendDataSimpleGET(host, 8080, serverPath, 'GET', _header);
		sDSG.then(function (result) {
			// debug: console.log(result);
			res.json(result);

		}, function (err) { // enter here when Promise reject
			console.log("[GET /BTCUSD] " + err);
			res.json({error: err});
		});
	}
	catch(error)
	{
		console.log(error);
		res.json({error: error});
	}
});

/** Defines the /ETHUSD API.
 *  This function can be used by the client to get the value of the BTC from the database, as a json object.
 */
router.get('/ETHUSD', function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the user send the param "num"
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null)
		{	// user is asking for the lastest value
			lastestNvalues = 1;
		}
		
		// step 2: create the header to send the data
		var _header = {
			'Host': host
		}

		// step 3: specify the server path on the database ws
		var serverPath = '/database/price/ETHUSD?elem_number=' + lastestNvalues;
		var sDSG = sendDataSimpleGET(host, 8080, serverPath, 'GET', _header);
		sDSG.then(function (result) {
			// debug: console.log(result);
			res.json(result);

		}, function (err) { // enter here when Promise reject
			console.log("[GET /ETHUSD] " + err);
			res.json({error: err});
		});
	}
	catch(error)
	{
		res.json({error: error});
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

		if (!hasBTCbeenInitialize) {
			hasBTCbeenInitialize = true;
			ourBTCValue = tmpBTCValue; // first initialization of the variable on the server
			debugisBTCchanged = true;
		}
		else {
			if (!((ourBTCValue - rangeBTC) < tmpBTCValue && (ourBTCValue + rangeBTC) > tmpBTCValue)) {	// true --> the computed value is different from the saved one
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

		if (!hasETHbeenInitialize) {
			hasETHbeenInitialize = true;
			ourETHValue = tmpETHValue; // first initialization of the variable on the server
			debugisETHchanged = true;
		}
		else {
			if (!((ourETHValue - rangeETH) < tmpETHValue && (ourETHValue + rangeETH) > tmpETHValue)) {	// true --> the computed value is different from the saved one
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

	try {
		getPriceBTC()
			.then((resIsBTCChanged) => {
				if (resIsBTCChanged) {
					organizeDataToBeSendAndSend(true, false);
				}
			});

		getPriceETH()
			.then((resIsETHChanged) => {
				if (resIsETHChanged) {
					organizeDataToBeSendAndSend(false, true);
				}
			});
	}
	catch (error) {
		console.log("[updateCurrency] " + error);
	}
}

/** TO BE COMMENTED */ 
function organizeDataToBeSendAndSend(_isBTCChanged, _isETHChanged) {
	try {
		var tmpObj = "";
		if(_isBTCChanged == true && _isETHChanged == true) 
		{
			// step 1: create the object with the data to send
			tmpObj = querystring.stringify({
				BTCUSD: ourBTCValue,			// last stored value for BTC
				ETHUSD: ourETHValue			// last stored value for ETH
			});
		}
		else
		{
			if(_isBTCChanged == true) 
			{
				// step 1: create the object with the data to send
				tmpObj = querystring.stringify({
					BTCUSD: ourBTCValue			// last stored value for BTC
				});
			}
			else
			{
				if(_isETHChanged == true) 
				{
					// step 1: create the object with the data to send
					tmpObj = querystring.stringify({
						ETHUSD: ourETHValue			// last stored value for ETH
					});
				}
			}

		}

		if(tmpObj != "")
		{
			// step 2: create the header to send the data
			var _header = {
				'Host': host,
				'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
				'Content-Length': Buffer.byteLength(tmpObj)
			}

			// step 3: call the function "sendDataToWS(...)" and send the updated prices to the WS that manage the database 
			var sdtwsdb = sendDataToWS(host, 8080, '/database/price', 'POST', _header, tmpObj);
			sdtwsdb.then(function (result) {
				console.log("PRICE UPDATED: " + result);

				/******  COMMENTATO perché manca il ws 
				// send date to the ws plannedaction with the updated value of the currencies
				var sdtwspa = sendDataToWS(host, 8080, '/plannedaction/checkTriggers', 'POST', _header, tmpObj);
				sdtwspa.then(function (result) {
					// debug: console.log("[wspa] " + result);

				}, function (err) { // enter here when Promise reject
					console.log("[wsplannedaction] " + err);
				});*/


			}, function (err) { // enter here when Promise reject
				console.log("[wsdatabase] " + err);
			});
		}
		else
		console.log("[organizeDataToBeSendAndSend] ETH and BTC haven't changed.");
	}
	catch (error) {
		console.log("[organizeDataToBeSendAndSend] " + error);
	}
}

/* function getSpecifiedDataFromWS(_num, _currency) {
	try {
		// step 2: create the header to send the data
		var _header = {
			'Host': host
		}

		// Return new promise 
		return new Promise(function (resolve, reject) {

			// http://localhost:8080/database/price/ETHUSD?elem_number=10
			var serverPath = "";
			if(_currency.toUpperCase() == "BTCUSD")
				serverPath = '/database/price/BTCUSD?elem_number='+ _num;
			if(_currency.toUpperCase() == "ETHUSD")
				serverPath = '/database/price/ETHUSD?elem_number='+ _num;
			
				console.log(serverPath);

			// step 3: get the N latest values of the specified currency from the database 
			var sdtwsdb = sendDataToWSAsync(host, 8080, serverPath, 'GET', _header, '{}');
			sdtwsdb.then(function (result) {
				console.log(result);
				resolve(result);
			}, function (err) { // enter here when Promise reject
				console.log("[wsdatabase] " + err);
				reject(err);
			});
		});
	}
	catch (error) {
		console.log("[getSpecifiedDataFromWS] " + error);
	}
	
}*/

/*async function getPricesFromWS() {
	try {
		// step 1: create the header to send the data
		var _header = {
			'Host': host
		}

		// Return new promise 
		return new Promise(async function (resolve, reject) {
			// step 2: get the latest N values, for both ETH and BTC from the database
			var sdtwsdb = (await sendDataToWSAsync(host, 8080, '/database/price/', 'GET', _header,  '{}'));
			sdtwsdb.then(function (result) {
				console.log(result);
				resolve(result);
			}, function (err) { // enter here when Promise reject
				console.log("[wsdatabase] " + err);
				reject(err);
			});
		});
	}
	catch (error) {
		console.log("[getPricesFromWS] " + error);
	}
	
}*/

/** This function connects to the specified host and send the _data with the choosen crud method */
function sendDataToWS(_host, _port, _path, _method, _header, _data) {  // source code: https://medium.com/dev-bits/writing-neat-asynchronous-node-js-code-with-promises-32ed3a4fd098

	var options = {
		host: _host, 		// es: 'localhost', 
		port: _port, 		// es: 8085,
		path: _path, 		// es: '/price',
		method: _method, 	// es: 'POST',
		headers: _header
	};
	// Return new promise 
	return new Promise(function (resolve, reject) {

		var returnData;
		var httpreq = http.request(options, function (response) {

			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				// debug: console.log("--->"+ _port +": " + chunk);
				returnData = chunk;
			});
			response.on('end', function () {
				// debug:  console.log('---------->call ended');
				resolve(returnData);
			})
		});

		httpreq.write(_data);	/* !!!! IMPORTANT: whether _data is an empty object or has parameters,
								*	 I always need to generate the _header as following
								*	var _header = {
								*		'Host': host,
								*		'Content-Type': 'application/x-www-form-urlencoded', // "x-www-form-urlencoded" no idea  what this is.....
								*		'Content-Length': Buffer.byteLength(object_name)
								*	}
								*	If I don't specify the Content and I send the data, the request will generate an error .... 
								*/
		httpreq.end();

		httpreq.on('error', function (err) {
			console.error("ERR:::: " + err);
			reject(err);
		});
	});
}

function sendDataSimpleGET(_host, _port, _path, _method, _header) {  // source code: https://medium.com/dev-bits/writing-neat-asynchronous-node-js-code-with-promises-32ed3a4fd098

	var options = {
		host: _host, 		// es: 'localhost', 
		port: _port, 		// es: 8085,
		path: _path, 		// es: '/price',
		method: _method, 	// es: 'POST',
		headers: _header
	};
	// Return new promise 
	return new Promise(function (resolve, reject) {

		var returnData;
		var httpreq = http.request(options, function (response) {

			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				// debug:  console.log("--->"+ _port +": " + chunk);
				returnData = chunk;
			});
			response.on('end', function () {
				// debug: console.log('---------->call ended');
				resolve(returnData);
			})
		});
		httpreq.end();

		httpreq.on('error', function (err) {
			console.error("ERR: " + err);
			reject(err);
		});
	});
}

//////////////////////////////////////////////////////////////////////////////
// inizialize JOB SCHEDULER that updates the currencies values
var j = schedule.scheduleJob('*/10 * * * * *', function () { // execute the function every 5sec
  updateCurrency();
  // debug: console.log(date.format(new Date(), 'HH:mm:ss'));
});
console.log("Timer \"price\" inizialized....");

// EXPORT router to be used in the main file
module.exports = router;