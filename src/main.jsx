import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './reference.css';
import './app.css';

/* 리렌더 하이라이트는 기본으로 꺼 둔다. 보려면 VITE_REACT_DEVTOOLS=1 로 dev 서버를 켠다. */
if (import.meta.env.DEV && import.meta.env.VITE_REACT_DEVTOOLS === '1') {
  void import('react-grab');
  void import('react-scan').then(({ scan }) => scan({ enabled: true, showToolbar: false }));
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
