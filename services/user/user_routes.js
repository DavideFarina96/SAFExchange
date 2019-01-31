var express = require('express');
router = express.Router();

const axios = require('axios')


router.get('/:user_id', async function(req, res) { //user_id is the mondoDB user ID
    try {
        var user = (await axios.get(app_domain + '/database/user/' + req.params.user_id)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user);
})

// Update balance
router.put('/:user_id/balance', async function(req, res) { //user_id is the mondoDB user ID
    var _balance = req.body

    try {
        // Read user from DB
        var user = (await axios.get(app_domain + '/database/user/' + req.params.user_id)).data;

        // Compute final amount from the difference
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

        var new_user = (await axios.put(app_domain + '/database/user/' + req.params.user_id + '/balance', new_balance)).data;
    }
    catch (err) {
        console.log(err)
    }
    
    res.json(new_user);
})

router.put('/id_google', async function (req, res) {
    var _user = req.body

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

    try {
        var user = (await axios.put(app_domain + '/database/user/id_facebook', _user)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user)
})

router.put('/mail', async function (req, res) {
    var _user = req.body

    try {
        var user = (await axios.put(app_domain + '/database/user/mail', _user)).data;
    }
    catch (err) {
        console.log(err)
    }

    res.json(user)
})

router.get('/mail/:mail', function (req, res) {
    //find all users who registered with the email only (no google and fb)
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