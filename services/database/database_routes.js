var express = require('express');
router = express.Router();

var mongoose = require('mongoose');                     // mongoose for mongodb
require('./schemas.js');								// create the models for the objs

// URL on which the DB is stored
var db_path = 'mongodb://administrator:admin_obv1@ds163164.mlab.com:63164/safexchangedb';


// MONGOOSE
mongoose.connect(db_path,
	function (err) {
		if (err)
			console.log("DB error: " + err);
		else
			console.log("Connected to db");
	});     // connect to mongoDB database

// SCHEMAS
var User = mongoose.model('users');
var Price = mongoose.model('prices');
var Transaction = mongoose.model('transactions');
var PlannedAction = mongoose.model('plannedactions');

/*
	GET		/user
			/user/BTC
			/user/ETH
			/user/USD
	POST 	/user
	PUT 	/user/balance

	GET 	/price
	POST 	/price
	
	GET		/transaction
	POST 	/transaction
	
	GET		/plannedaction
	POST 	/plannedaction
	DELETE	/plannedaction/:id
*/

// USER ROUTES //////////////////////////////////////////////////////////////////////////////
router.put('/user/id_google', function (req, res) {
	var _user = req.body

	// Updates data such as image_url and name or create new. Return user.
	User.findOneAndUpdate({ id_google: _user.id_google }, _user, { upsert: true, new: true }, function (err, user) {
		if (err) res.send(err);

		res.json(user);
	});
});

router.put('/user/id_facebook', function (req, res) {
	var _user = req.body

	// Updates data such as image_url and name or create new. Return user.
	User.findOneAndUpdate({ id_facebook: _user.id_facebook }, _user, { upsert: true, new: true }, function (err, user) {
		if (err) res.send(err);

		res.json(user);
	});
});

router.post('/user/mail', function (req, res) {
	var _user = req.body

	_user.email = _user.email.toLowerCase();

	// Create the user
	User.create(_user, function (err, user) {
		if (err) res.send(err);

		res.json(user);
	});
});

router.get('/user/mail/:mail', function (req, res) {
	email = req.params.mail.toLowerCase();

	// Find the user registered with the email only (no google and fb) and is the same as the param
	User.findOne({ "id_google": { "$exists": false }, "id_facebook": { "$exists": false }, "email": email }, function (err, user) {
		if (err) res.send(err);
		res.json(user);
	});
})

router.get('/user/:user_id', function (req, res) {
	// Given the _id, return the corresponding user
	User.findById(req.params.user_id, function (err, user) {
		if (err) res.send(err);
		res.json(user);
	});
});

router.get('/user/:user_id/:currency', function (req, res) {
	// Get the amount of a single currency for a certain user
	User.findById(req.params.user_id, function (err, user) {
		if (err) res.send(err);

		var currency = req.params.currency;
		switch (currency) {
			case "USD":
			case "usd": res.json(user.USD); break;

			case "BTC":
			case "btc": res.json(user.BTC); break;

			case "ETH":
			case "eth": res.json(user.ETH); break;
		}
	});
});

router.put('/user/:user_id/balance', function (req, res) {
	// Update user balance
	var _user_id = req.params.user_id;
	var _balance = {}

	// Make sure only USD, BTC, and ETH field can be edited
	if (req.body.hasOwnProperty('USD'))
		_balance.USD = req.body.USD;
	if (req.body.hasOwnProperty('BTC'))
		_balance.BTC = req.body.BTC;
	if (req.body.hasOwnProperty('ETH'))
		_balance.ETH = req.body.ETH;

	User.findByIdAndUpdate(_user_id, { $set: _balance }, { new: true }, function (err, user) {
		if (err) res.send(err);

		res.json(user);
	});
});

router.post('/user', function (req, res) {
	// Get user params
	var _user = req.body;

	// Create a user with the object received
	User.create(_user, function (err, user) {
		if (err) return res.send(err);

		console.log("New user created");
		res.json(user);
	});
});


// PRICE ROUTES /////////////////////////////////////////////////////////////////////////////
// Defines the /price API, which is used from price ws for saving the new value of the currencies
router.get('/price', async function (req, res) {
	var _price = {};

	try {
		// Get the last prices for both BTC and ETH and send them
		_price.BTC = (await Price.findOne({ BTCUSD: { $exists: true } }, 'BTCUSD', { sort: { '_id': -1 } }));
		_price.ETH = (await Price.findOne({ ETHUSD: { $exists: true } }, 'ETHUSD', { sort: { '_id': -1 } }));

		console.log("Last read price", "BTCUSD: ", _price.BTC.BTCUSD, "ETHUSD: " + _price.ETH.ETHUSD)
		res.json(_price);
	}
	catch (err) {
		console.log("Error")
		res.send(err);
	}
});

router.get('/price/BTCUSD', async function (req, res) {
	var _elem_number = parseInt(req.query.elem_number);

	var _prices = [];

	try {
		// Get the last prices for BTC and send it
		_prices = (await Price.find({ BTCUSD: { $exists: true } }, 'BTCUSD',
			{ sort: { '_id': -1 }, limit: _elem_number }));

		console.log("Read last " + _elem_number + " BTCUSD prices")
		res.json(_prices);
	}
	catch (err) {
		console.log("Error")
		res.send(err);
	}
});

