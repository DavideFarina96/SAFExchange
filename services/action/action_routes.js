var express = require('express');
router = express.Router();

const axios = require('axios')


//PROCESS ROUTES /////////////////////////////////////////////////////

// Buy / Sell
router.post('/buy', async function (req, res) {
    var _user = req.session.user

    var response = {}

    if (_user != null) {
        var _user_id = _user._id;
        var _currency = req.body.currency;
        var _amount = parseFloat(req.body.amount);

        try {
            // Check if user has enough money
            var current_price = (await axios.get(app_domain + '/price')).data

            var _USD_total
            if (_currency == 'BTC')
                _USD_total = _amount * parseFloat(current_price.BTC.BTCUSD)
            else if (_currency == 'ETH')
                _USD_total = _amount * parseFloat(current_price.ETH.ETHUSD)

            if (_user.USD >= _USD_total) {

                var new_transaction = {
                    author: _user_id,
                    action: 'BUY',
                    USD: _USD_total
                }
                var new_balance = { USD: - _USD_total }

                if (_currency == 'BTC') {
                    new_transaction.BTC = _amount
                    new_balance.BTC = _amount
                }
                else if (_currency == 'ETH') {
                    new_transaction.ETH = _amount
                    new_balance.ETH = _amount
                }


                // Insert new transaction
                var transaction = (await axios.post(app_domain + '/transaction', new_transaction)).data
                if (transaction.hasOwnProperty("_id")) {

                    // Update user's balance
                    var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                    // Update session's variable
                    req.session.user = new_user

                    response.successful = true
                    response.message = 'Successfully bought ' + _amount + ' ' + _currency + ' for ' + _USD_total + '$'
                }
                else {
                    response.successful = false
                    response.message = 'There was an error with the transaction'
                }
            }
            else {
                response.successful = false
                response.message = 'Not enough money to perform operation. Required $' + _USD_total + '. You have $' + _user.USD
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
        response.message = 'User session variable not set'
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

        try {
            // Check if user has enough BTC/ETH to sell
            var _user_amount
            if (_currency == 'BTC')
                _user_amount = _user.BTC
            else if (_currency == 'ETH')
                _user_amount = _user.ETH

            if (_user_amount >= _amount) {

                // Get current price
                var current_price = (await axios.get(app_domain + '/price')).data

                var new_transaction = {
                    author: _user_id,
                    action: 'SELL'
                }
                var new_balance = {}

                if (_currency == 'BTC') {
                    new_transaction.BTC = _amount
                    new_transaction.USD = _amount * current_price.BTC.BTCUSD

                    new_balance.BTC = - _amount
                }
                else if (_currency == 'ETH') {
                    new_transaction.ETH = _amount
                    new_transaction.USD = _amount * current_price.ETH.ETHUSD

                    new_balance.ETH = - _amount
                }
                new_balance.USD = new_transaction.USD


                // Insert new transaction
                var transaction = (await axios.post(app_domain + '/transaction', new_transaction)).data
                if (transaction.hasOwnProperty("_id")) {

                    // Update user's balance
                    var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                    // Update session's variable
                    req.session.user = new_user

                    response.successful = true
                    response.message = 'Successfully sold ' + _amount + ' ' + _currency + ' for ' + transaction.USD + '$'
                }
                else {
                    response.successful = false
                    response.message = 'There was an error with the transaction'
                }
            }
            else {
                response.successful = false
                response.message = 'Not enough BTC/ETH to perform operation. You have ' + _user_amount + ' ' + _currency
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
        response.message = 'User session variable not set'
    }

    res.json(response);
});

router.post('/add_money', async function (req, res) {
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
                // Update session's variable
                req.session.user = new_user

                response.successful = true
                response.message = 'Successfully added ' + _amount + '$'
            }
            else {
                response.successful = false
                response.message = 'There was an error in the user update'
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
        response.message = 'User session variable not set'
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

        try {
            // Check if user has enough money
            var _USD_total = _amount * _USD

            if (_user.USD >= _USD_total) {

                var new_plannedaction = {
                    author: _user_id,
                    action: 'BUY',
                    USD: _USD
                }
                var new_balance = { USD: - _USD_total }

                if (_currency == 'BTC') {
                    new_plannedaction.BTC = _amount
                }
                else if (_currency == 'ETH') {
                    new_plannedaction.ETH = _amount
                }

                // Insert new plannedaction
                var plannedaction = (await axios.post(app_domain + '/plannedaction', new_plannedaction)).data
                if (plannedaction.hasOwnProperty("_id")) {

                    // Update user's balance
                    var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                    // Update session's variable
                    req.session.user = new_user

                    response.successful = true
                    response.message = 'Planned action successfully inserted'
                }
                else {
                    response.successful = false
                    response.message = 'There was an error with the plannedaction'
                }
            }
            else {
                response.successful = false
                response.message = 'Not enough money to perform operation. Required $' + _USD_total + '. You have $' + _user.USD
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
        response.message = 'User session variable not set'
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

        try {
            // Check if user has enough BTC/ETH to sell
            var _user_amount
            if (_currency == 'BTC')
                _user_amount = _user.BTC
            else if (_currency == 'ETH')
                _user_amount = _user.ETH

            if (_user_amount >= _amount) {

                var new_plannedaction = {
                    author: _user_id,
                    action: 'SELL',
                    USD: _USD
                }
                var new_balance = {}

                if (_currency == 'BTC') {
                    new_plannedaction.BTC = _amount

                    new_balance.BTC = - _amount
                }
                else if (_currency == 'ETH') {
                    new_plannedaction.ETH = _amount

                    new_balance.ETH = - _amount
                }

                // Insert new plannedaction
                var plannedaction = (await axios.post(app_domain + '/plannedaction', new_plannedaction)).data
                if (plannedaction.hasOwnProperty("_id")) {

                    // Update user's balance
                    var new_user = (await axios.put(app_domain + '/user/' + _user_id + '/balance', new_balance)).data

                    // Update session's variable
                    req.session.user = new_user

                    response.successful = true
                    response.message = 'Planned action successfully inserted'
                }
                else {
                    response.successful = false
                    response.message = 'There was an error with the plannedaction'
                }
            }
            else {
                response.successful = false
                response.message = 'Not enough BTC/ETH to perform operation. You have ' + _user_amount + ' ' + _currency
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
        response.message = 'User session variable not set'
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