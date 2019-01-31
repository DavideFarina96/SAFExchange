var express = require('express');
router = express.Router();

const axios = require('axios')


// User
router.get('/user/:user_id', async function (req, res) {
    var _user_id = req.params.user_id;
    console.log("Received request for user", _user_id)

    var user = (await axios.get(app_domain + '/user/' + _user_id)).data;

    res.json(user);
});

// Price
router.get('/price', async function (req, res) {
    console.log("Received request for current prices")

    var prices = (await axios.get(app_domain + '/price')).data;

    res.json(prices);
});

router.get('/price/BTCUSD', async function (req, res) {
    var _elem_number = req.query.elem_number;

    console.log("Received request for BTCUSD history", _elem_number)

    var price_history = (await axios.get(app_domain + '/price/BTCUSD?elem_number=' + _elem_number)).data;

    res.json(price_history);
});

router.get('/price/ETHUSD', async function (req, res) {
    var _elem_number = req.query.elem_number;

    console.log("Received request for ETHUSD history", _elem_number)

    var price_history = (await axios.get(app_domain + '/price/ETHUSD?elem_number=' + _elem_number)).data;

    res.json(price_history);
});

// Transaction
router.get('/transaction/user/:user_id', async function (req, res) {
    var _user_id = req.params.user_id;

    console.log("Received request for transaction list", _user_id)

    var transaction_list = (await axios.get(app_domain + '/transaction/user/' + _user_id)).data;

    res.json(transaction_list);
});

// Plannedaction
router.get('/plannedaction/user/:user_id', async function (req, res) {
    var _user_id = req.params.user_id;

    console.log("Received request for plannedaction list", _user_id)

    var plannedaction_list = (await axios.get(app_domain + '/plannedaction/user/' + _user_id)).data;

    res.json(plannedaction_list);
});


// EXPORT
module.exports.router = router;