
const { ipcRenderer } = require('electron');


var chart;
var g;
var graphData = [];
let stats = document.getElementById('stats');

const startbtn = document.getElementById('startBtn');

function callStart(){
  const url = document.getElementById('url').value;
  const iterations = document.getElementById('iterations').value;
  const concurrency = document.getElementById('concurrency').value;
  const postdata = document.getElementById('postdata').value;
  const delay = document.getElementById('delay').value;
  const headersJson = document.getElementById('headers').value;
  let method = document.getElementById('method').value;
  
  ipcRenderer.send('start',method,url,iterations,concurrency,postdata,delay,headersJson);
  startbtn.value = 'Running..';
  document.getElementById('stats').value=''
}
function callStop(){
  ipcRenderer.send('stop');
  startbtn.value = 'Start';
}

ipcRenderer.on('start-reply', (event, result) => {
  console.log(result);
  startbtn.value = 'Start';
});

// ipcRenderer.on('drawChart',(event,result)=>{
//   const chartCanvas = document.getElementById('chart');
//   if(chart)chart.destroy();
//   chart = new Chart(chartCanvas, {
//       type: 'line',
//       data: {
//           labels:result.map((_, index) => index.toString()),
//           datasets: [{
//             label: 'Latencies in ms',
//             data: result,
//             fill: false,
//             borderColor: 'rgb(75, 192, 192)',
//             tension: 0.15
//           }]
//         },
//         options: {
//           responsive: true,
//           scales: {
//             y: {
//               beginAtZero: true
//             }
//           }
//         }
//     });
// })

// ipcRenderer.on('updateChart',(event,responseTime)=>{
//   chart.data.labels.push(chart.data.labels.length.toString());
//   chart.data.datasets[0].data.push(responseTime);
//   chart.update()
// })

ipcRenderer.on('drawChart',(event,result)=>{
      graphData = result;
      graph = new Dygraph(document.getElementById("div_g"), graphData,
                          {
                            title :'',
                            drawPoints: true,
                            labels: ['Iteration', 'Latency'],
                            showRangeSelector: true,
                          });
})

ipcRenderer.on('updateChart',(event,responseTime,itr)=>{
        graphData.push([itr, responseTime]);
        checkUIThreadIdleUpdateChart()
})

function checkUIThreadIdleUpdateChart() {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(function (deadline) {
      if (deadline.timeRemaining() > 0) {
        graph.updateOptions( { 'file': graphData } );
      } else {
        console.log('waiting for UI thread..')
      }
    });
  } else {
    console.log("requestIdleCallback is not supported");
  }
}

