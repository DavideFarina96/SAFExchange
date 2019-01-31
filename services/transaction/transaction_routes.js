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
router.get('/API', function (req, res) {
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
 *	This router receives the command from the ws "user" and performs a "buy" or a "sell" action, depending on what is specified in the "action" parameter of the request.
 */
router.post('/', async function (req, res) { 

	var _transaction = req.body;

    try {
        var transaction = (await axios.post(app_domain + '/database/transaction', _transaction)).data;
    }
    catch (err) {
        console.log(err)
    }
    
    res.json(transaction);
	
});

//////////////////////////////////////////////////////////////////////////////
// EXPORT router to be used in the main file
module.exports = router;