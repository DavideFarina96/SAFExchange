var express = require('express');
router = express.Router();

const axios = require('axios')
var path = require('path');


var { OAuth2Client } = require('google-auth-library');
var verifier = require('google-id-token-verifier');

var interface_path = "/interface"


// PAGE ROUTES //////////////////////////////////////////////////////////
router.get('/', function (req, res) {
    console.log('Request for home received')
    if (req.session.user != null) {
        console.log('User', JSON.stringify(req.session.user))
        res.render('index', { user: req.session.user })
    }
    else {
        res.redirect(interface_path + '/login');
    }
})

router.get('/login', function (req, res) {
    console.log('Request for login received')
    res.render('login')
})

router.get('/logout', function (req, res) {
    console.log('Request for logout received')

    var logged_with = req.session.user.logged_with
    req.session.user = null;

    res.render('logout', { logged_with: logged_with })
})

router.get('/privacy', function (req, res) {
    res.render('privacy')
})

router.get('/tc', function (req, res) {
    res.render('tc')
})


// LOGIN ROUTES /////////////////////////////////////////////////////////
// Google login
router.post('/googleSignIn', function (req, res) {
    // Get token from page
    var token = req.body.tokenid;
    //console.log(token);

    var clientId = "533024552572-ltbl4ks1kib5qod9cgihc2ppjhcdem2l.apps.googleusercontent.com";

    verifier.verify(token, clientId, async function (err, tokenInfo) {
        if (!err) {
            // Token is valid

            tokenInfo.logged = true

            // Get user data from Google
            var _user = req.body.user

            try {
                // Get user from /user -> Create if not exists
                var user = (await axios.put(app_domain + '/user/id_google', _user)).data;
            }
            catch (err) {
                console.log(err)
            }

            // Set session variable
            req.session.user = user
            req.session.user.logged_with = "GOOGLE"

            // Send data to page
            res.json(tokenInfo);
        }
        else {
            console.log(err)
            res.json({ logged: false });
        }
    });
});

// Facebook login
router.post('/facebookSignIn', async function (req, res) {
    // Get token from page
    var token = req.body.tokenid;
    //console.log(token);

    //get app token
    var app_token = (await axios.get("https://graph.facebook.com/oauth/access_token?client_id=2178730182445130&client_secret=ea1da7f5d63016176122012d80b2be4c&grant_type=client_credentials")).data.access_token;
    console.log("GOT APP TOKEN");

    //check token validity
    var token_validity = (await axios.get("https://graph.facebook.com/debug_token?input_token=" + token + "&access_token=" + app_token)).data;

    if (token_validity.data.is_valid == true) {
        console.log("TOKEN IS VALID");
        var _user = req.body.user
        console.log(_user);

        try {
            // Get user from /user -> Create if not exists
            var user = (await axios.put(app_domain + '/user/id_facebook', _user)).data;
        }
        catch (err) {
            console.log(err)
        }

        req.session.user = user;
        req.session.user.logged_with = "FACEBOOK";

        res.json(token_validity);
    }
    else {
        res.json({ logged: false });
    }
});

// Mail login
router.post('/mailSignIn', function (req, res) {

    req.session.user = {
        name: "test", _id: '5c49e7f329202200177264e7', image_url: 'https://lh4.googleusercontent.com/-LBYekgpU62I/AAAAAAAAAAI/AAAAAAAAAAA/ACevoQMqqlNHg_c3VJJ8GcpmRWxhCUiSTQ/s96-c/photo.jpg',
        USD: 1000, BTC: 0.7, ETH: 3.3
    }
    req.session.user.logged_with = "MAIL"

    res.json({ logged: true });
});


// REDIRECTS ROUTES /////////////////////////////////////////////////////

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
            var current_price = (await axios.get(app_domain + '/price/prices')).data

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
                var new_balance = { USD: _user.USD - _USD_total }

                if (_currency == 'BTC') {
                    new_transaction.BTC = _amount
                    new_balance.BTC = _user.BTC + _amount
                }
                else if (_currency == 'ETH') {
                    new_transaction.ETH = _amount
                    new_balance.ETH = _user.ETH + _amount
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
            if ( (_currency == 'BTC' && _user.BTC >= _amount) || (_currency == 'ETH' && _user.ETH >= _amount) )  {

                // Get current price
                var current_price = (await axios.get(app_domain + '/price/prices')).data

                var new_transaction = {
                    author: _user_id,
                    action: 'SELL'
                }
                var new_balance = { }

                if (_currency == 'BTC') {
                    new_transaction.BTC = _amount
                    new_transaction.USD = _amount * current_price.BTC.BTCUSD

                    new_balance.BTC = _user.BTC - _amount
                }
                else if (_currency == 'ETH') {
                    new_transaction.ETH = _amount
                    new_transaction.USD = _amount * current_price.ETH.ETHUSD

                    new_balance.ETH = _user.ETH - _amount
                }
                new_balance.USD = _user.USD + new_transaction.USD


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
                response.message = 'Not enough BTC/ETH to perform operation'
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

    var prices = (await axios.get(app_domain + '/price/prices')).data;

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
                var new_balance = { USD: _user.USD - _USD_total }

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
            if ( (_currency == 'BTC' && _user.BTC >= _amount) || (_currency == 'ETH' && _user.ETH >= _amount) )  {

                var new_plannedaction = {
                    author: _user_id,
                    action: 'SELL',
                    USD: _USD
                }
                var new_balance = { }

                if (_currency == 'BTC') {
                    new_plannedaction.BTC = _amount

                    new_balance.BTC = _user.BTC - _amount
                }
                else if (_currency == 'ETH') {
                    new_plannedaction.ETH = _amount

                    new_balance.ETH = _user.ETH - _amount
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
                response.message = 'Not enough BTC/ETH to perform operation'
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


// EXPORT router to be used in the main file
module.exports.setup_env = function (app) {
    // Set the view engine to ejs
    app.set('view engine', 'ejs')
    // Set the default views directory to html folder
    app.set('views', path.join(__dirname, '/html'))
    app.use(express.static(path.join(__dirname, '/html')))
}
module.exports.router = router;