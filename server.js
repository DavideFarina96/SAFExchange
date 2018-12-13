    // set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var schedule = require('node-schedule');    //scheduler

var globalValues = require('./public/globalValues');

// configuration =================

//mongoose.connect('mongodb://fsae.dii.unitn.it:27017/eaglewebplatform',
mongoose.connect('mongodb://localhost:27017/eaglewebplatform',
	function(err) {
		if(err)
			console.log("error");
		else
			console.log("Connected to db");
	});     // connect to mongoDB database

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// SCHEMAS ====================================

var UserSchema = new mongoose.Schema({
	username: String,
	name: String,
    password: String,
	surname: String,
    email: String,
	workgroups: [String],
	team: String,
	roles: [{
            role: String,
            of: String
        }]
});

var SubreportSchema = new mongoose.Schema({
	team: String,
	text: String,
	pro: String,
	cons: String,
    seen: Boolean
});

var ReportSchema = new mongoose.Schema({
	author: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
	workgroup: String,
	subreports: [{type: mongoose.Schema.Types.ObjectId, ref: "subreports"}]
});

var WeekSchema = new mongoose.Schema({
	weekdate: Date,
	reports: [{type: mongoose.Schema.Types.ObjectId, ref: "reports"}]
});

var TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    workgroup: String,
    taskID: String,
    creationDate: Date,
    endingDate: Date,
    assignedTo: [{type: mongoose.Schema.Types.ObjectId, ref: "users"}],
    milestones: [{name: String, date: Date}],
    status: String
});

var BugSchema = new mongoose.Schema({
    title: String,
    bugID: String,
    type: String,
    description: String,
    author: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    creationDate: Date,
    assignedTo: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    status: String
})

//if they don't exist, they will be created. If they do exist, they will be "referenced"
var Users = mongoose.model('users', UserSchema);
var Subreports = mongoose.model('subreports', SubreportSchema);
var Reports = mongoose.model('reports', ReportSchema);
var Weeks = mongoose.model('weeks', WeekSchema);
var Tasks = mongoose.model('tasks', TaskSchema);
var Bugs = mongoose.model('bugs', BugSchema);

// JOB SCHEDULER ==============================
//var j = schedule.scheduleJob('0 0 1 * * 1', function () {
//    AddNewWeek();
//});

// routes ======================================================================
app.get('/user/USD', function(req, res) {
	// DO STUFF
    res.send();		
});


app.post('/price/BTC', function(req, res) {
    // DO STUFF
    res.send();
});

app.get('/profile/', function(req, res) {
    var profileid = req.query.profileid;
    res.sendfile('./public/profile.html');
});


// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");
