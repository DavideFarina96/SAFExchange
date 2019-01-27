Chart.defaults.global.defaultFontColor = 'white';

var config = {
    datasets: [{
        backgroundColor: 'rgba(128,203,196, 0.4)',
        borderColor: '#009688',
        fill: 'start'
    }]
}

var lastPoint = null


function displayChart(data) {

    var config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: currency + 'USD Trend'
            },
            legend: {
                display: false
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            }
        }
    };

    if (window.myLine)
        window.myLine.destroy();

    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

}

function parseAndDisplayData(res) {
    var labels = []
    var values = []

    res.forEach(price => {

        labels.push(parseTimestampToDateString(price._id))

        if (currency == 'BTC')
            values.push(price.BTCUSD)
        else if (currency == 'ETH')
            values.push(price.ETHUSD)
    });

    config.labels = labels
    config.datasets[0].data = values

    displayChart(config)

    // Set last point
    lastPoint = res[res.length - 1]
}

function parseTimestampToDateString(timestamp) {
    timestamp = timestamp.toString().substring(0, 8)
    date = new Date(parseInt(timestamp, 16) * 1000)

    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();

    // Will display time in 10:30 format
    return hours + ':' + minutes.substr(-2);
}

function newChartPoint(newPoint) {
    if (lastPoint != null && lastPoint._id != newPoint._id) {
        lastPoint = newPoint

        // Add new point and remove oldest one
        console.log('New point to be added in chart')

        config.labels.push(parseTimestampToDateString(newPoint._id));
        config.labels.shift()

        if (currency == 'BTC')
            var value = newPoint.BTCUSD
        else if (currency == 'ETH')
            var value = newPoint.ETHUSD

        config.datasets[0].data.push(value)
        config.datasets[0].data.shift()

        window.myLine.update();
    }
}