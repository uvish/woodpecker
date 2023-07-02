const { app, BrowserWindow ,ipcMain } = require('electron');
const path = require('path');
const url = require('url')
const axios = require('axios')

let mainWindow = null
let logWindow = null
var stop = false;
var log = [];


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
      // preload: path.join(__dirname, 'preload.js'), 
    },
    icon: '../assets/icon.png'
  });
  mainWindow.loadFile(path.join(__dirname,'main_window', 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('ready', ()=>{
    createWindow();
    openLogWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


function openLogWindow(){
  //  open log window
   logWindow = new BrowserWindow({
   width: 800,
   height: 600,
   backgroundColor: "#111",
   webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
    // preload: path.join(__dirname, 'preload.js'), 
  }
 })

 logWindow.loadURL(url.format({
   pathname: path.join(__dirname,'log_window', 'logs.html'),
   protocol: 'file:',
   slashes: true
 }))

 logWindow.once('ready-to-show', () => {
   logWindow.show()
 })
}


ipcMain.on('stop',()=>{
  stop = true;
})

ipcMain.on('start',async (event,method,url,iterations,concurrency,postdata,delay,headersJson)=>{
  log=[]
  //  openLogWindow()
   const result = await start(method,url,concurrency,iterations,postdata,delay,headersJson);
   event.sender.send('start-reply',result);
})

async function start(method,url,concurrency,iterations,postdata,delay,headersJson){

  try{
    if(url == ''){
      logWindow.send('printLogs',`> URL cannot be blank.`);
      return ;
    }

    if(iterations == '' || parseInt(iterations)<0 ){
      logWindow.send('printLogs',`> ${iterations} ${typeof(iterations)} : Number of Iterations invalid , Should be a positive number.`);
      return;
    }

    if(concurrency == '' || parseInt(concurrency)<0){
      logWindow.send('printLogs',`> ${concurrency} ${typeof(concurrency)} : Number of Concurrent Users , Should be a positive number. Using 1.`);
     concurrency = 1;
    }

    if(delay == '' || parseInt(delay)<0)
      delay = 0;
  }catch(err){
    console.log(err)
  }

   

  var startTime = new Date().getTime();
  var latencies = [];
  var status = [];

  logWindow.send('printLogs',`> started ${url} I:${iterations} C:${concurrency} D:${delay}`)

  axios.interceptors.request.use( x => {
      x.meta = x.meta || {}
      x.meta.requestStartedAt = new Date().getTime();
      return x;
  })
  axios.interceptors.response.use(x => {
      x.responseTime = new Date().getTime() - x.config.meta.requestStartedAt;
      return x;
  },
  x => {
      x.responseTime = new Date().getTime() - x.config.meta.requestStartedAt;
      throw x;
  })


  var concurrentList = [];
  var itr = 1;
  var isEnough = false;
  mainWindow.webContents.send('drawChart', [])
  while(true){
      for(let c=1;c<=concurrency;c++){

          if(itr > iterations){
              isEnough =true;
              break;
          }
          let headers = {};
          if(headersJson != ""){
          headers= JSON.parse(headersJson);
          }

              concurrentList.push(
              axios({method:method,url:url,headers,data:postdata})
              .then(function (response) {
              return response;
              })
              .catch(function (error) {
              return(error);
              })
          ); 

          // console.log(`itr : ${itr} , conc : ${c}`)
          itr += 1;  
      }  
      await Promise.all(concurrentList)
      .then((responses)=>{
          responses.forEach((res)=>{
              if(res.status){
                  status.push(res.status);
                  // log.push(JSON.stringify(res.data)+'\n')
                  logWindow.send('printLogs','status'+':'+JSON.stringify(res.status)+" | "+'body'+":"+JSON.stringify(res.data)+" | "+'headers'+":"+JSON.stringify(res.headers)+'\n')
                 mainWindow.send('updateChart',res.responseTime,itr);
                  // latencies.push(res.responseTime);
              }else{
                if(res.response){
                  status.push(res.response.status);
                  logWindow.send('printLogs','status'+':'+JSON.stringify(res.response.status)+" | "+'body'+":"+JSON.stringify(res.data)+" | "+'headers'+":"+JSON.stringify(res.headers)+'\n')
                  // log.push(JSON.stringify(res.data)+'\n')
                }else{
                  status.push('Failed');
                  logWindow.send('printLogs',res.message+'\n')
                  // log.push(res.message+'\n')
                }
                  //  latencies.push(res.responseTime);
                  mainWindow.send('updateChart',res.responseTime,itr)  
              }
              //mainWindow.send('printLogs',log)
              latencies.push(res.responseTime);
      })  
    })
      .catch((err)=>{
          console.error(err)
      })
      concurrentList = []
      if(isEnough || stop){
          var finishTime = new Date().getTime();
          let res ={'status':status,'latencies':latencies}

          if(stop){
            stop =false;
            logWindow.send('printLogs','> stopped')
          }else{
            logWindow.send('printLogs','> done..')
          }
          //mainWindow.send('printStats',{'latencies':latencies,'status':status,'time':finishTime-startTime})
          logWindow.send('printStats',{'latencies':latencies,'status':status,'time':finishTime-startTime})
          // logWindow.send('printLogs',log)
          return res;
          break;
      }
      if(delay!=0){
        logWindow.send('printLogs',`> waiting for : ${delay} ms`)
          // console.log(`waiting for : ${delay} ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
      }
  }

}
