const { ipcRenderer } = require('electron')

function exportDrawflow(data) {
  console.log(ipcRenderer)
  ipcRenderer.send('dataflow', data)
}