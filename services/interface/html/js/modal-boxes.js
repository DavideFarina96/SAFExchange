function clearPAbox() {
    // Reset select fields
    $('#box-add-plannedaction').find("select").prop('selectedIndex', 0);
    // Reset input fields
    $('#box-add-plannedaction').find("input").val("");
    // Reset label total USD
    $('#pa-box-total-usd').html(0)
    
    $('#box-add-plannedaction').hide();
}

function updatePATotal() {
    $('#pa-box-total-usd').html( $('#pa-box-amount').val() * $('#pa-box-usd-value').val() )
}


// LISTENERS ////////////////////////////////////////////////////////////
$('#btn-add-plannedaction').click(e => {
    $('#box-add-plannedaction').show();
})

$('#pa-box-amount').on('input', updatePATotal)
$('#pa-box-usd-value').on('input', updatePATotal)

$('#pa-box-confirm').click(e => {
    var _action = $('#pa-box-action').val();
    var _currency = $('#pa-box-currency').val();
    var _amount = $('#pa-box-amount').val();
    var _usd_value = $('#pa-box-usd-value').val();

    var plannedaction = {
        currency: _currency,
        amount: _amount,
        USD: _usd_value
    }

    addPlannedAction(_action, plannedaction)

    clearPAbox()
})

$('#pa-box-cancel').click(e => {
    clearPAbox();
})



