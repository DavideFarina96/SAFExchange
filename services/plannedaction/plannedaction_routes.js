var express = require('express');
var path = require('path');
var router = express.Router();
const axios = require('axios');

//////////////////////////////////////////////////////////////////////////////
// VARIABLES DECLARATIONS:
var debugObjectArray = [] // used to store the data received from the server_price ws
//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
//
// ROUTING SETUP
//
// Defines the /price API, which is used from pricews for saving the new value of the currencies

router.get('/user/:user_id', async function(req, res) { //user_id is the mondoDB user ID
    try {
        var actions = (await axios.get(app_domain + '/database/plannedaction/user/' + req.params.user_id)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(actions);
})

router.get('/:action_id', async function(req, res) {
    try {
        var action = (await axios.get(app_domain + '/database/plannedaction/' + req.params.action_id)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(action);
})

router.post('/', async function(req, res) {
	var _plannedaction = req.body;

    try {
        // Get user from /user -> Create if not exists
        var action = (await axios.post(app_domain + '/database/plannedaction/', _plannedaction)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(action)
})

router.delete('/:action_id', async function(req, res) {
    try {
        var action = (await axios.delete(app_domain + '/database/plannedaction/' + req.params.action_id)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(action)
})

router.post('/checkTriggers', async function (req, res) {
	var actionsPerformed = 0;
	var finalStatus = [];
	// configuration for the response
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	var last2pricesBTC;
	var last2pricesETH;

	try {
		var actions;
		try
		{
			last2pricesBTC = (await axios.get(app_domain + '/price/BTCUSD?elem_number=2')).data;
			last2pricesETH = (await axios.get(app_domain + '/price/ETHUSD?elem_number=2')).data;
		}
		catch (err) {
			console.log(err)
		}

		var btcValue = req.body.BTCUSD;
		var ethValue = req.body.ETHUSD;

	    try {
	        actions = (await axios.get(app_domain + '/database/plannedaction/all_idle')).data;

	        for(var i = 0; i < actions.length; i++)
			{
				// --------------- FOR BTC
				var mostrecent = last2pricesBTC[0].BTCUSD;
				var leastrecent = last2pricesBTC[1].BTCUSD;

				if(btcValue != undefined && actions[i].BTC != undefined)
				{
					if((actions[i].USD >= mostrecent && actions[i].USD <= leastrecent) || (actions[i].USD <= mostrecent && actions[i].USD >= leastrecent))
					{
						actionsPerformed++;

						//set plannedaction as in progress
						var action1;
						var state = {state: "IN PROGRESS"}
						try {
						    action1 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while updating the status of the planned adction to IN PROGRESS.");
						    finalStatus.push("Unexpected error while updating the status of the planned adction to IN PROGRESS.")
						    break;
						}

						//create the new balance obj
						var newBalance;
						if(actions[i].action == "BUY")
							newBalance = { BTC: actions[i].BTC }
						else if(actions[i].action == "SELL")
							newBalance = { USD: btcValue * actions[i].BTC }

						//call user to update the balances
						try {
						    var userNewBal = (await axios.put(app_domain + '/user/' + actions[i].author + '/balance', newBalance)).data;
						}
						catch (err) {
						    console.log(err);
						    console.log("Unexpected error while updating the balance of the user.");
						    finalStatus.push("Unexpected error while updating the balance of the user.")
						    break;
						}

						//add transaction completed in the db
						var transaction = {
							action: actions[i].action,
							author: actions[i].author,
							BTC: actions[i].BTC,
							USD: btcValue * actions[i].BTC 
						}

						try {
						    var transactionComp = (await axios.post(app_domain + '/transaction', transaction)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while adding the transaction to the database.");
						    finalStatus.push("Unexpected error while adding the transaction to the database.")
						}

						//set plannedaction as complete
						var action2;
						state = {state: "COMPLETED"}
						try {
						    action2 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while updating the status of the planned adction to COMPLETED.");
						    finalStatus.push("Unexpected error while updating the status of the planned adction to COMPLETED.")
						    break;
						}

					}
				}		
				// --------------- FOR ETH
				var mostrecent = last2pricesETH[0].ETHUSD;
				var leastrecent = last2pricesETH[1].ETHUSD;
				if(ethValue != undefined && actions[i].ETH != undefined)
				{
					if((actions[i].USD >= mostrecent && actions[i].USD <= leastrecent) || (actions[i].USD <= mostrecent && actions[i].USD >= leastrecent))
					{
						actionsPerformed++;

						//set plannedaction as in progress
						var action1;
						var state = {state: "IN PROGRESS"}
						try {
						    action1 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while updating the status of the planned adction to IN PROGRESS.");
						    finalStatus.push("Unexpected error while updating the status of the planned adction to IN PROGRESS.")
						    break;
						}

						//create the new balance obj
						var newBalance;
						if(actions[i].action == "BUY")
							newBalance = { ETH: actions[i].ETH }
						else if(actions[i].action == "SELL")
							newBalance = { USD: ethValue * actions[i].ETH }

						//call user to update the balances
						try {
						    var userNewBal = (await axios.put(app_domain + '/user/' + actions[i].author + '/balance', newBalance)).data;
						}
						catch (err) {
						    console.log(err);
						    console.log("Unexpected error while updating the balance of the user.");
						    finalStatus.push("Unexpected error while updating the balance of the user.")
						    break;
						}

						//add transaction completed in the db
						var transaction = {
							action: actions[i].action,
							author: actions[i].author,
							ETH: actions[i].ETH,
							USD: ethValue * actions[i].ETH 
						}

						try {
						    var transactionComp = (await axios.post(app_domain + '/transaction', transaction)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while adding the transaction to the database.");
						    finalStatus.push("Unexpected error while adding the transaction to the database.")
						}

						//set plannedaction as complete
						var action2;
						state = {state: "COMPLETED"}
						try {
						    action2 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    console.log("Unexpected error while updating the status of the planned adction to COMPLETED.");
						    finalStatus.push("Unexpected error while updating the status of the planned adction to COMPLETED.")
						    break;
						}

					}
				}
			}
	    }
		catch (err) {
        	console.log("BLAH BLAH" + err)
    	}

		var responseObj = {status: finalStatus, actionsPerformed: actionsPerformed};
		res.send(JSON.stringify(responseObj));
	}
	catch (error) {
		res.statusCode = 400;
		res.send('{"status": "' + error + '"}');
	}
});



// EXPORT router to be used in the main file
module.exports = router;