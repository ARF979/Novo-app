import React, { useState } from 'react';
import './App.css'; // We will create this file for styling

function App() {
  const [templateFile, setTemplateFile] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [values, setValues] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Handle template file selection
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setTemplateFile(file);
      setStatus('Extracting placeholders...');
      setError('');
      // Use the exposed API to process the file
      const result = await window.electronAPI.extractPlaceholders(file.path);
      if (result.success) {
        setPlaceholders(result.placeholders);
        setValues(result.placeholders.reduce((acc, key) => ({ ...acc, [key]: '' }), {}));
        setStatus('Placeholders extracted. Please fill in the values.');
      } else {
        setError(`Error: ${result.error}`);
        setStatus('');
      }
    }
  };

  // Update state when user types into an input field
  const handleValueChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Handle document generation
  const handleGenerate = async (outputFormat) => {
    if (!templateFile) {
      setError('Please select a template file first.');
      return;
    }
    setStatus(`Generating ${outputFormat.toUpperCase()}...`);
    setError('');

    const result = await window.electronAPI.generateDocument({
      templatePath: templateFile.path,
      values,
      outputFormat,
    });

    if (result.success) {
      setStatus(`Document saved successfully at: ${result.path}`);
    } else {
      setError(`Error: ${result.error}`);
      setStatus('');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Document Generator</h1>
        <p>Select a .docx template, fill in the values, and generate your document.</p>
      </header>

      <div className="card">
        <h2>1. Select Template</h2>
        <input type="file" accept=".docx" onChange={handleFileChange} className="file-input" />
        {templateFile && <p className="file-name">Selected: {templateFile.name}</p>}
      </div>

      {placeholders.length > 0 && (
        <div className="card">
          <h2>2. Fill Placeholders</h2>
          <div className="form-grid">
            {placeholders.map((key) => (
              <div key={key} className="form-field">
                <label htmlFor={key}>{key}</label>
                <input
                  id={key}
                  type="text"
                  value={values[key] || ''}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {placeholders.length > 0 && (
        <div className="card">
          <h2>3. Generate Document</h2>
          <div className="button-group">
            <button onClick={() => handleGenerate('docx')}>Generate DOCX</button>
            <button onClick={() => handleGenerate('pdf')}>Generate PDF</button>
          </div>
        </div>
      )}

      <footer className="status-footer">
        {status && <p className="status-message">{status}</p>}
        {error && <p className="error-message">{error}</p>}
      </footer>
    </div>
  );
}

export default App;
