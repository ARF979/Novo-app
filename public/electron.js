const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
const { promisify } = require('util');

// Promisify the libreoffice-convert function
libre.convertAsync = promisify(libre.convert);

// Main function to create the application window
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load the React app from the local server in development
  // Or from the built file in production
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  win.loadURL(startUrl);
}

// App lifecycle events
app.whenReady().then(createWindow);

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


// --- IPC HANDLERS FOR FILE PROCESSING ---

// Handle request to extract placeholders from a DOCX file
ipcMain.handle('extract-placeholders', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    const text = doc.getFullText();
    const regex = /\{(.*?)\}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return { success: true, placeholders: Array.from(matches) };
  } catch (error) {
    console.error('Error extracting placeholders:', error);
    return { success: false, error: error.message };
  }
});

// Handle request to generate the final document
ipcMain.handle('generate-document', async (event, { templatePath, values, outputFormat }) => {
  try {
    // 1. Read the template file
    const content = await fs.readFile(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // 2. Render the template with user-provided values
    doc.render(values);
    const renderedDocxBuffer = doc.getZip().generate({ type: 'nodebuffer' });

    // 3. Show a "Save" dialog to the user
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Document',
      defaultPath: `document.${outputFormat}`,
      filters: [{ name: outputFormat.toUpperCase(), extensions: [outputFormat] }],
    });

    if (!filePath) {
      // User cancelled the save dialog
      return { success: false, error: 'Save cancelled' };
    }

    // 4. Save the file based on the selected format
    if (outputFormat === 'docx') {
      await fs.writeFile(filePath, renderedDocxBuffer);
    } else if (outputFormat === 'pdf') {
      // Use LibreOffice to convert the rendered DOCX buffer to PDF
      const pdfBuffer = await libre.convertAsync(renderedDocxBuffer, '.pdf', undefined);
      await fs.writeFile(filePath, pdfBuffer);
    }

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error generating document:', error);
    return { success: false, error: error.message };
  }
});
