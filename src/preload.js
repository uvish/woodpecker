const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  drawChart: (callback) => ipcRenderer.on('drawChart', callback),
  updateChart: (callback) => ipcRenderer.on('updateChart', callback),
  printLogs: (callback) => ipcRenderer.on('printLogs', callback),
  printStats: (callback) => ipcRenderer.on('printStats', callback)
})