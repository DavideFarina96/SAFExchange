const axios = require('axios')

/*
These are the variables which contain the links to the APIs used to retrieve BTC data from different services.
*/
var coinbase = "https://api.pro.coinbase.com/products/BTC-USD/ticker";
var kraken = "https://api.kraken.com/0/public/Ticker?pair=XBTUSD";
var bitfinex = "https://api.bitfinex.com/v2/tickers?symbols=tBTCUSD";
var binance = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";

/*
The 4 functions are used to make the API requests.
The final lines are simply used to make the functions visible from the price_routes.js file.
*/
function HTTPCoinbaseRequestJSON() {
  return axios.get(coinbase);
}

function HTTPKrakenRequestJSON() {
  return axios.get(kraken);
}

function HTTPBitfinexRequestJSON() {
  return axios.get(bitfinex);
}

function HTTPBinanceRequestJSON() {
  return axios.get(binance);
}

// MODULE EXPORTS
exports.HTTPCoinbaseRequestJSON = HTTPCoinbaseRequestJSON;
exports.HTTPKrakenRequestJSON = HTTPKrakenRequestJSON;
exports.HTTPBitfinexRequestJSON = HTTPBitfinexRequestJSON;
exports.HTTPBinanceRequestJSON = HTTPBinanceRequestJSON;