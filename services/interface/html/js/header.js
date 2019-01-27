var user_get = '/interface/user/'
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
        url: user_get + user_id,
        type: 'GET'
    })
        .then(res => {            
            $('#user-USD').html(res.USD ? res.USD : 0)
            $('#user-BTC').html(res.BTC ? res.BTC : 0)
            $('#user-ETH').html(res.ETH ? res.ETH : 0)

            console.log('User info updated', res)
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}


// INIT
updatePrices()
updateUserInfo()

// Update every 10 seconds
setInterval(updatePrices, 10000);

