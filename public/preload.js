const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the React frontend
contextBridge.exposeInMainWorld('electronAPI', {
  extractPlaceholders: (filePath) => ipcRenderer.invoke('extract-placeholders', filePath),
  generateDocument: (options) => ipcRenderer.invoke('generate-document', options),
});
