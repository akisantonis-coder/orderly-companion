import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { db } from './lib/db';
import './index.css';

// Enable persistent storage to prevent data deletion
async function enablePersistentStorage() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('Storage persistence:', isPersisted ? 'enabled' : 'denied');
      
      // Also check quota
      const estimate = await navigator.storage.estimate();
      console.log('Storage quota:', estimate.quota, 'used:', estimate.usage);
    } catch (error) {
      console.warn('Failed to enable persistent storage:', error);
    }
  }
}

// Initialize database and enable persistence
db.open().then(() => {
  console.log('Database opened successfully');
  enablePersistentStorage();
}).catch(error => {
  console.error('Failed to open database:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
