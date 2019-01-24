var express = require('express');
router = express.Router();

const axios = require('axios')

router.put('/id_google', async function (req, res) {
    var _user = req.body.user

    try {
        var user = await axios.put(app_domain + '/database/user/id_google', { user: _user });
    }
    catch (err) {
        console.log(err)
    }


    res.json(user)
})


// EXPORT router to be used in the main file
module.exports = router;