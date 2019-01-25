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


router.post('/checkTriggers', function (req, res) {
	// configuration for the response
	res.statusCode = 200;
	res.header('Content-type', 'application/json');

	try {
		//process
		// req.body.param_name --> get the specified parameter sent through the request parameter
		console.log("WS PLANNEDACTION");
		var _receivedTime = (req.body.time); console.log("_receivedTime: " + _receivedTime);
		var _receivedisBTCchanged = (req.body.isBTCchanged); console.log("_receivedisBTCchanged: " + _receivedisBTCchanged);
		var _receivedisETHChanged = (req.body.isETHChanged); console.log("_receivedisETHChanged: " + _receivedisETHChanged);
		var _receivedBTC = (req.body.BTC); console.log("_receivedBTC: " + _receivedBTC);
		var _receivedETH = (req.body.ETH); console.log("_receivedETH: " + _receivedETH);



		// store the element in the array 
		debugObjectArray.push({
			receivedTime: _receivedTime,
			receivedisBTCchanged: _receivedisBTCchanged,
			receivedisETHChanged: _receivedisETHChanged,
			receivedBTC: _receivedBTC,
			receivedETH: _receivedETH,
		});

		/////////////
		/// do things..........
		/////////////

		res.send('{"status": "OK"}');
	}
	catch (error) {
		res.statusCode = 400;
		res.send('{"status": "' + error + '"}');
	}
});



// EXPORT router to be used in the main file
module.exports = router;