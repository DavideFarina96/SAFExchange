var express = require('express');
var path = require('path');
var http = require('http'); 				// used for calling external server
var querystring = require('querystring');
var date = require('date-and-time');
var schedule = require('node-schedule');   // scheduler used for automatically call a specific function every N secs
var router = express.Router();
const axios = require('axios');

// here is where the methods for get the exchange value are implemented
const server_methods_BTCUSD = require('./server/server_methods_BTCUSD');
const server_methods_ETHUSD = require('./server/server_methods_ETHUSD');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var coinbaseObj, krakenObj, bitfinexObj, binanceObj; //logic variables
var ourBTCValue = 0, ourETHValue = 0; // value BTC -> USD and ETH -> USD for buying and selling on SAFEx
const rangeBTC = 0.1, rangeETH = 0.009; // the last computed value of BTC is different from the one saved on the db if it's outside the db value +- range

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
router.get('/prices', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{
		var result = (await axios.get(app_domain + '/database/price')).data;
		//console.log(result);
		res.json(result);
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
router.get('/BTCUSD', async function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the user send the param "num"
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null || isNaN(parseFloat(lastestNvalues)) || parseFloat(lastestNvalues) < 1)
		{	// user is asking for the lastest value
			lastestNvalues = 1;
		}
		
		var result = (await axios.get(app_domain + '/database/price/BTCUSD?elem_number=' + lastestNvalues)).data;
		res.json(result);
		
	}
	catch(error)
	{
		console.log("[GET /BTCUSD] " + error);
		res.json({error: error});
	}
});

/** Defines the /ETHUSD API.
 *  This function can be used by the client to get the value of the BTC from the database, as a json object.
 */
router.get('/ETHUSD', async function (req, res) {   
	res.header('Content-type', 'application/json');

	try
	{
		// step 1: check if the user send the param "num"
		var lastestNvalues = req.query.elem_number;
		if(lastestNvalues == undefined || lastestNvalues == null || isNaN(parseFloat(lastestNvalues)) || parseFloat(lastestNvalues) < 1)
		{	// user is asking for the lastest value
			lastestNvalues = 1;
		}
		
		var result = (await axios.get(app_domain + '/database/price/ETHUSD?elem_number=' + lastestNvalues)).data;
		res.json(result);

	}
	catch(error)
	{
		console.log("[GET /ETHUSD] " + error);
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
async function organizeDataToBeSendAndSend(_isBTCChanged, _isETHChanged) {
	try {
		var tmpObj = "";
		//console.log("_isBTCChanged: " + _isBTCChanged + " _isETHChanged: " + _isETHChanged);
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

		if(tmpObj != "")
		{

			var resultOBJ = (await axios.post(app_domain + '/database/price', tmpObj));
			if(resultOBJ.data.BTCUSD == undefined && resultOBJ.data.ETHUSD == undefined)
				console.log("[organizeDataToBeSendAndSend] No data received from the database.");
			else {
				// debug: console.log(resultOBJ.data);

				var result_paws = (await axios.post(app_domain + '/plannedaction/checkTriggers', tmpObj));
				console.log("[organizeDataToBeSendAndSend] " + result_paws.data.status);
			}

		}
		else
		console.log("[organizeDataToBeSendAndSend] ETH and BTC haven't changed.");
	}
	catch (error) {
		console.log("[organizeDataToBeSendAndSend] " + error);
	}
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