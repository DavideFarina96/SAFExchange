var express = require('express');
var path = require('path');
var http = require('http'); // used for calling external server
var querystring = require('querystring');
var app = express();
var router = express.Router();
const axios = require('axios');

////////////////////////////////////////////////////
// VARIABLES DECLARATION


//////////////////////////////////////////////////////////////////////////////
// ROUTING SETUP
var possible_routes =
	"GET \t		 /user/:id_user" + "<br>" +
	"POST \t 	 /plannedaction" + "<br>" + 
	"POST \t 	 /user";

router.get('/', function (req, res) {
	res.send(possible_routes);
});

/* WORKS
 */
router.get('/user/:user_id', async function (req, res) { 
	res.header('Content-type', 'application/json');
	
	try
	{
		// step 1: extract the ID of the user from the req
		var user_id = req.params.user_id;
		// debug: console.log(user_id);
		if(user_id != undefined)
		{
			var result = (await axios.get(app_domain + '/database/transaction/user/' + user_id)).data;
			// debug: console.log(result);
			res.json(result);
		}
		else
		{
			console.log("User_id not specified.");
			res.json({ error: "User_id not specified." });
		}
		
	}
	catch(error)
	{
		console.log("[GET /user/:user_id] " + error);
		res.json({ error: err });
	}
});

/** Defines the /buy/plannedaction API.
 *  This function receives the command from the plannedaction ws in order performe a "buy" or a "sell" action
 */
router.post('/plannedaction/', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{	
		var resp = (await transaction_plannedaction(req));
		// debug: console.log(resp);
		res.json(resp);
	}
	catch(error)
	{
		console.log(error);
		res.json({ error: error});
	}
});

/** Defines the /user API.
 *  This function receives the command from the user in order performe a "buy" or a "sell" action
 */
router.post('/user/', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{	
		var resp = (await transaction_user(req));
		// debug: console.log(resp);
		res.json(resp);
	}
	catch(error)
	{
		console.log(error);
		res.json({ error: error});
	}
	
});

//////////////////////////////////////////////////////////////////////////////
// FUNCTIONS and METHODS
async function transaction_user(req)
{
	try
	{
		var _author = req.body.author; 
		var _action =  req.body.action; 
		var _currency = req.body.currency;
		var _price = req.body.price;
		var _priceUSD = req.body.priceUSD;

		// step 1: check the price of the currency
		var serverPath = "";
		if(_currency.toUpperCase() == "BTC")
			serverPath = "/price/BTCUSD";
		if(_currency.toUpperCase() == "ETH")
			serverPath = "/price/ETHUSD";

		// step 2: get the actual value of the specified currency
		var resultPrice = (await axios.get(app_domain + serverPath)).data;

		// step 3: compare it with the value of _price specified by the the plannedaction
		var updatedValue = -1;
		if(_currency.toUpperCase() == "BTC")
			updatedValue = parseFloat(resultPrice[0].BTCUSD);
		if(_currency.toUpperCase() == "ETH")
			updatedValue = parseFloat(resultPrice[0].ETHUSD);
			
		// compare the up to date value with the one received from the ws plannedaction
		if((parseFloat(_price) > updatedValue - range) && (parseFloat(_price) < updatedValue + range)) // original: if(parseFloat(_price) == updatedValue)
		{	
			// step 4: save the transaction in the db (call /database/.... )
			var tmpDBOBJ = undefined;
			if(_currency.toUpperCase() == "BTC")
			{
				tmpDBOBJ = {
					author: _author,
					action: _action,
					USD: _priceUSD, 
					BTC: _price
				};
			}
			if(_currency.toUpperCase() == "ETH")
			{
				tmpDBOBJ = {
					author: _author,
					action: _action,
					USD: _priceUSD, 
					ETH: _price
				};
			}
			if(tmpDBOBJ != undefined)
			{
				var resultDBTransaction = (await axios.post(app_domain + '/database/transaction/', tmpDBOBJ)).data;
				// debug: console.log(resultDBTransaction);

				// step 5: it there is the value "_id" in the ws response, then proceed
				if(resultDBTransaction._id != undefined)
				{
					// set 6: update user balance by calling /user/:user_id/balance with PUT method (simulate the specified action)
					var tmpBalanceOBJ = undefined;
					if(_currency.toUpperCase() == "BTC")
					{
						tmpBalanceOBJ =  {
							_user_id: _author,
							USD: _priceUSD, 
							BTC: _price
						};
					}
					if(_currency.toUpperCase() == "ETH")
					{
						tmpBalanceOBJ =  {
							_user_id: _author,
							USD: _priceUSD, 
							ETH: _price
						};
					}

					if(tmpBalanceOBJ != undefined)
					{
						var pathBalance = "/user/"+ _author +"/balance";
						var resultUser = (await axios.put(app_domain + pathBalance, tmpBalanceOBJ)).data;
						return resultUser;
					}
					else
					{
						console.log("tmpBalanceOBJ is undefined");
						return ({ error: "tmpBalanceOBJ is undefined"});
					}
				}
				else
				{	// otherwise, an error occurred
					console.log("The call to /database/transaction/ has generated the following error: " + resultDBTransaction.errors);
					return ({ error: resultDBTransaction.errors});
				}
			}
			else
			{
				console.log("Unexpected error while creating the object for the ws database.");
				return ({ error: "Unexpected error while creating the object for the ws database."});
			}
		}
		else
		{
			console.log("Prices don't match.");
			return ({ error: "Prices don't match."});
		}
	}
	catch(error)
	{
		console.log(error);
		return ({ error: error});
	}
}

