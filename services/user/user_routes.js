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

router.put('/:user_id', async function(req, res) { //user_id is the mondoDB user ID
    var _balance = req.body

    try {
        var balance = (await axios.put(app_domain + '/database/user/' + req.params.user_id + '/balance', _balance)).data;
    }
    catch (err) {
        console.log(err)
    }
    
    res.json(balance);
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

// EXPORT router to be used in the main file
module.exports = router;