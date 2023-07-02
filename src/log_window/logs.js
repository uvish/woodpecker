const { ipcRenderer } = require('electron');

        let stats = document.getElementById('logs');
        let list = document.getElementById('list')
        let i=1;

        function clearLogs(){
            list.innerHTML = null
        }

        function Average(latencies) {
            if (latencies.length === 0) {
              return 0;
            }
            const sum = latencies.reduce((total, latency) => total + latency, 0);
            const average = sum / latencies.length;
            return average;
          }
          
          function calculatePercentile(latencies, percentile) {
            if (latencies.length === 0) {
              return 0;
            }
            const sortedLatencies = latencies.slice().sort((a, b) => a - b);
            const index = Math.ceil((percentile / 100) * sortedLatencies.length);
            const percentileValue = sortedLatencies[index - 1];
            return percentileValue;
          }
          


        ipcRenderer.on('printLogs',(event ,log)=>{
            let node = document.createElement('li');
            if(list.querySelectorAll('li').length>0 && list.lastElementChild.textContent == log){
                list.lastElementChild.setAttribute("value",i)
                i=i+1;
            }else{
                i=1;
                if(log.charAt(0) == '>'){  // for console logs
                    node.style.listStyle = 'none';
                    node.style.color = 'green';
                    node.style.fontWeight = 'bold';

                }else{
                    node.setAttribute("value",i)
                }
                
                node.appendChild(document.createTextNode(log));
                list.appendChild(node)
                node.scrollIntoView()
            }

        })

        ipcRenderer.on('printStats',(event ,res)=>{
            console.log(res)
             let statObject ={};
             res.status.forEach((code)=>{
              if (statObject.status == undefined) {
                  statObject.status = { [code]: 1 };
                } else if (statObject.status[code] == undefined) {
                  statObject.status[code] = 1;
                } else {
                  statObject.status[code] += 1;
                }
             })
             statObject.AverageLatency = Average(res.latencies)+'ms';
             statObject.P95 = calculatePercentile(res.latencies,95)+'ms';
             statObject.P99 = calculatePercentile(res.latencies,99)+'ms';
             statObject.time = res.time+'ms';

             let node = document.createElement('li');
             let pre = document.createElement('pre');
             pre.textContent = JSON.stringify(statObject,null,2);

            //  node.appendChild(document.createTextNode("> "+JSON.stringify(statObject,null,2)))

            pre.style.width = '90%';
            pre.style.backgroundColor = 'lightgrey';
            pre.style.borderRadius = '5px';
            pre.style.padding = '10px';

             node.appendChild(pre)
             list.appendChild(node);
             node.scrollIntoView();

             node.style.listStyle = 'none';
             node.style.color = 'green';
             node.style.fontWeight = 'bold';
            //  stats.value = stats.value+JSON.stringify(statObject,null,2);
          })