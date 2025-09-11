import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

console.log('Index.js loading...');

const container = document.getElementById('root');
console.log('Container found:', container);

if (!container) {
  console.error('Root container not found!');
} else {
  const root = createRoot(container);
  console.log('React root created');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered');
}
