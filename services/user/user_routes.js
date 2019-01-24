var express = require('express');
router = express.Router();

var { OAuth2Client } = require('google-auth-library');
var verifier = require('google-id-token-verifier');


router.post('/tokensignin', function (req, res) {
    var token = req.body.tokenid;
    console.log(token);
    var clientId = "533024552572-ltbl4ks1kib5qod9cgihc2ppjhcdem2l.apps.googleusercontent.com";

    verifier.verify(token, clientId, function (err, tokenInfo) {
        if (!err) {
            tokenInfo.logged = true
            res.json(tokenInfo);
        }
        else {
            console.log(err)
            res.json({ logged: false });
        }
    });
});


// EXPORT router to be used in the main file
module.exports = router;