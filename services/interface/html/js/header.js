var price_current_get = '/interface/price'

var current_BTCUSD
var current_ETHUSD

function updatePrices() {
    $.ajax({
        url: price_current_get,
        type: 'GET'
    })
        .then(res => {
            current_BTCUSD = parseFloat(res.BTC.BTCUSD).toFixed(2)
            current_ETHUSD = parseFloat(res.ETH.ETHUSD).toFixed(2)

            $('#current-BTCUSD').html(current_BTCUSD)
            $('#current-ETHUSD').html(current_ETHUSD)

            console.log('Prices updated', current_BTCUSD, current_ETHUSD)

            // If we are on index page, update chart
            if (typeof newChartPoint === "function") { 
                if (currency == 'BTC')
                    newChartPoint(res.BTC)
                else if (currency == 'ETH')
                    newChartPoint(res.ETH)
            }
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}

function updateUserInfo() { // TODO
    $.ajax({
        url: price_current_get,
        type: 'GET'
    })
        .then(res => {
            current_BTCUSD = parseFloat(res.BTCUSD).toFixed(2)
            current_ETHUSD = parseFloat(res.ETHUSD).toFixed(2)

            $('#current-BTCUSD').html(current_BTCUSD)
            $('#current-ETHUSD').html(current_ETHUSD)

            console.log('Prices updated', current_BTCUSD, current_ETHUSD)
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}

// Update every 5 seconds
updatePrices()
setInterval(updatePrices, 5000);

