var mongoose = require('mongoose');

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
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    workgroup: String,
    subreports: [{ type: mongoose.Schema.Types.ObjectId, ref: "subreports" }]
});

var WeekSchema = new mongoose.Schema({
    weekdate: Date,
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "reports" }]
});

var TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    workgroup: String,
    taskID: String,
    creationDate: Date,
    endingDate: Date,
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    milestones: [{ name: String, date: Date }],
    status: String
});

var BugSchema = new mongoose.Schema({
    title: String,
    bugID: String,
    type: String,
    description: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    creationDate: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    status: String
})


mongoose.model('users', UserSchema);
mongoose.model('subreports', SubreportSchema);
mongoose.model('reports', ReportSchema);
mongoose.model('weeks', WeekSchema);
mongoose.model('tasks', TaskSchema);
mongoose.model('bugs', BugSchema);