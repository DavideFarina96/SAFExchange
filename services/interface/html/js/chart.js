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
            elements: {
                point: { radius: 0, hitRadius: 10, hoverRadius: 10 }
            },
            scales: {
                xAxes: [{
                    display: true,
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
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
    var values = []

    res.forEach(price => {
        var tmp = {}

        tmp.x = parseTimestampToDate(price._id)

        if (currency == 'BTC')
            tmp.y = price.BTCUSD
        else if (currency == 'ETH')
            tmp.y = price.ETHUSD

        values.unshift(tmp)
    });

    //config.labels = labels
    config.datasets[0].data = values

    displayChart(config)

    // Set last point
    lastPoint = res[res.length - 1]
}

function parseTimestampToDate(timestamp) {
    timestamp = timestamp.toString().substring(0, 8)
    date = new Date(parseInt(timestamp, 16) * 1000)

    return date;
}

function newChartPoint(newPoint) {
    if (lastPoint != null && lastPoint._id != newPoint._id) {
        lastPoint = newPoint

        // Add new point and remove oldest one
        console.log('New point to be added in chart')

        var tmp = {}

        tmp.x = parseTimestampToDate(newPoint._id)

        if (currency == 'BTC')
            tmp.y = newPoint.BTCUSD
        else if (currency == 'ETH')
            tmp.y = newPoint.ETHUSD

        config.datasets[0].data.push(tmp)
        config.datasets[0].data.shift()

        window.myLine.update();
    }
}