var express = require('express');
router = express.Router();

var { OAuth2Client } = require('google-auth-library');
var verifier = require('google-id-token-verifier');


router.post('/tokensignin', function (req, res) {
    var token = req.body.tokenid;
    console.log(token);
    var clientId = "533024552572-ueqgth3dnht0ntpqdfbcmhofu20o8i61.apps.googleusercontent.com";

    verifier.verify(token, clientId, function (err, tokenInfo) {
        if (!err) {
            res.json(tokenInfo);
        }
        else
            res.json(err);
    });
});


// EXPORT router to be used in the main file
module.exports = router;