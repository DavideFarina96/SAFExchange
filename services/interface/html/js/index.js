// PATHS /////////////////////////////////////////////////////////////////
var buy_post_path = '/action/buy/'
var sell_post_path = '/action/sell/'
var add_money_post_path = '/action/edit_money/'

var price_history_get_path = '/redirect/price/'

var transactions_get_path = '/redirect/transaction/user/'

var plannedaction_get_path = '/redirect/plannedaction/user/'
var plannedaction_post_delete_path = '/action/plannedaction/'

var nElemHistory = 100;

var currency = 'BTC'

// BUY / SELL PANEL //////////////////////////////////////////////////////
function buy() {
    var _amount = $('#buy-amount').val();

    // Reset input values
    clearBuySellPanel()

    // Call /action to perform a Buy
    $.ajax({
        url: buy_post_path,
        data: { currency: currency, amount: _amount },
        type: 'POST'
    })
        .then(res => {
            if (res.successful) {
                alert(res.message)

                // Update panels
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
    var _amount = $('#sell-amount').val();

    clearBuySellPanel()

    $.ajax({
        url: sell_post_path,
        data: { currency: currency, amount: _amount },
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

function clearBuySellPanel() {
    $('#buy-amount').val('');
    $('#buy-cost').html('0');
    $('#sell-amount').val('');
    $('#sell-profit').html('0')
}

function editMoney(_amount) {
    $.ajax({
        url: add_money_post_path,
        data: { amount: _amount },
        type: 'POST'
    })
        .then(res => {
            if (res.successful) {
                alert(res.message)

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


// CHART PANEL ///////////////////////////////////////////////////////////
function getPriceHistory() {
    // This function gets the prices to be displayed in the chart
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
            //console.log(res);

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
        url: plannedaction_get_path + user_id,
        type: 'GET'
    })
        .then(res => {
            //console.log(res);

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
        html = '<tr><td colspan=' + (type == 'plannedaction' ? 5 : 4) + '>Nothing to show</td></tr>'
    }
    else {
        rows = ''
        row = ''

        list.forEach(t => {
            row = '<tr>'

            if (t.action == 'SELL')
                row += '<td class="w3-red">SELL</td>'
            else if (t.action == 'BUY')
                row += '<td class="w3-green">BUY</td>'

            if (t.hasOwnProperty('BTC')) {
                row += '<td>BTC</td>'
                row += '<td>' + t.BTC.toFixed(2) + '</td>'
            }
            else if (t.hasOwnProperty('ETH')) {
                row += '<td>ETH</td>'
                row += '<td>' + t.ETH.toFixed(2) + '</td>'
            }

            row += '<td>' + t.USD.toFixed(2) + '</td>'

            if (type == 'plannedaction') {
                row += '<td>'

                if (t.state == 'IDLE') {
                    row += '<div class="w3-hover-red btn-cancel-plannedaction" data-pa_id="' + t._id + '">'
                    row += '<div class="new-label"><span>' + t.state + '</span></div>'
                    row += '</div>'
                }
                else {
                    row += t.state
                }

                row += '</td>'
            }

            row += '</tr>'

            rows = row + rows
        });

        html += rows
    }
    return html;
}


// PLANNED ACTION ///////////////////////////////////////////////////
function addPlannedAction(action, plannedaction) {
    console.log('BUY', plannedaction.currency, plannedaction.amount, plannedaction.USD)

    $.ajax({
        url: plannedaction_post_delete_path + action,
        data: plannedaction,
        type: 'POST'
    })
        .then(res => {
            if (res.successful) {
                alert(res.message)

                updatePlannedactionList()
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

function cancelPlannedaction(pa_id) {
    $.ajax({
        url: plannedaction_post_delete_path + pa_id,
        type: 'DELETE'
    })
        .then(res => {
            console.log(res);

            if (res.successful) {
                alert(res.message)

                updatePlannedactionList()
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


// LISTENERS ////////////////////////////////////////////////////////////
$('#currency-selector').on('change', function (e) {
    console.log('Selected', this.value)

    if (this.value == 'BTCUSD')
        currency = 'BTC'
    else if (this.value == 'ETHUSD')
        currency = 'ETH'


    // Reset Buy/sell panel
    clearBuySellPanel()

    // Get data for the chart and update it
    getPriceHistory()
})

$('#buy-amount').on('input', function (e) {
    if (currency == 'BTC')
        $('#buy-cost').html((this.value * current_BTCUSD).toFixed(2))
    else if (currency == 'ETH')
        $('#buy-cost').html((this.value * current_ETHUSD).toFixed(2))
})

$('#sell-amount').on('input', function (e) {
    if (currency == 'BTC')
        $('#sell-profit').html((this.value * current_BTCUSD).toFixed(2))
    else if (currency == 'ETH')
        $('#sell-profit').html((this.value * current_ETHUSD).toFixed(2))
})

$('#btn-buy').click(buy)

$('#btn-sell').click(sell)

$('#btn-add-money').click(function() { editMoney(1000) })
$('#btn-remove-money').click(function() { editMoney(-1000) })

$('#elem-history-selector').on('change', function (e) {
    console.log('Chosen points', this.value)

    nElemHistory = this.value
    getPriceHistory()
})

$('#plannedaction_list').on('click', '.btn-cancel-plannedaction', function () {
    var pa_id = $(this).data('pa_id')
    console.log( 'Cancel plannedaction', pa_id )
    
    cancelPlannedaction(pa_id)
});

// INIT /////////////////////////////////////////////////////////////////
// Trigger change / update on startup
$('#currency-selector').trigger('change');

// Update GUI
updateTransactionList()
updatePlannedactionList()