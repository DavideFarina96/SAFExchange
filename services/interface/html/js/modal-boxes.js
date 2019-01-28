function clearPAbox() {
    // Reset select fields
    $('#box-add-plannedaction').find("select").prop('selectedIndex', 0);
    // Reset input fields
    $('#box-add-plannedaction').find("input").val("");
}




// LISTENERS
$('#btn-add-plannedaction').click(e => {
    $('#box-add-plannedaction').show();
})

$('#pa-box-confirm').click(e => {
    var action = $('#pa-box-action').val();
    var currency = $('#pa-box-currency').val();
    var amount = $('#pa-box-amount').val();
    var usd_total = $('#pa-box-usd-value').val();

    console.log(action, currency, amount, usd_total)
})

$('#pa-box-cancel').click(e => {
    clearPAbox();
    $('#box-add-plannedaction').hide();
})



