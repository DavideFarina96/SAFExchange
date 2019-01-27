// PATHS /////////////////////////////////////////////////////////////////
var buy_post_path = '/interface/buy/'
var sell_post_path = '/interface/sell/'

var price_history_get_path = '/interface/price/'

var transactions_get_path = '/interface/transaction/user/'
var transactions_post_path = '/interface/transaction/'

var plannedactions_get_path = '/interface/plannedaction/user/'
var plannedactions_post_path = '/interface/plannedaction/'

var currency = 'BTC'

// BUY / SELL PANEL //////////////////////////////////////////////////////
function buy() {
    var _amount = $('#buy-amount').val();

    $.ajax({
        url: buy_post_path + currency,
        data: { amount: _amount },
        type: 'POST'
    })
        .then(res => {
            if (res.successful) {
                alert(res.message)

                updateTransactionList()
                updateUserInfo()
            }
            else {
                alert(res.message)
            }
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}

function sell() {

}

// CHART PANEL ///////////////////////////////////////////////////////////
var nElemHistory = 50;
function getPriceHistory() {
    $.ajax({
        url: price_history_get_path + currency + 'USD',
        data: { elem_number: nElemHistory },
        type: 'GET'
    })
        .then(res => {
            console.log(res.length, 'prices received');

            parseAndDisplayData(res)
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}


// TRANSACTION / PLANNED ACTION PANEL ///////////////////////////////////
function updateTransactionList() {
    // HTTP request to interface to get the list
    $.ajax({
        url: transactions_get_path + user_id,
        type: 'GET'
    })
        .then(res => {
            console.log(res);

            html = createHTMLlist(res, 'transaction')

            $('#transaction_list').html(html)
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}

function updatePlannedactionList() {
    // HTTP request to interface to get the list
    $.ajax({
        url: plannedactions_get_path + user_id,
        type: 'GET'
    })
        .then(res => {
            console.log(res);

            html = createHTMLlist(res, 'plannedaction')

            $('#plannedaction_list').html(html)
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}

function createHTMLlist(list, type) {
    html = ''

    if (list.length == 0) {
        html = '<tr><td colspan=4>Nothing to show</td></tr>'
    }
    else {
        list.forEach(t => {
            html += '<tr>'

            if (t.action == 'sell')
                html += '<td class="w3-red">SELL</td>'
            else
                html += '<td class="w3-green">BUY</td>'

            if (t.hasOwnProperty('BTC')) {
                html += '<td>BTC</td>'
                html += '<td>' + t.BTC + '</td>'

                if (type == 'transaction')
                    html += '<td>' + t.USD + '</td>'
                else if (type == 'plannedaction')
                    html += '<td>' + t.BTCUSD + '</td>'
            }
            else if (t.hasOwnProperty('ETH')) {
                html += '<td>ETH</td>'
                html += '<td>' + t.ETH + '</td>'

                if (type == 'transaction')
                    html += '<td>' + t.USD + '</td>'
                else if (type == 'plannedaction')
                    html += '<td>' + t.ETHUSD + '</td>'
            }

            html += '</tr>'
        });
    }
    return html;
}


// LISTENERS ////////////////////////////////////////////////////////////
$('#currency-selector').on('change', function (e) {
    console.log('Selected', this.value)

    if (this.value == 'BTCUSD')
        currency = 'BTC'
    else if (this.value == 'ETHUSD')
        currency = 'ETH'


    // Reset Buy/sell panel
    $('#buy-amount').val('');
    $('#buy-cost').html('0');
    $('#sell-amount').val('');
    $('#sell-profit').html('0')

    // Get data for the chart and update it
    getPriceHistory()
})

$('#buy-amount').on('input', function (e) {
    if (currency == 'BTC')
        $('#buy-cost').html(this.value * current_BTCUSD)
    else if (currency == 'ETH')
        $('#buy-cost').html(this.value * current_ETHUSD)
})

$('#sell-amount').on('input', function (e) {
    if (currency == 'BTC')
        $('#sell-profit').html(this.value * current_BTCUSD)
    else if (currency == 'ETH')
        $('#sell-profit').html(this.value * current_ETHUSD)
})

$('#btn-buy').click(buy)

$('#btn-sell').click(sell)

// INIT /////////////////////////////////////////////////////////////////
// Trigger change / update on startup
$('#currency-selector').trigger('change');

// Update GUI
updateTransactionList()
updatePlannedactionList()