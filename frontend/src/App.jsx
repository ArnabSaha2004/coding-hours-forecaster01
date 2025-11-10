import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function useAuthToken() {
	const [token, setToken] = useState(() => localStorage.getItem('token') || '');
	useEffect(() => {
		if (token) {
			localStorage.setItem('token', token);
		} else {
			localStorage.removeItem('token');
		}
	}, [token]);
	return { token, setToken };
}

function App() {
	const { token, setToken } = useAuthToken();

	const handleLogin = (newToken) => {
		setToken(newToken);
		// Force update by setting token in localStorage immediately
		localStorage.setItem('token', newToken);
	};

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path="/login"
					element={
						token ? (
							<Navigate to="/dashboard" replace />
						) : (
							<Login onLogin={handleLogin} />
						)
					}
				/>
				<Route
					path="/dashboard"
					element={
						token ? (
							<Dashboard token={token} setToken={setToken} />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
