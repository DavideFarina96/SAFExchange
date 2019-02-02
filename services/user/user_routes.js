var express = require('express');
router = express.Router();

const axios = require('axios')


router.get('/:user_id', async function(req, res) {
    // Return the user associated to the user_id
    try {
        var user = (await axios.get(app_domain + '/database/user/' + req.params.user_id)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user);
})

router.put('/:user_id/balance', async function(req, res) {
    // Update user's balance
    var _balance = req.body

    try {
        // Read user from DB
        var user = (await axios.get(app_domain + '/database/user/' + req.params.user_id)).data;

        // Compute new balance from the current one and the amount in the params
        var new_balance = {}
        if(_balance.hasOwnProperty('USD')) {
            new_balance.USD = user.USD + _balance.USD
        }
        if(_balance.hasOwnProperty('BTC')) {
            new_balance.BTC = user.BTC + _balance.BTC
        }
        if(_balance.hasOwnProperty('ETH')) {
            new_balance.ETH = user.ETH + _balance.ETH
        }

        // Update balance
        var new_user = (await axios.put(app_domain + '/database/user/' + req.params.user_id + '/balance', new_balance)).data;
    }
    catch (err) {
        console.log(err)
    }
    
    res.json(new_user);
})

router.put('/id_google', async function (req, res) {
    var _user = req.body

    // Update user if present, create a new one if not
    try {
        var user = (await axios.put(app_domain + '/database/user/id_google', _user)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user)
})

router.put('/id_facebook', async function (req, res) {
    var _user = req.body

    // Update user if present, create a new one if not
    try {
        var user = (await axios.put(app_domain + '/database/user/id_facebook', _user)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user)
})

router.post('/mail', async function (req, res) {
    var _user = req.body

    // Create new user that registered with the email
    try {
        var user = (await axios.post(app_domain + '/database/user/mail', _user)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user)
})

router.get('/mail/:mail', async function (req, res) {
    // Return the user who registered with email only (no google and fb) and is the same as the params.mail
    try {
        var user = (await axios.get(app_domain + '/database/user/mail/' + req.params.mail)).data;
    }
    catch (err) {
        console.log(err)
    }
    res.json(user)
})

// EXPORT router to be used in the main file
module.exports = router;