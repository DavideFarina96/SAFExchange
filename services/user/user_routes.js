var express = require('express');
router = express.Router();

const axios = require('axios')

router.put('/id_google', async function (req, res) {
    var _user = req.body

    try {
        console.log("User", JSON.stringify(_user))
        var user = await axios.put(app_domain + '/database/user/id_google', { _user });
    }
    catch (err) {
        console.log(err)
    }


    res.json(user)
})


// EXPORT router to be used in the main file
module.exports = router;