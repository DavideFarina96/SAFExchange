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

	try {
		var actions;
		var btcValue = req.body.BTCUSD;
		var ethValue = req.body.ETHUSD;
		console.log(btcValue)
		console.log(ethValue)

	    try {
	        actions = (await axios.get(app_domain + '/database/plannedaction/all_idle')).data;

	        for(var i = 0; i < actions.length; i++)
			{
				console.log("------" + i)
				console.log(actions[i])
				console.log(">")
				// --------------- FOR BTC
				if(btcValue != undefined && actions[i].BTC != undefined)
				{
					if(actions[i].USD > btcValue * 0.99 && actions[i].USD < btcValue * 1.01)
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
						    finalStatus.push("ERR1")
						    break;
						}

						//get the current user balance so that you can update it
						var user;
						try {
						    user = (await axios.get(app_domain + '/user/' + actions[i].author)).data;
						    
						}
						catch (err) {
						    console.log(err);
						    finalStatus.push("ERR2")
						    break;
						}
						console.log(user)
						//create the new balance obj
						var newBalance;
						if(actions[i].action == "BUY")
							newBalance = { USD: user.USD, BTC: user.BTC + actions[i].BTC, ETH: user.ETH }
						else if(actions[i].action == "SELL")
							newBalance = { USD: user.USD + actions[i].USD * actions[i].BTC, BTC: user.BTC, ETH: user.ETH }

						//call user to update the balances
						try {
						    var userNewBal = (await axios.put(app_domain + '/user/' + actions[i].author + '/balance', newBalance)).data;
						}
						catch (err) {
						    console.log(err);
						    finalStatus.push("ERR3")
						    break;
						}

						//set plannedaction as complete
						var action2;
						state = {state: "COMPLETED"}
						try {
						    action2 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    finalStatus.push("ERR4")
						    break;
						}

					}
				}		
				// --------------- FOR ETH
				if(ethValue != undefined && actions[i].ETH != undefined)
				{
					if(actions[i].USD > ethValue * 0.99 && actions[i].USD < ethValue * 1.01)
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
						    finalStatus.push("ERR5")
						    break;
						}

						//get the current user balance so that you can update it
						var user;
						try {
						    user = (await axios.get(app_domain + '/user/' + actions[i].author)).data;
						    console.log(app_domain + '/user/' + actions[i].author)
						    console.log(user)
						}
						catch (err) {
						    console.log(err);
						    finalStatus.push("ERR6")
						    break;
						}

						//create the new balance obj
						var newBalance;
						if(actions[i].action == "BUY")
							newBalance = { USD: user.USD, BTC: user.BTC, ETH: user.ETH + actions[i].ETH }
						else if(actions[i].action == "SELL")
							newBalance = { USD: user.USD + actions[i].USD * actions[i].ETH, BTC: user.BTC, ETH: user.ETH }

						//call user to update the balances
						try {
						    var userNewBal = (await axios.put(app_domain + '/user/' + actions[i].author + '/balance', newBalance)).data;
						}
						catch (err) {
						    console.log(err);
						    finalStatus.push("ERR7")
						    break;
						}

						//set plannedaction as complete
						var action2;
						state = {state: "COMPLETED"}
						try {
						    action2 = (await axios.put(app_domain + '/database/plannedaction/' + actions[i]._id, state)).data;
						}
						catch (err) {
						    console.log(err)
						    finalStatus.push("ERR8")
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