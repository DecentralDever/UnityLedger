import { jsx as _jsx } from "react/jsx-runtime";
// main.tsx or App.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './context/WalletProvider';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(WalletProvider, { children: _jsx(App, {}) }) }));
