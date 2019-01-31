var express = require('express');
router = express.Router();

const axios = require('axios')
var path = require('path');


// PAGE ROUTES //////////////////////////////////////////////////////////
router.get('/', function (req, res) {
    console.log('Request for home received')
    if (req.session.user != null) {
        console.log('User', JSON.stringify(req.session.user))
        res.render('index', { user: req.session.user })
    }
    else {
        res.redirect('interface/login');
    }
})

router.get('/login', function (req, res) {
    console.log('Request for login received')
    res.render('login')
})

router.get('/logout', function (req, res) {
    console.log('Request for logout received')

    var _logged_with = req.session.logged_with
    req.session.user = null;

    res.render('logout', { logged_with: _logged_with })
})

router.get('/privacy', function (req, res) {
    res.render('privacy')
})

router.get('/tc', function (req, res) {
    res.render('tc')
})


// EXPORT router to be used in the main file
module.exports.setup_env = function (app) {
    // Set the view engine to ejs
    app.set('view engine', 'ejs')
    // Set the default views directory to html folder
    app.set('views', path.join(__dirname, '/html'))
    app.use(express.static(path.join(__dirname, '/html')))
}
module.exports.router = router;