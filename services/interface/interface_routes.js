var express = require('express');
router = express.Router();

const axios = require('axios')
var path = require('path');


var { OAuth2Client } = require('google-auth-library');
var verifier = require('google-id-token-verifier');

var interface_path = "/interface"


// PAGE ROUTES
router.get('/', function (req, res) {
    console.log('Request for home received')
    if (req.session.user != null) {
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


// LOGIN ROUTES
router.post('/googleSignIn', function (req, res) {
    // Get token from page
    var token = req.body.tokenid;
    console.log(token);

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

//facebook login
router.post('/facebookSignIn', async function (req, res) {
    // Get token from page
    var token = req.body.tokenid;
    console.log(token);

    //get app token
    var app_token = (await axios.get("https://graph.facebook.com/oauth/access_token?client_id=2178730182445130&client_secret=ea1da7f5d63016176122012d80b2be4c&grant_type=client_credentials")).data.access_token;
    console.log("GOT APP TOKEN");

    //check token validity
    var token_validity = (await axios.get("graph.facebook.com/debug_token?input_token=" + token + "&access_token=" + app_token)).data;

    if(token_validity.data.is_valid == true)
    {
        console.log("TOKEN IS VALID");
        var _user = req.body.user

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
    else
    {
        res.json({ logged: false });
    }
});



// Authenticate user with credentials
router.post('/mailSignIn', function (req, res) {

    req.session.user = { name: "test" }
    req.session.user.logged_with = "MAIL"

    // Return index.html
    res.json({ logged: true });
});


// REDIRECTS ROUTES



// EXPORT router to be used in the main file
module.exports.setup_env = function (app) {
    // Set the view engine to ejs
    app.set('view engine', 'ejs')
    // Set the default views directory to html folder
    app.set('views', path.join(__dirname, '/html'))
    app.use(express.static(path.join(__dirname, '/html')))
}
module.exports.router = router;