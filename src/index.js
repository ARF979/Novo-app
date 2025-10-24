import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the entry point of the React app.
// It finds the 'root' div in public/index.html and renders our App component inside it.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

