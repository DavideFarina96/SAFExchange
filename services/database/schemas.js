var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    name: String,
    password: String,
    surname: String,
    email: String,
    oauth: String,
    USD: Number,
    BTC: Number,
    ETH: Number
});

var PriceSchema = new mongoose.Schema({
    BTCUSD: Number,
    ETHUSD: Number
});

var TransactionSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    action: { type: String, enum: ['buy', 'sell'], required: true },
    USD: { type: Number, required: true },
    BTC: Number,
    ETH: Number
});

var PlannedActionSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    action: { type: String, enum: ['buy', 'sell'], required: true },
    state: { type: String, enum: ['IDLE', 'PROCESSING', 'COMPLETED', 'CANCELED'], required: true, default: 'IDLE' },
    BTCUSD: Number,
    ETHUSD: Number,
    BTC: Number,
    ETH: Number
});


mongoose.model('users', UserSchema);
mongoose.model('prices', PriceSchema);
mongoose.model('transactions', TransactionSchema);
mongoose.model('plannedactions', PlannedActionSchema);