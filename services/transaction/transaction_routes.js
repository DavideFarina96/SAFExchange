var express = require('express');
var router = express.Router();
const axios = require('axios');
//var path = require('path');
//var querystring = require('querystring');
//var app = express();

var range = 1; // used to check if the price of the "plannedaction" and the "user action" is close enough to the price received from the ws transaction.
var possible_routes =
	"GET \t		 /user/:id_user" + "<br>" +
	"POST \t 	 /plannedaction -> this path can be used from the ws 'plannedaction', either for selling or buying both BTC and ETH " + "<br>" + 
	"POST \t 	 /user -> this path can be used from the ws 'user', either for selling or buying both BTC and ETH";

/////////////////////////////////////////
// ROUTING SETUP
/////////////////////////////////////////
/* 
 * DEFAULT ROUTER: return the list of available actions for this specific ws.
 */
router.get('/', function (req, res) {
	res.send(possible_routes);
});

/* 
 *	This router takes the ID of the user and returns the entire history of transactions performed by the user.
 */
router.get('/user/:user_id', async function (req, res) { 
	res.header('Content-type', 'application/json');
	
	try
	{
		// step 1: extract the ID of the user from the request.
		var user_id = req.params.user_id;

		if(user_id != undefined)
		{	
			// step 2: once we got the ID, let's call the ws "database" in order to retrieve user's transactions history.
			var result = (await axios.get(app_domain + '/database/transaction/user/' + user_id)).data;
			
			// step 3: return the data obtained from the ws "database", to the caller.
			res.json(result);
		}
		else
		{
			// the user_id has not been specified, send the error to the caller.
			console.log("User_id not specified.");
			res.json({ error: "User_id not specified." });
		}
		
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[GET /user/:user_id] " + error);
		res.json({ error: error });
	}
});

/* 
 *	This router receives the command from the ws "plannedaction" and performs a "buy" or a "sell" action, depending on what is specified in the "action" parameter of the request.
 */
router.post('/plannedaction/', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{	
		// called the transaction_plannedaction function in order to perform the "buy/sell" operation.
		var resp = (await transaction_plannedaction(req));
		// return a feedback to the caller.
		res.json(resp);
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[POST /plannedaction] " + error);
		res.json({ error: error});
	}
});

/* 
 *	This router receives the command from the ws "user" and performs a "buy" or a "sell" action, depending on what is specified in the "action" parameter of the request.
 */
router.post('/', async function (req, res) { 

	var _transaction = req.body

    try {
        var transaction = (await axios.post(app_domain + '/database/transaction', _transaction)).data;
    }
    catch (err) {
        console.log(err)
    }
    
    res.json(transaction);
	
});

/* router.post('/user/', async function (req, res) { 
	res.header('Content-type', 'application/json');

	try
	{	
		// called the transaction_plannedaction function in order to perform the "buy/sell" operation.
		var resp = (await transaction_user(req));
		// return a feedback to the caller.
		res.json(resp);
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log("[POST /user] " + error);
		res.json({ error: error});
	}
	
}); */

/////////////////////////////////////////
// FUNCTIONS and METHODS
/////////////////////////////////////////
/*
 * This function take the parameters received from the ws "user" and perfoms a transaction.
 */
async function transaction_user(req)
{
	try
	{
		// Extract the data sent from the ws "user".
		var _author = req.body.author; 
		var _action =  req.body.action; 
		var _currency = req.body.currency;
		var _price = req.body.price;
		var _priceUSD = req.body.priceUSD;

		// step 1: check which currency the user is going to "buy/sell".
		var serverPath = "";
		if(_currency.toUpperCase() == "BTC")
			serverPath = "/price/BTCUSD";
		if(_currency.toUpperCase() == "ETH")
			serverPath = "/price/ETHUSD";

		// step 2: get the up-to-date value of the specified currency, from the ws "price".
		var resultPrice = (await axios.get(app_domain + serverPath)).data;

		// step 3: compare the value with the one specified by the ws "user" in the parameter _price.
		var updatedValue = -1;
		if(_currency.toUpperCase() == "BTC")
			updatedValue = parseFloat(resultPrice[0].BTCUSD);
		if(_currency.toUpperCase() == "ETH")
			updatedValue = parseFloat(resultPrice[0].ETHUSD);
			
		// if the up-to-date value is closed enough to the _price...
		if((parseFloat(_price) > updatedValue - range) && (parseFloat(_price) < updatedValue + range)) 
		{	// ... then we consider the _price valid.

			// create an object with the correct parameters, in order to be sent in the ws "database".
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
				// step 4: save the transaction in the ws "database" by calling the specific API.
				var resultDBTransaction = (await axios.post(app_domain + '/database/transaction/', tmpDBOBJ)).data;
				// debug: console.log(resultDBTransaction);

				// step 5: check whether if there is the value "_id" in the ws response
				if(resultDBTransaction._id != undefined)
				{	// ... parameter found, the operation has been successful.

					// create an object with the correct parameters, in order to be sent in the ws "user".
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
						// set 6: update user's balance by calling the ws "user". This step needs to simulate the specified "buy/sell" action.
						var pathBalance = "/user/"+ _author +"/balance";
						var resultUser = (await axios.put(app_domain + pathBalance, tmpBalanceOBJ)).data;
						return resultUser;
					}
					else
					{
						// the creation of the object has generated an error.
						console.log("Unexpected error while creating the object for the ws 'user'.");
						return ({ error: "Unexpected error while creating the object for the ws 'user'."});
					}
				}
				else
				{	// ... parameter not found, an error occurred.
					console.log("The call to /database/transaction/ has generated the following error: " + resultDBTransaction.errors);
					return ({ error: resultDBTransaction.errors});
				}
			}
			else
			{
				// the creation of the object has generated an error.
				console.log("Unexpected error while creating the object for the ws 'database'.");
				return ({ error: "Unexpected error while creating the object for the ws 'database'."});
			}
		}
		else
		{	// ... otherwise, the values are considered different and thus we notify the caller.
			console.log("Prices don't match.");
			return ({ error: "Prices don't match."});
		}
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log(error);
		return ({ error: error});
	}
}

