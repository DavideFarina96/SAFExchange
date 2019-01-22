var express = require('express');
router = express.Router();
var path = require('path');


router.get('/', function(req, res) {
    // Return index.html
    res.sendfile( path.join(__dirname + "/index.html") );     
});


// EXPORT router to be used in the main file
module.exports = router;