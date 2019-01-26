Chart.defaults.global.defaultFontColor = 'white';

function displayChart(data) {

    var config = {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                backgroundColor: 'rgba(128,203,196, 0.4)',
                borderColor: '#009688',
                data: [
                    1,2,34,23,12,5,23

                    // data

                ],
                fill: 'start'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'BTCUSD Trend'
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

    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

}


// todo get the data to display
displayChart()





/*var colorNames = Object.keys(window.chartColors);
document.getElementById('addDataset').addEventListener('click', function () {
    var colorName = colorNames[config.data.datasets.length % colorNames.length];
    var newColor = window.chartColors[colorName];
    var newDataset = {
        label: 'Dataset ' + config.data.datasets.length,
        backgroundColor: newColor,
        borderColor: newColor,
        data: [],
        fill: false
    };

    for (var index = 0; index < config.data.labels.length; ++index) {
        newDataset.data.push(randomScalingFactor());
    }

    config.data.datasets.push(newDataset);
    window.myLine.update();
});
*/