async function transaction_plannedaction(req)
{
	try
	{
		// Extract the data sent from the ws "user".
		var _ID_plannedaction = req.body.plannedaction_id; 
		var _author = req.body.author;
		var _action =  req.body.action;  
		var _currency = req.body.currency; 
		var _price = req.body.price;
		var _priceUSD = req.body.priceUSD;
						

		// step 1: check which currency the user is going to "buy/sell".
		var serverPath = "";
		if(_currency.toUpperCase() == "BTC")
			serverPath = "/price/BTCUSD";
		if(_currency.toUpperCase() == "ETH")
			serverPath = "/price/ETHUSD";
	

		// step 2: get the up-to-date value of the specified currency, from the ws "price".
		var resultPrice = (await axios.get(app_domain + serverPath)).data; 

		// step 3: compare the value with the one specified by the ws "user" in the parameter _price.
		var updatedValue = -1;
		if(_currency.toUpperCase() == "BTC")
			updatedValue = parseFloat(resultPrice[0].BTCUSD);
		if(_currency.toUpperCase() == "ETH")
			updatedValue = parseFloat(resultPrice[0].ETHUSD);
		
		// if the up-to-date value is closed enough to the _price...
		if((parseFloat(_price) > updatedValue - range) && (parseFloat(_price) < updatedValue + range)) 
		{	
			// step 4: the prices are equal, ask the to remove the planned action (in other words, mark it as completed) from the user's scheduled actions.
			var pathDeletePlannedAction = "/plannedaction/" + _ID_plannedaction;
			var deletePlannedAction = (await axios.delete(app_domain + pathDeletePlannedAction)).data;

			try	
			{
				// let's check if the "delete" has worked correctly ...
				var state = deletePlannedAction.state;
				if(state.toUpperCase() == "CANCELED")
				{	// ... the planned action has been correctly marked as completed.

					// create an object with the correct parameters, in order to be sent in the ws "database".
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
						// step 5: save the transaction in the ws "database" by calling the specific API.
						var resultDBTransaction = (await axios.post(app_domain + '/database/transaction/', tmpDBOBJ)).data;
						
						// step 6:  check whether if there is the value "_id" in the ws response
						if(resultDBTransaction._id != undefined)
						{	// ... parameter found, the operation has been successful.

							//  create an object with the correct parameters, in order to be sent in the ws "user".
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
								// step 7: update user's balance by calling the ws "user". This step needs to simulate the specified "buy/sell" action.
								var pathBalance = "/user/"+ _author +"/balance";
								var resultUser = (await axios.put(app_domain + pathBalance, tmpDBOBJ)).data;
								return resultUser;
							}
							else
							{
								// the creation of the object has generated an error.
								console.log("Unexpected error while creating the object for the ws 'user'.");
								return ({ error: "Unexpected error while creating the object for the ws 'user'."});
							}
						}
						else
						{	// otherwise, an error occurred
							// ... parameter not found, an error occurred.
							console.log("The call to /database/transaction/ has generated the following error: " + resultDBTransaction.errors);
							return ({ error: resultDBTransaction.errors});
						}

					}
					else
					{
						// the creation of the object has generated an error.
						console.log("Unexpected error while creating the object for the ws 'database'.");
						return ({ error: "Unexpected error while creating the object for the ws 'database'."});
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
			// ... otherwise, the values are considered different and thus we notify the caller.
			console.log("Prices don't match.");
			return ({ error: "Prices don't match."});
		}
	}
	catch(error)
	{
		// an unexpected error occours during the process, notify the caller.
		console.log(error);
		return ({ error: error});
	}
}

//////////////////////////////////////////////////////////////////////////////
// EXPORT router to be used in the main file
module.exports = router;