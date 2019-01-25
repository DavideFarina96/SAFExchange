var transactions_get_path = '/interface/transaction/user/'
var transactions_post_path = '/interface/transaction/'

var plannedactions_get_path = '/interface/plannedaction/user/'
var plannedactions_post_path = '/interface/plannedaction/'

var currency = 'BTC'

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


// LISTENERS

$('#user-stats').click((event) => {
    $('#logout-container').toggle();
})

$('#currency-selector').change((event) => {
    if (this.value == 'BTCUSD')
        currency = 'BTC'
    else if (this.value == 'ETHUSD')
        currency = 'ETH'

    // Update GUI
    updateTransactionList()
    updatePlannedactionList()
})


// Trigger change / update on startup
$('#currency-selector').trigger('change');