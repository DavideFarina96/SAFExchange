var express = require('express');
var querystring = require('querystring');
var schedule = require('node-schedule');   // scheduler used for automatically call a specific function every N secs
var router = express.Router();
const axios = require('axios');
//var date = require('date-and-time');
//var path = require('path');
//var http = require('http'); 				// used for calling external server

/////////////////////////////////////////
// EXTERNAL FUNCTIONS
/////////////////////////////////////////
// here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

/////////////////////////////////////////
// VARIABLES DECLARATIONS
/////////////////////////////////////////
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables.
var ourBTCValue = 0, ourETHValue = 0; // used to stored the last up-to-date value of the currency.
const rangeBTC = 0.1, rangeETH = 0.009; // used to check whether a new value of BTC or ETH is different from the one stored in the variables "ourBTCValue" and "ourETHValue".
var hasBTCbeenInitialize = false, hasETHbeenInitialize = false; // used to update "ourBTCValue" and "ourETHValue" only when the values have changed. 

var possible_routes =
	"GET \t	/prices -> get the latest value of BTC and ETH" + "<br>" +
	"GET \t	/BTCUSD	-> get the latest BTC value stored" + "<br>" +
	"GET \t	/BTCUSD?elem_number=N -> get the latest N BTC values stored." + "<br>" +
	"GET \t	/ETHUSD -> get the latest ETH value stored" + "<br>" +
	"GET \t	/ETHUSD?elem_number=N -> get the latest N ETH values stored.";



/////////////////////////////////////////
// ROUTES SETUP
/////////////////////////////////////////
/* 
 * Provide the user the list of available operation on this server 
 */
router.get('/', function (req, res) {
	res.send(possible_routes);
});

/*
 *  This router provide the up-to-date value of both BTC and ETH.
 */
router.get('/prices', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{
		// let's call the ws "database" in order to retrieve the most up-to-date value of the currencies.
		var result = (await axios.get(app_domain + '/database/price/')).data; 
		
		// return the data obtained from the ws "database", to the caller.
		res.json(result);
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[GET /prices] " + error);
		res.json({error: error});
	}
});

/*
 *  This router can be used to get the latest value of the BTC from the database.
 *  If the request contains the parameter "elem_number=N", then the router will return the latest N stored values.
 */
router.get('/BTCUSD', async function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the request contains the parameter "elem_number"...
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null || isNaN(parseFloat(lastestNvalues)) || parseFloat(lastestNvalues) < 1)
		{	// ... elem_number has not been specified or it has an invalid values.
			lastestNvalues = 1;
		}
		
		// step 2: get the latest "lastestNvalues" values from the ws "database".
		var result = (await axios.get(app_domain + '/database/price/BTCUSD?elem_number=' + lastestNvalues)).data;
		res.json(result);
		
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[GET /BTCUSD] " + error);
		res.json({error: error});
	}
});

/*
 *  This router can be used to get the latest value of the ETH from the database.
 *  If the request contains the parameter "elem_number=N", then the router will return the latest N stored values.
 */
router.get('/ETHUSD', async function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the request contains the parameter "elem_number"...
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null || isNaN(parseFloat(lastestNvalues)) || parseFloat(lastestNvalues) < 1)
		{	// ... elem_number has not been specified or it has an invalid values.
			lastestNvalues = 1;
		}
		
		// step 2: get the latest "lastestNvalues" values from the ws "database".
		var result = (await axios.get(app_domain + '/database/price/ETHUSD?elem_number=' + lastestNvalues)).data;
		res.json(result);

	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[GET /ETHUSD] " + error);
		res.json({error: error});
	}
});

/////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////
/*   
 *  This function compute the BTC price using the APIs defined in "server_methods_BTCUSD.js".
 */
async function getPriceBTC() {

	var debugisBTCchanged = false;
	var tmpCurrencyVal = 0;
	var tmpBTCValue = 0;
	var numOfExchanges = 4.0;

	try {
		debugisBTCchanged = false;
		tmpCurrencyVal = 0;

		// get the value of BTC from the specified exchanges...
		coinbaseObj = (await server_methods_BTCUSD.HTTPCoinbaseRequestJSON()).data;
		tmpCurrencyVal += parseFloat(coinbaseObj.price);

		krakenObj = (await server_methods_BTCUSD.HTTPKrakenRequestJSON()).data;
		tmpCurrencyVal += parseFloat(krakenObj.result.XXBTZUSD.a[0]);

		bitfinexObj = (await server_methods_BTCUSD.HTTPBitfinexRequestJSON()).data;
		tmpCurrencyVal += parseFloat(bitfinexObj[0][1].toString());

		binanceObj = (await server_methods_BTCUSD.HTTPBinanceRequestJSON()).data;
		tmpCurrencyVal += parseFloat(binanceObj.price);

		tmpBTCValue = (tmpCurrencyVal / numOfExchanges); // compute the average value of BTC among the N selected exchanges.

		// store the new computed value on this ws
		if (!hasBTCbeenInitialize) {
			hasBTCbeenInitialize = true;
			ourBTCValue = tmpBTCValue; // first initialization of the variable on the server
			debugisBTCchanged = true;
		}
		else {
			if (!((ourBTCValue - rangeBTC) < tmpBTCValue && (ourBTCValue + rangeBTC) > tmpBTCValue)) {	
				// if true, the computed value is considered different from the one already stored in the variable "ourBTCValue"
				ourBTCValue = tmpBTCValue;
				debugisBTCchanged = true;
			}
		}
		return debugisBTCchanged;
	}
	catch (error) {
		// an unexpected error occours during the process, notify the caller.
		console.error(error);
		return false;
	}


}

