const axios = require('axios')

/*
These are the variables which contain the link to the API which needs to be called.
To find the correct API calls links, take a look at the APIs documentation. The links to the documentation can be found in the slides.
If you are struggling and simply want to skip this part of the exercise, the correct API calls can be found in the "Exercises Solutions" slides
*/
var coinbase = "https://api.pro.coinbase.com/products/ETH-USD/ticker";
var kraken = "https://api.kraken.com/0/public/Ticker?pair=XETHZUSD";
var bitfinex = "https://api.bitfinex.com/v2/tickers?symbols=tETHUSD";
var binance = "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT";

/*
The rest of the code in this page should not be modified for the exercise. 
The 4 functions are used to make the API requests.
The final lines are simply used to make the functions visible to the index.js file.
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