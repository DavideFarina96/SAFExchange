// INCLUDES
var express = require('express');
var app = express();                                    // create our app w/ express
var router = express.Router();

var bodyParser = require('body-parser');                // pull information from HTML POST (express4)
var path = require('path');  
var morgan = require('morgan');                         // log requests to the console (express4)
//var methodOverride = require('method-override');      // simulate DELETE and PUT (express4)

var schedule = require('node-schedule');                // scheduler
var axios = require('axios');                           // make HTTP requests
//var globalValues = require('./public/globalValues');

var {OAuth2Client} = require('google-auth-library');
var verifier = require('google-id-token-verifier');


// CONFIGURATION
app.use(express.static(path.join(__dirname, 'public')));        // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({ extended: true }));             // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
//app.use(methodOverride());

// Choose what port to use. If deployed on heroku process.env.PORT will be set and therefore used
const PORT = process.env.PORT || 8080


// JOB SCHEDULER
//var j = schedule.scheduleJob('0 0 1 * * 1', function () {
//    AddNewWeek();
//});


/** middleware route to support CORS and preflighted requests */
app.use(function (req, res, next) {
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Credentials", false);
        res.header("Access-Control-Max-Age", '86400'); // 24 hours
        res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }

    next();
});


// THESE METHODS SHOULD GO IN THE APPROPRIATE FILE
// ALSO USE router.get INSTEAD OF app.get 

/*app.get('/user/USD', function(req, res) {
	// DO STUFF
    res.send();		
});
app.get('/price/BTC', function(req, res) {
    var priceObj = {price: 0};
    axios.get('https://api.pro.coinbase.com/products/BTC-USD/ticker')
      .then(response => {
        console.log("price received");
        priceObj.price = response.data.price;
        res.send(priceObj);
      })
      .catch(error => {
        console.log(error);
        res.send(error);
      });
});
app.get('/profile/', function(req, res) {
    var profileid = req.query.profileid;
    res.sendfile('./public/profile.html');
}); */

app.get('/', function(req, res) {
    // DO STUFF
    res.sendfile("./index.html");     
});

app.post('/tokensignin', function(req, res) {
    var token = req.body.tokenid;
    console.log(token);
    var clientId = "533024552572-ueqgth3dnht0ntpqdfbcmhofu20o8i61.apps.googleusercontent.com";

    verifier.verify(token, clientId, function (err, tokenInfo) {
      if (!err) {
        res.json(tokenInfo);
      }
      else
        res.json(req.body);
    });
});


// Include DATABASE routes
var db_routes = require('./services/database/routes_database.js');
app.use('/database', db_routes);

// Include PRICE routes
var price_routes = require('./services/price/price_routes.js');
app.use('/price', price_routes);

// Include INTERFACE routes
var interface_routes = require('./services/interface/interface_routes.js');
app.use('/interface', interface_routes);

// Include USER routes
user_routes = require('./services/user/user_routes.js');
app.use('/user', user_routes);

// Include PLANNED ACTION routes
var plannedaction_routes = require('./services/plannedaction/server_plannedaction.js');
app.use('/plannedaction', plannedaction_routes);

// register main router
app.use('/', router);

// listen (start app with node server.js) ======================================
app.listen(PORT, function () {
    console.log('App listening on port ' + PORT);
});