/*
 *  This function compute the ETH price using the APIs defined in "server_methods_ETHUSD.js"
 */
async function getPriceETH() {

	var debugisETHchanged = false;
	var tmpCurrencyVal = 0;
	var tmpETHValue = 0;
	var numOfExchanges = 4.0;

	try {
		debugisETHchanged = false;
		tmpCurrencyVal = 0;

		// get the value of ETH from the specified exchanges...
		coinbaseObj = (await server_methods_ETHUSD.HTTPCoinbaseRequestJSON()).data;
		tmpCurrencyVal += parseFloat(coinbaseObj.price);

		krakenObj = (await server_methods_ETHUSD.HTTPKrakenRequestJSON()).data;
		tmpCurrencyVal += parseFloat(krakenObj.result.XETHZUSD.a[0]);

		bitfinexObj = (await server_methods_ETHUSD.HTTPBitfinexRequestJSON()).data;
		tmpCurrencyVal += parseFloat(bitfinexObj[0][1].toString());

		binanceObj = (await server_methods_ETHUSD.HTTPBinanceRequestJSON()).data;
		tmpCurrencyVal += parseFloat(binanceObj.price);

		tmpETHValue = (tmpCurrencyVal / numOfExchanges); // compute the average value of ETH among the N selected exchanges.

		// store the new computed value on this ws
		if (!hasETHbeenInitialize) {
			hasETHbeenInitialize = true;
			ourETHValue = tmpETHValue; // first initialization of the variable on the server
			debugisETHchanged = true;
		}
		else {
			if (!((ourETHValue - rangeETH) < tmpETHValue && (ourETHValue + rangeETH) > tmpETHValue)) {	
				// if true, the computed value is considered different from the one already stored in the variable "ourETHValue"
				ourETHValue = tmpETHValue;
				debugisETHchanged = true;
			}
		}
		return debugisETHchanged;
	}
	catch (error) {
		// an unexpected error occours during the process, notify the caller.
		console.error(error);
		return false;
	}
}

/*
 * This function keeps up-to-date the values of BTC and ETH.
 */ 
function updateCurrency() { 

	try {
		// step 1: get the latest value of BTC
		getPriceBTC()
			.then((resIsBTCChanged) => { 
				// step 2: if the value is different from the one already stored on this ws ...
				if (resIsBTCChanged) { 
					// ... then notify the ws "database".
					organizeDataToBeSendAndSend(true, false);
				}
			});

		// step 1: get the latest value of BTC
		getPriceETH()
			.then((resIsETHChanged) => {
				// step 2: if the value is different from the one already stored on this ws ...
				if (resIsETHChanged) {
					// ... then notify the ws "database".
					organizeDataToBeSendAndSend(false, true);
				}
			});
	}
	catch (error) {
		// an unexpected error occours during the process, notify the caller.
		console.log("[updateCurrency] " + error);
	}
}

/*
 * Based on the parameters received, this function create the object with the data to be sent to the ws "database".
 */ 
async function organizeDataToBeSendAndSend(_isBTCChanged, _isETHChanged) {
	try {
		var tmpObj = "";
		if(_isBTCChanged == true && _isETHChanged == false) 
		{
			// step 1: create the object with the data to send
			tmpObj = querystring.stringify({
				BTCUSD: ourBTCValue			// last stored value for BTC
			});
		}
		if(_isETHChanged == true && _isBTCChanged == false) 
		{
			// step 1: create the object with the data to send
			tmpObj = querystring.stringify({
				ETHUSD: ourETHValue			// last stored value for ETH
			});
		}

		if(tmpObj != "")
		{
			// step 2: send the data to the ws "database".
			var resultOBJ = (await axios.post(app_domain + '/database/price', tmpObj));
			if(resultOBJ.data.BTCUSD == undefined && resultOBJ.data.ETHUSD == undefined)
				console.log("No data received back from the database.");
			else 
			{	// ... called to ws database has been performed correctly.
	
				// step 3: notify the ws "plannedaction" in order to check if there are triggers that need to be executed.
				var result_paws = (await axios.post(app_domain + '/plannedaction/checkTriggers', resultOBJ.data));

				if(result_paws.data.status.length > 0) 
				{	// ws "plannedaction" generated an error
					console.log("Error: " + result_paws.data.status);
				}
			}

		}
		else {
			console.log("ETH and BTC haven't changed. No need to called ws 'database' or 'plannedaction'");
		}
	}
	catch (error) {
		// an unexpected error occours during the process.
		console.log(error);
	}
}

/////////////////////////////////////////
// WS INITIALIZATION
/////////////////////////////////////////
/*
 * Inizialize the JOB SCHEDULER that updates the currencies values every 10 seconds.
 */
var j = schedule.scheduleJob('*/10 * * * * *', function () { // execute the following code every 10 sec
  updateCurrency();
  // debug: console.log(date.format(new Date(), 'HH:mm:ss'));
});
console.log("Timer \"price\" inizialized....");

// EXPORT router to be used in the main file
module.exports = router;