router.get('/price/ETHUSD', async function (req, res) {
	var _elem_number = parseInt(req.query.elem_number);

	var _prices = [];

	try {
		// Get the last prices for ETH and send it
		_prices = (await Price.find({ ETHUSD: { $exists: true } }, 'ETHUSD',
			{ sort: { '_id': -1 }, limit: _elem_number }));

		console.log("Read last " + _elem_number + " ETHUSD prices")
		res.json(_prices);
	}
	catch (err) {
		console.log("Error")
		res.send(err);
	}
});

router.post('/price', function (req, res) {
	// Insert a new price in DB
	var _price = req.body;

	Price.create(_price, function (err, price) {
		if (err) return res.send(err);

		console.log("New price inserted: " + price);
		res.json(price);
	});
});


// TRANSACTION ROUTES //////////////////////////////////////////////////////////////////////
router.get('/transaction/:transaction_id', function (req, res) {
	var _transaction_id = req.params.transaction_id;

	// Return transaction corresponding to the provided _id
	Transaction.findById(_transaction_id, function (err, transaction) {
		if (err) return res.send(err);

		res.json(transaction);
	});
});

router.get('/transaction/user/:user_id', function (req, res) {
	var _user_id = req.params.user_id;

	// Return all transaction of a user identified by its _id
	Transaction.find({ author: _user_id }, function (err, transactions) {
		if (err) return res.send(err);

		res.json(transactions);
	});
});

router.post('/transaction', function (req, res) {
	// Insert a new transaction in DB
	var _transaction = req.body;

	var _has_USD_field = _transaction.hasOwnProperty('USD');
	var _has_BTC_field = _transaction.hasOwnProperty('BTC');
	var _has_ETH_field = _transaction.hasOwnProperty('ETH');

	// XOR operand. Transaction can contain (USD and BTC) XOR (USD and ETH)
	if (_has_USD_field && ((_has_BTC_field && !_has_ETH_field) || (!_has_BTC_field && _has_ETH_field))) {
		Transaction.create(_transaction, function (err, transaction) {
			if (err) return res.send(err);

			res.json(transaction);
		});
	}
	else {
		console.log("Error! Wrong data");
		res.json({ message: "Error! The body request should contain either the field BTC or ETH (exclusively)" });
	}
});


// PLANNEDACTION ROUTES ///////////////////////////////////////////////////////////////////
router.get('/plannedaction/:plannedaction_id', function (req, res) {
	var _plannedaction_id = req.params.plannedaction_id;

	// Get all planned actions in idle (used to check if some planned action should be triggered)
	if (_plannedaction_id == "all_idle") {
		PlannedAction.find({ state: "IDLE" }, function (err, plannedactions) {
			if (err) return res.send(err);

			res.json(plannedactions);
		});
	}
	// Return the planned action with the provided _id
	else {
		PlannedAction.findById(_plannedaction_id, function (err, plannedaction) {
			if (err) return res.send(err);

			res.json(plannedaction);
		});
	}
});

router.put('/plannedaction/:plannedaction_id', function (req, res) {
	var _plannedaction_id = req.params.plannedaction_id;
	var newState = req.body.state;

	// Update the state of a planned action
	PlannedAction.findByIdAndUpdate(_plannedaction_id, { $set: { state: newState } }, { new: true }, function (err, plannedaction) {
		if (err) return res.send(err);

		res.json(plannedaction);
	});
});

router.get('/plannedaction/user/:user_id', function (req, res) {
	var _user_id = req.params.user_id;

	// Return all planned actions of a user
	PlannedAction.find({ author: _user_id }, function (err, plannedactions) {
		if (err) return res.send(err);

		res.json(plannedactions);
	});
});

router.post('/plannedaction', function (req, res) {
	// Insert new planned action in DB
	var _plannedaction = req.body;

	var _has_USD_field = _plannedaction.hasOwnProperty('USD');
	var _has_BTC_field = _plannedaction.hasOwnProperty('BTC');
	var _has_ETH_field = _plannedaction.hasOwnProperty('ETH');

	// XOR operand. Planned action can contain (USD and BTC) XOR (USD and ETH)
	if (_has_USD_field && ((_has_BTC_field && !_has_ETH_field) || (!_has_BTC_field && _has_ETH_field))) {
		PlannedAction.create(_plannedaction, function (err, plannedaction) {
			if (err) return res.send(err);

			console.log("New plannedaction inserted");
			res.json(plannedaction);
		});
	}
	else {
		console.log("Error! Wrong data");
		res.json({ message: "Error! The body request should contain either the fields USD and BTC or ETH (exclusively)" });
	}
});

router.delete('/plannedaction/:plannedaction_id', function (req, res) {
	var _plannedaction_id = req.params.plannedaction_id;

	// The planned action is not actually deleted but its state set to CANCELED
	PlannedAction.findByIdAndUpdate(_plannedaction_id, { $set: { state: 'CANCELED' } }, { new: true },
		function (err, plannedaction) {
			if (err) res.send(plannedaction);

			res.json(plannedaction);
		});
});



// EXPORT router to be used in the main file
module.exports = router;