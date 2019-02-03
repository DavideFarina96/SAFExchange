var express = require('express');
router = express.Router();

const axios = require('axios')

var { OAuth2Client } = require('google-auth-library');
var verifier = require('google-id-token-verifier');


//LOGIN ROUTES /////////////////////////////////////////////////////////
function setSession(req, _user, _logged_with) {
    // Set the session variable with the user's data and how it logged in
    req.session.user = {
        _id: _user._id,
        name: _user.name,
        email: _user.email,
        image_url: _user.image_url,
    };

    req.session.logged_with = _logged_with
}

// Google login
router.post('/googleSignIn', function (req, res) {
    // Get token from page
    var token = req.body.tokenid;

    // ID of this application to be authenticated on Google's servers
    var clientId = "533024552572-ltbl4ks1kib5qod9cgihc2ppjhcdem2l.apps.googleusercontent.com";

    // If the token is valid, proceed with login
    verifier.verify(token, clientId, async function (err, tokenInfo) {
        if (!err) {
            // Token is valid
            tokenInfo.success = true

            // Get user data from the POST params
            var _user = req.body.user

            try {
                // Execute put on user. If not present, create it. If present, update it.
                var user = (await axios.put(app_domain + '/user/id_google', _user)).data;
            }
            catch (err) {
                console.log(err)
            }

            // Set session variable
            setSession(req, user, 'GOOGLE')

            // Send data to page
            res.json(tokenInfo);
        }
        else {
            console.log(err)
            res.json({ success: false });
        }
    });
});

// Facebook login
router.post('/facebookSignIn', async function (req, res) {
    // Get token from page
    var token = req.body.tokenid;

    // Get app token
    var app_token = (await axios.get("https://graph.facebook.com/oauth/access_token?client_id=2178730182445130&client_secret=ea1da7f5d63016176122012d80b2be4c&grant_type=client_credentials")).data.access_token;
    //console.log("GOT APP TOKEN");

    // Check token validity
    var token_validity = (await axios.get("https://graph.facebook.com/debug_token?input_token=" + token + "&access_token=" + app_token)).data;

    if (token_validity.data.is_valid == true) {
        //console.log("TOKEN IS VALID");

        token_validity.success = true

        // Get user data from params
        var _user = req.body.user

        try {
            // Execute put on user. If not present, create it. If present, update it.
            var user = (await axios.put(app_domain + '/user/id_facebook', _user)).data;
        }
        catch (err) {
            console.log(err)
        }

        // Set session variables
        setSession(req, user, 'FACEBOOK')

        // Return data to client
        res.json(token_validity);
    }
    else {
        res.json({ success: false });
    }
});

// Mail register
router.post('/mailRegister', async function (req, res) {
    // Get user params
    var userData = req.body;

    // Check if the mail is already present
    try {
        var user = (await axios.get(app_domain + '/user/mail/' + userData.email)).data;

        // If it is already present, he can not register
        if (user != null) {
            res.json({ success: false, message: 'Mail already taken' });
        }
        else {
            // Add user to the database
            var user = (await axios.post(app_domain + '/user/mail', userData)).data;

            // Log the user in
            setSession(req, user, 'MAIL')

            res.json({ success: true });
        }
    }
    catch (err) {
        console.log(err)
    }
});

// Mail login
router.post('/mailSignIn', async function (req, res) {
    // Get user params
    var userData = req.body;

    // Check if the user exists
    try {
        var user = (await axios.get(app_domain + '/user/mail/' + userData.email)).data;
    }
    catch (err) {
        console.log(err)
    }

    // If it exists, check if the password is correct. Then, log it in
    if (user != null && user.password == userData.password) {
        // Set session variables
        setSession(req, user, 'MAIL')

        res.json({ success: true });
    }
    else
        res.json({ success: false });
});


// EXPORT
module.exports = router;