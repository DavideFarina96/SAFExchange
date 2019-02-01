var express = require('express');
router = express.Router();

const axios = require('axios')


//PROCESS ROUTES /////////////////////////////////////////////////////
var err_user_session = 'User session variable not set'
var err_user_update = 'There was an error with the user update'
var err_transaction = 'There was an error with the transaction'
var err_plannedaction = 'There was an error with the plannedaction'
var err_not_enough_money = 'Not enough money to perform operation.'
var err_not_enough_BTC_ETH = 'Not enough BTC/ETH to perform operation.'
var success_plannedaction = 'Planned action successfully inserted'
var err_negative_amount = 'The amount must be positive'


// Buy / Sell
router.post('/buy', async function (req, res) {
    var _user = req.session.user

    var response = {}

    // Check if user is logged
    if (_user != null) {
        var _user_id = _user._id;
        var _currency = req.body.currency;
        var _amount = parseFloat(req.body.amount);

        if (_amount > 0) {
            try {
                // Check if user has enough money
                var user_USD_balance = (await axios.get(app_domain + '/user/' + _user_id)).data.USD
                var current_price = (await axios.get(app_domain + '/price')).data

                var _USD_total = _amount * parseFloat(current_price[_currency][_currency + 'USD'])

                if (user_USD_balance >= _USD_total) {

                    var new_transaction = {
                        author: _user_id,
                        action: 'BUY',
                        USD: _USD_total
                    }
                    var new_balance = { USD: - _USD_total }

                    new_transaction[_currency] = _amount
                    new_balance[_currency] = _amount


                    // Insert new transaction
                    var transaction = (await axios.post(app_domain + '/transaction', new_transaction)).data
                    if (transaction.hasOwnProperty("_id")) {

                        // Update user's balance
                        var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                        if (new_user.hasOwnProperty('_id')) {
                            response.successful = true
                            response.message = 'Successfully bought ' + _amount + ' ' + _currency + ' for ' + _USD_total + '$'
                        }
                        else {
                            response.successful = false
                            response.message = err_user_update
                        }
                    }
                    else {
                        response.successful = false
                        response.message = err_transaction
                    }
                }
                else {
                    response.successful = false
                    response.message = err_not_enough_money + ' Required $' + _USD_total + '. You have $' + _user.USD
                }
            }
            catch (err) {
                console.log(err)

                response.successful = false
                response.message = err.message
            }
        }
        else {
            response.successful = false
            response.message = err_negative_amount
        }
    }
    else {
        response.successful = false
        response.message = err_user_session
    }

    res.json(response);
});

router.post('/sell', async function (req, res) {
    var _user = req.session.user

    var response = {}

    if (_user != null) {
        var _user_id = _user._id;
        var _currency = req.body.currency;
        var _amount = parseFloat(req.body.amount);

        if (_amount > 0) {
            try {
                // Check if user has enough BTC/ETH to sell
                var _user_amount = (await axios.get(app_domain + '/user/' + _user_id)).data[_currency]

                if (_user_amount >= _amount) {

                    // Get current price
                    var current_price = (await axios.get(app_domain + '/price')).data

                    var new_transaction = {
                        author: _user_id,
                        action: 'SELL'
                    }
                    new_transaction[_currency] = _amount
                    new_transaction.USD = _amount * current_price[_currency][_currency + 'USD']

                    var new_balance = {}
                    new_balance[_currency] = - _amount
                    new_balance.USD = new_transaction.USD


                    // Insert new transaction
                    var transaction = (await axios.post(app_domain + '/transaction', new_transaction)).data
                    if (transaction.hasOwnProperty("_id")) {

                        // Update user's balance
                        var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                        if (new_user.hasOwnProperty('_id')) {
                            response.successful = true
                            response.message = 'Successfully sold ' + _amount + ' ' + _currency + ' for ' + transaction.USD + '$'
                        }
                        else {
                            response.successful = false
                            response.message = err_user_update
                        }
                    }
                    else {
                        response.successful = false
                        response.message = err_transaction
                    }
                }
                else {
                    response.successful = false
                    response.message = err_not_enough_BTC_ETH + ' You have ' + _user_amount + ' ' + _currency
                }
            }
            catch (err) {
                console.log(err)

                response.successful = false
                response.message = err.message
            }
        }
        else {
            response.successful = false
            response.message = err_negative_amount
        }
    }
    else {
        response.successful = false
        response.message = err_user_session
    }

    res.json(response);
});

router.post('/edit_money', async function (req, res) {
    var _user = req.session.user

    var response = {}
    if (_user != null) {
        var _user_id = _user._id;
        var _amount = parseFloat(req.body.amount);

        try {
            var new_balance = {
                USD: _amount
            }

            // Update user's balance
            var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

            if (new_user.hasOwnProperty('_id')) {
                response.successful = true
                if (_amount > 0)
                    response.message = 'Successfully deposited ' + _amount + '$'
                else
                    response.message = 'Successfully withdrawed ' + _amount + '$'
            }
            else {
                response.successful = false
                response.message = err_user_update
            }
        }
        catch (err) {
            console.log(err)

            response.successful = false
            response.message = err.message
        }
    }
    else {
        response.successful = false
        response.message = err_user_session
    }

    res.json(response);
});

