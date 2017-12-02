$(document).ready(function() {
  var chart = Highcharts.chart('container', {
    // Declare chart type and basic information
    chart: {
      type: 'scatter',
      zoomType: 'xy'
    },
    title: {
      text: 'Sentiment Over Time '
    },
    subtitle: {
      text: 'Made with <3'
    },

    // Set up xAxis Attributes
    xAxis: {
      type: 'datetime',
      title: {
        enabled: true,
        text: 'Date'
      },
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true
    },
    yAxis: {
      title: {
        text: 'Sentiment'
      }
    },
    legend: {
      layout: 'vertical',
      align: 'left',
      verticalAlign: 'top',
      x: 100,
      y: 70,
      floating: true,
      backgroundColor: '#FFFFFF',
      borderWidth: 1
    },

    plotOptions: {
      scatter: {
        // Allows for dictionary format despite high data amount > 1000
        turboThreshold: 0,

        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        }
      },
      series: {
        point: {
          events: {
            click: function() {
              alert("Tweet Text:\n" + this.tweetText);
              console.log("This x = " + this.x);
              console.log("This y = " + this.y)
                console.log("This tweetID = " + this.tweetId);
              console.log("This tweetText = " + this.tweetText)
            }
          }
        }
      }
    },

    series: [{
      // Title of Each Point
      name: 'Sentiment',

      // Change colors based on POSITIVE, NEGATIVE, NEUTRAL
      zones: [
      {
        // Negatie - Red
        value: -5,
        color: 'rgba(247, 46, 70, .5)' 
      }, {
        // Neutral - Blue
        value: 5,
        color: 'rgba(81, 185, 255, .5)'
      }, {
        // Positive - Green
        color: 'rgba(48, 229, 81, .5)'
      }
      ],

      pointInterval: 86400000,

      // Pointer description
      pointDescriptionFormatter: function() {
        return 'The value for <b>' + this.x + '</b> is <b>' + this.y + '</b>, in series '+ this.series.name;
      },
      data: []
    },
    {	// Series dedicated for retweets

      // Display Linear Regression
      regression: true,
      regressionSettings: {
        type: 'polynomial',
        color:  'rgba(229, 70, 52, .7)'
      },

      // Title of Each Point
      name: 'Sentiment',

      // Change colors based on POSITIVE, NEGATIVE, NEUTRAL
      zones: [
      {
        // Negatie - Red
        value: -5,
        color: 'rgba(247, 46, 70, .5)' 
      }, {
        // Neutral - Blue
        value: 5,
        color: 'rgba(81, 185, 255, .5)'
      }, {
        // Positive - Green
        color: 'rgba(48, 229, 81, .5)'
      }
      ],

      pointInterval: 86400000,

      // Pointer description
      pointDescriptionFormatter: function() {
        return 'The value for <b>' + this.x + '</b> is <b>' + this.y + '</b>, in series '+ this.series.name;
      },
      data: []
    }]
  });


  $('#hideRetweets').click(function () {
    console.log("Hide retweets")
      chart.series[1].hide();
  });
  $('#showRetweets').click(function () {
    console.log("Show retweets")
      chart.series[1].show();
  });

  /* Websockets */

  // Use a "/test" namespace.
  // An application can open a connection on multiple namespaces, and
  // Socket.IO will multiplex all those connections on a single
  // physical channel. If you don't care about multiple channels, you
  // can set the namespace to an empty string.
  var namespace = '/streaming'
    , protocol = location.protocol
    , port = location.port
    , domain = document.domain;

  // Connect to the Socket.IO server.
  // The connection URL has the following format:
  //     http[s]://<domain>:<port>[/<namespace>]
  var socket = io.connect(protocol + '//' + domain + ':' + port + namespace);

  // Event handler for new connections.
  // The callback function is invoked when a connection with the
  // server is established.
  $("#hashtag").keydown(function(e) {
    if (e.keyCode === 13) {
      socket.emit('start_stream', { hashtag : $(this).val() });
    }
  });

  // Event handler for server sent data.
  // The callback function is invoked whenever the server emits data
  // to the client. The data is then displayed in the "Received"
  // section of the page.
  socket.on('response', function(msg) {
    $('#log').append('<br>' + $('<div/>')
             .text('Received #' + msg.sentiment + ': ' + msg.text)
             .html());
    console.log("Retweeted: " + msg.retweeted);
    // Dynamically add points to the first series
    if( msg.retweeted ) {
      chart.series[1].addPoint(msg.sentiment * 100, true, false, true);
    } else {
      chart.series[0].addPoint(msg.sentiment * 100, true, false, true);
    }
  });

  // Interval function that tests message latency by sending a "ping"
  // message. The server then responds with a "pong" message and the
  // round trip time is measured.
  var ping_pong_times = [];
  var start_time;
  window.setInterval(function() {
    start_time = (new Date).getTime();
    socket.emit('my_ping');
  }, 1000);

  // Handler for the "pong" message. When the pong is received, the
  // time from the ping is stored, and the average of the last 30
  // samples is average and displayed.
  socket.on('my_pong', function() {
    var latency = (new Date).getTime() - start_time;
    ping_pong_times.push(latency);
    ping_pong_times = ping_pong_times.slice(-30); // keep last 30 samples
    var sum = 0;
    for (var i = 0; i < ping_pong_times.length; i++)
      sum += ping_pong_times[i];
    $('#ping-pong').text(Math.round(10 * sum / ping_pong_times.length) / 10);
  });
});
