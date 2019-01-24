var express = require('express');
router = express.Router();

const axios = require('axios')
//const qs = require('qs')
var path = require('path');

var interface_path = "/interface"

// PAGE ROUTES
router.get('/', function (req, res) {
    console.log('Request for home received')
    if (req.session.user != null) {
        res.render('index', { user:  req.session.user })
    }
    else {
        res.redirect(interface_path + '/login');
    }
})

router.get('/login', function (req, res) {
    console.log('Request for login received')
    res.render('login')
})

router.get('/privacy', function (req, res) {
    res.render('privacy')
})

router.get('/tc', function (req, res) {
    res.render('tc')
})

// LOGIN ROUTES
// Handle Google Token
router.post('/googleSignIn', async function (req, res) {
    var params = {}
    params.token_id = req.body.token_id

    try {
        // Forward to /user
        var res = await axios.post(app_domain + 'user/tokensignin', { params });

        if (res == "??valid??") {
            res.render('index');
        }
        else {
            res.render('login', {
                error_message: "Something gone wrong. Please try again."
            });
        }
    }
    catch (err) {
        res.json(err);
    }
});

// Authenticate user with credentials
router.post('/mailSignIn', function (req, res) {

    req.session.user = { name: "test" }

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