// Plannedaction Buy / Sell / Cancel
router.post('/plannedaction/buy', async function (req, res) {
    var _user = req.session.user

    var response = {}

    if (_user != null) {
        var _user_id = _user._id;
        var _currency = req.body.currency;
        var _amount = parseFloat(req.body.amount);
        var _USD = parseFloat(req.body.USD);

        if (_amount > 0) {
            try {
                // Check if user has enough money
                var user_USD_balance = (await axios.get(app_domain + '/user/' + _user_id)).data.USD
                var _USD_total = _amount * _USD

                if (user_USD_balance >= _USD_total) {

                    var new_plannedaction = {
                        author: _user_id,
                        action: 'BUY',
                        USD: _USD
                    }
                    new_plannedaction[_currency] = _amount

                    var new_balance = { USD: - _USD_total }

                    // Insert new plannedaction
                    var plannedaction = (await axios.post(app_domain + '/plannedaction', new_plannedaction)).data
                    if (plannedaction.hasOwnProperty("_id")) {

                        // Update user's balance
                        var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                        if (new_user.hasOwnProperty('_id')) {
                            response.successful = true
                            response.message = success_plannedaction
                        }
                        else {
                            response.successful = false
                            response.message = err_user_update
                        }
                    }
                    else {
                        response.successful = false
                        response.message = err_plannedaction
                    }
                }
                else {
                    response.successful = false
                    response.message = err_not_enough_money + ' Required $' + _USD_total + '. You have $' + _user.USD
                }
            }
            catch (err) {
                console.log(err)

                response.successful = false
                response.message = err.message
            }
        }
        else {
            response.successful = false
            response.message = err_negative_amount
        }
    }
    else {
        response.successful = false
        response.message = err_user_session
    }

    res.json(response);
});

router.post('/plannedaction/sell', async function (req, res) {
    var _user = req.session.user

    var response = {}

    if (_user != null) {
        var _user_id = _user._id;
        var _currency = req.body.currency;
        var _amount = parseFloat(req.body.amount);
        var _USD = parseFloat(req.body.USD);

        if (_amount > 0) {
            try {
                // Check if user has enough BTC/ETH to sell
                var _user_amount = (await axios.get(app_domain + '/user/' + _user_id)).data[_currency]

                if (_user_amount >= _amount) {

                    var new_plannedaction = {
                        author: _user_id,
                        action: 'SELL',
                        USD: _USD
                    }
                    new_plannedaction[_currency] = _amount

                    var new_balance = {}
                    new_balance[_currency] = - _amount

                    // Insert new plannedaction
                    var plannedaction = (await axios.post(app_domain + '/plannedaction', new_plannedaction)).data
                    if (plannedaction.hasOwnProperty("_id")) {

                        // Update user's balance
                        var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                        if (new_user.hasOwnProperty('_id')) {
                            response.successful = true
                            response.message = success_plannedaction
                        }
                        else {
                            response.successful = false
                            response.message = err_user_update
                        }
                    }
                    else {
                        response.successful = false
                        response.message = err_plannedaction
                    }
                }
                else {
                    response.successful = false
                    response.message = err_not_enough_BTC_ETH + ' You have ' + _user_amount + ' ' + _currency
                }
            }
            catch (err) {
                console.log(err)

                response.successful = false
                response.message = err.message
            }
        }
        else {
            response.successful = false
            response.message = err_negative_amount
        }
    }
    else {
        response.successful = false
        response.message = err_user_session
    }

    res.json(response);
});

router.delete('/plannedaction/:action_id', async function (req, res) {
    try {
        var response = {}

        // Set the action as canceled
        var plannedaction = (await axios.delete(app_domain + '/plannedaction/' + req.params.action_id)).data;

        if (plannedaction.hasOwnProperty('_id')) {
            // Give back user money
            var new_balance = {}

            if (plannedaction.action == 'BUY') {
                // Give back USD
                if (plannedaction.hasOwnProperty('BTC')) {
                    new_balance.USD = plannedaction.USD * plannedaction.BTC
                }
                else if (plannedaction.hasOwnProperty('ETH')) {
                    new_balance.USD = plannedaction.USD * plannedaction.ETH
                }
            }
            else if (plannedaction.action == 'SELL') {
                // Give back BTC / ETH
                if (plannedaction.hasOwnProperty('BTC')) {
                    new_balance.BTC = plannedaction.BTC
                }
                else if (plannedaction.hasOwnProperty('ETH')) {
                    new_balance.ETH = plannedaction.ETH
                }
            }

            console.log('NEW BALANCE', JSON.stringify(new_balance))

            // Update user's balance
            var new_user = (await axios.put(app_domain + '/user/' + plannedaction.author + '/balance', new_balance)).data

            if (new_user.hasOwnProperty('_id')) {
                // Update session's variable
                req.session.user = new_user

                response.successful = true
                response.message = 'Planned action successfully canceled'
            }
            else {
                response.successful = false;
                response.message = 'Error during balance update'
            }
        }
        else {
            response.successful = false;
            response.message = 'Error during plannedaction update'
        }
    }
    catch (err) {
        console.log(err)
    }

    res.json(response)
})


// EXPORT
module.exports.router = router;