async function transaction_plannedaction(req)
{
	try
	{
		var _ID_plannedaction = req.body.plannedaction_id; 
		var _author = req.body.author;
		var _action =  req.body.action;  
		var _currency = req.body.currency; 
		var _price = req.body.price;
		var _priceUSD = req.body.priceUSD;
						

			// step 1: check the type of the currency
		var serverPath = "";
		if(_currency.toUpperCase() == "BTC")
			serverPath = "/price/BTCUSD";
		if(_currency.toUpperCase() == "ETH")
			serverPath = "/price/ETHUSD";
	

		// step 2: get the actual value of the specified currency from the ws /price
		var resultPrice = (await axios.get(app_domain + serverPath)).data; 

		// step 3: compare it with the value of _price specified by the the plannedaction
		var updatedValue = -1;
		if(_currency.toUpperCase() == "BTC")
			updatedValue = parseFloat(resultPrice[0].BTCUSD);
		if(_currency.toUpperCase() == "ETH")
			updatedValue = parseFloat(resultPrice[0].ETHUSD);
		
		// compare the up to date value with the one received from the ws plannedaction
		if((parseFloat(_price) > updatedValue - range) && (parseFloat(_price) < updatedValue + range)) // original: if(parseFloat(_price) == updatedValue)
		{	
			// step 4: the prices are equal, ask the to remove the planned action (or mark as completed) from the user's scheduled actions
			var pathDeletePlannedAction = "/plannedaction/" + _ID_plannedaction;
			var deletePlannedAction = (await axios.delete(app_domain + pathDeletePlannedAction)).data;

			// let's check that the "delete" has worked correctly
			try	
			{
				var state = deletePlannedAction.state;
				if(state.toUpperCase() == "CANCELED")
				{
					// step 5: save the transaction in the db (call /database/.... )
					var tmpDBOBJ = undefined;
					if(_currency.toUpperCase() == "BTC")
					{
						tmpDBOBJ = {
							author: _author,
							action: _action,
							USD: _priceUSD, 
							BTC: _price
						};
					}
					if(_currency.toUpperCase() == "ETH")
					{
						tmpDBOBJ = {
							author: _author,
							action: _action,
							USD: _priceUSD, 
							ETH: _price
						};
					}
					if(tmpDBOBJ != undefined)
					{
						var resultDBTransaction = (await axios.post(app_domain + '/database/transaction/', tmpDBOBJ)).data;
						
						// step 6: it there is the value "_id" in the ws response, then proceed
						if(resultDBTransaction._id != undefined)
						{

							// set 6: update user balance by calling /user/:user_id/balance with PUT method (simulate the specified action)
							var tmpBalanceOBJ = undefined;
							
							if(_currency.toUpperCase() == "BTC")
							{
								tmpBalanceOBJ =  {
									_user_id: _author,
									USD: _priceUSD, 
									BTC: _price
								};
							}
							if(_currency.toUpperCase() == "ETH")
							{
								tmpBalanceOBJ =  {
									_user_id: _author,
									USD: _priceUSD, 
									ETH: _price
								};
							}

							if(tmpBalanceOBJ != undefined)
							{
								var pathBalance = "/user/"+ _author +"/balance";
								var resultUser = (await axios.put(app_domain + pathBalance, tmpDBOBJ)).data;
								return resultUser;
							}
							else
							{
								console.log("tmpBalanceOBJ is undefined");
								return ({ error: "tmpBalanceOBJ is undefined"});
							}
						}
						else
						{	// otherwise, an error occurred
							console.log("The call to /database/transaction/ has generated the following error: " + resultDBTransaction);
							return ({ error: "The call to /database/transaction/ has generated the following error: " + resultDBTransaction});
						}

					}
					else
					{
						console.log("Unexpected error while creating the object for the ws database.");
						return ({ error: "Unexpected error while creating the object for the ws database."});
					}
				}
				else
				{
					console.log("Error: can't perform the operation 'DELETE' on the specific planned action.");
					return ({ error: "Error: can't perform the operation 'DELETE' on the specific planned action."});
				}
			}
			catch(error)
			{
				console.log("Unexpected error while performing the 'DELETE' of the planned action.");
				return ({ error: error});
			}
		}
		else
		{
			console.log("Prices don't match.");
			return ({ error: "Prices don't match."});
		}
	}
	catch(error)
	{
		console.log(error);
		return ({ error: error});
	}
}

//////////////////////////////////////////////////////////////////////////////
// EXPORT router to be used in the main file
module.exports = router;