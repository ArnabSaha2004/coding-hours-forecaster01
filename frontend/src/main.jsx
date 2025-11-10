import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.jsx';
import './styles.css';

// Initialize Capacitor plugins for mobile
if (Capacitor.isNativePlatform()) {
	// Set status bar style for mobile
	StatusBar.setStyle({ style: Style.Dark });
	StatusBar.setBackgroundColor({ color: '#2563eb' });
}

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);



