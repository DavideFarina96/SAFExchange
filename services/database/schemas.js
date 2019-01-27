var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    id_google: { type: String, unique : true, sparse: true },
    id_facebook: { type: String, unique : true, sparse: true },
    image_url: String,
    USD: { type: Number, required: true, default: 0 },
    BTC: { type: Number, required: true, default: 0 },
    ETH: { type: Number, required: true, default: 0 }
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