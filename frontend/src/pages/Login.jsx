import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function Login({ onLogin }) {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [isRegistering, setIsRegistering] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [showResetPassword, setShowResetPassword] = useState(false);
	const [resetToken, setResetToken] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		try {
			const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
			const res = await fetch(`${API_BASE}${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json().catch(() => ({ message: 'Failed to parse response' }));

			if (res.ok) {
				const token = data.token;
				localStorage.setItem('token', token);
				if (onLogin) {
					onLogin(token);
				}
				navigate('/dashboard', { replace: true });
			} else {
				// Check for database connection errors
				if (res.status === 503 || data.message?.includes('Database') || data.message?.includes('MongoDB')) {
					setError('Database connection error. MongoDB is not running. Please start MongoDB or use MongoDB Atlas (cloud).');
				} else {
					setError(data.message || (isRegistering ? 'Registration failed' : 'Login failed'));
				}
				setLoading(false);
			}
		} catch (err) {
			console.error('Auth error:', err);
			if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
				setError('Cannot connect to server. Make sure the backend is running on http://localhost:4000');
			} else {
				setError('Network error. Make sure the backend server is running.');
			}
			setLoading(false);
		}
	}

	async function handleForgotPassword(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		try {
			const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			const data = await res.json().catch(() => ({ message: 'Failed to parse response' }));

			if (res.ok) {
				setSuccess(data.message || 'Password reset instructions sent to your email.');
				// In development, show the token
				if (data.resetToken) {
					setResetToken(data.resetToken);
					setShowForgotPassword(false);
					setShowResetPassword(true);
					setSuccess('Reset token generated. Use it below to set your new password.');
				}
			} else {
				setError(data.message || 'Failed to send reset email.');
			}
		} catch (err) {
			console.error('Forgot password error:', err);
			setError('Network error. Make sure the backend server is running.');
		} finally {
			setLoading(false);
		}
	}

	async function handleResetPassword(e) {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (newPassword !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		if (newPassword.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: resetToken, newPassword }),
			});

			const data = await res.json().catch(() => ({ message: 'Failed to parse response' }));

			if (res.ok) {
				setSuccess(data.message || 'Password reset successfully! You can now login.');
				setTimeout(() => {
					setShowResetPassword(false);
					setResetToken('');
					setNewPassword('');
					setConfirmPassword('');
				}, 2000);
			} else {
				setError(data.message || 'Failed to reset password.');
			}
		} catch (err) {
			console.error('Reset password error:', err);
			setError('Network error. Make sure the backend server is running.');
		} finally {
			setLoading(false);
		}
	}

	const isFormValid = email && password && (isRegistering ? password.length >= 8 : true);

	// Show reset password form
	if (showResetPassword) {
		return (
			<div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 via-red-500 via-orange-500 to-yellow-500 animate-gradient">
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
				</div>

				<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
					<div className="w-full max-w-md">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl shadow-2xl mb-6">
								<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
								</svg>
							</div>
							<h1 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
								<span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
									Reset Password
								</span>
							</h1>
							<p className="text-white/90 text-lg font-medium drop-shadow-md">Enter your reset token and new password</p>
						</div>

						<div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-white/50">
							<form onSubmit={handleResetPassword} className="space-y-5">
								<div>
									<label htmlFor="reset-token" className="block text-sm font-bold text-gray-700 mb-2">
										<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
											Reset Token
										</span>
									</label>
									<input
										id="reset-token"
										type="text"
										required
										value={resetToken}
										onChange={(e) => setResetToken(e.target.value)}
										className="block w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-pink-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
										placeholder="Enter reset token"
									/>
								</div>

								<div>
									<label htmlFor="new-password" className="block text-sm font-bold text-gray-700 mb-2">
										<span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
											New Password
										</span>
									</label>
									<input
										id="new-password"
										type="password"
										required
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="block w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
										placeholder="Enter new password"
										minLength={8}
									/>
									<p className="mt-1.5 text-xs text-orange-600 font-medium">Minimum 8 characters required</p>
								</div>

								<div>
									<label htmlFor="confirm-password" className="block text-sm font-bold text-gray-700 mb-2">
										<span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
											Confirm Password
										</span>
									</label>
									<input
										id="confirm-password"
										type="password"
										required
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="block w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-yellow-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
										placeholder="Confirm new password"
										minLength={8}
									/>
								</div>

								{error && (
									<div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
										<svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
										</svg>
										<p className="text-sm text-red-700 font-medium">{error}</p>
									</div>
								)}

								{success && (
									<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
										<svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<p className="text-sm text-green-700 font-medium">{success}</p>
									</div>
								)}

								<button
									type="submit"
									disabled={!resetToken || !newPassword || !confirmPassword || loading}
									className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95"
								>
									{loading ? (
										<span className="flex items-center justify-center gap-3">
											<svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
											</svg>
											<span>Resetting Password...</span>
										</span>
									) : (
										'Reset Password'
									)}
								</button>

								<button
									type="button"
									onClick={() => {
										setShowResetPassword(false);
										setResetToken('');
										setNewPassword('');
										setConfirmPassword('');
										setError('');
										setSuccess('');
									}}
									className="w-full text-center text-purple-600 hover:text-pink-600 font-bold transition-colors"
								>
									Back to Login
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Show forgot password form
	if (showForgotPassword) {
		return (
			<div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 via-red-500 via-orange-500 to-yellow-500 animate-gradient">
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
				</div>

				<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
					<div className="w-full max-w-md">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl shadow-2xl mb-6">
								<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<h1 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
								<span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
									Forgot Password?
								</span>
							</h1>
							<p className="text-white/90 text-lg font-medium drop-shadow-md">Enter your email to receive reset instructions</p>
						</div>

						<div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-white/50">
							<form onSubmit={handleForgotPassword} className="space-y-5">
								<div>
									<label htmlFor="forgot-email" className="block text-sm font-bold text-gray-700 mb-2">
										<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
											Email Address
										</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											</svg>
										</div>
										<input
											id="forgot-email"
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="block w-full pl-10 pr-3 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-pink-500 transition-all text-gray-900 placeholder-gray-400 bg-white"
											placeholder="you@example.com"
										/>
									</div>
								</div>

								{error && (
									<div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
										<svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
										</svg>
										<p className="text-sm text-red-700 font-medium">{error}</p>
									</div>
								)}

								{success && (
									<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
										<svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<p className="text-sm text-green-700 font-medium">{success}</p>
									</div>
								)}

								<button
									type="submit"
									disabled={!email || loading}
									className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95"
								>
									{loading ? (
										<span className="flex items-center justify-center gap-3">
											<svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
											</svg>
											<span>Sending...</span>
										</span>
									) : (
										'Send Reset Link'
									)}
								</button>

								<button
									type="button"
									onClick={() => {
										setShowForgotPassword(false);
										setError('');
										setSuccess('');
									}}
									className="w-full text-center text-purple-600 hover:text-pink-600 font-bold transition-colors"
								>
									Back to Login
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Main login/register form
	return (
		<div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 via-red-500 via-orange-500 to-yellow-500 animate-gradient">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
			</div>

			{/* Content */}
			<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
				<div className="w-full max-w-md">
					{/* Logo/Header */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
							<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<h1 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
							<span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
								Coding Hours
							</span>
							<br />
							<span className="bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-200 bg-clip-text text-transparent">
								Forecaster
							</span>
						</h1>
						<p className="text-white/90 text-lg font-medium drop-shadow-md">Track your coding time and forecast your progress</p>
					</div>

					{/* Card */}
					<div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-white/50">
						{/* Toggle Register/Login */}
						<div className="flex items-center justify-center mb-6 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 rounded-xl p-1">
							<button
								type="button"
								onClick={() => {
									setIsRegistering(false);
									setError('');
									setSuccess('');
								}}
								className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
									!isRegistering
										? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
										: 'text-purple-600 hover:text-pink-600'
								}`}
							>
								Login
							</button>
							<button
								type="button"
								onClick={() => {
									setIsRegistering(true);
									setError('');
									setSuccess('');
								}}
								className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
									isRegistering
										? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-lg transform scale-105'
										: 'text-pink-600 hover:text-orange-600'
								}`}
							>
								Register
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-5">
							{/* Email Field */}
							<div>
								<label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
									<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
										Email Address
									</span>
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<input
										id="email"
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="block w-full pl-10 pr-3 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-pink-500 transition-all text-gray-900 placeholder-gray-400 hover:border-purple-400 bg-white"
										placeholder="you@example.com"
									/>
								</div>
							</div>

							{/* Password Field */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<label htmlFor="password" className="block text-sm font-bold text-gray-700">
										<span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
											Password
										</span>
									</label>
									{!isRegistering && (
										<button
											type="button"
											onClick={() => {
												setShowForgotPassword(true);
												setError('');
												setSuccess('');
											}}
											className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
										>
											Forgot Password?
										</button>
									)}
								</div>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<input
										id="password"
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="block w-full pl-10 pr-3 py-3 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 hover:border-pink-400 bg-white"
										placeholder="••••••••"
										minLength={isRegistering ? 8 : undefined}
									/>
								</div>
								{isRegistering && (
									<p className="mt-1.5 text-xs text-orange-600 font-medium">Minimum 8 characters required</p>
								)}
							</div>

							{/* Error Message */}
							{error && (
								<div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
									<svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
									<p className="text-sm text-red-700 font-medium">{error}</p>
								</div>
							)}

							{/* Success Message */}
							{success && (
								<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
									<svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
									<p className="text-sm text-green-700 font-medium">{success}</p>
								</div>
							)}

							{/* Submit Button */}
							<button
								type="submit"
								disabled={!isFormValid || loading}
								className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95"
							>
								{loading ? (
									<span className="flex items-center justify-center gap-3">
										<svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										<span>{isRegistering ? 'Creating Account...' : 'Signing In...'}</span>
									</span>
								) : (
									<span className="flex items-center justify-center gap-2">
										{isRegistering ? (
											<>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
												</svg>
												Create Account
											</>
										) : (
											<>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
												</svg>
												Sign In
											</>
										)}
									</span>
								)}
							</button>
						</form>

						{/* Footer */}
						<div className="mt-6 text-center">
							<p className="text-xs text-gray-600 font-medium">
								{isRegistering ? (
									<>Already have an account?{' '}
										<button
											type="button"
											onClick={() => {
												setIsRegistering(false);
												setError('');
												setSuccess('');
											}}
											className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
										>
											Sign in
										</button>
									</>
								) : (
									<>Don't have an account?{' '}
										<button
											type="button"
											onClick={() => {
												setIsRegistering(true);
												setError('');
												setSuccess('');
											}}
											className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 font-bold"
										>
											Register
										</button>
									</>
								)}
							</p>
						</div>
					</div>

					{/* Additional Info */}
					<p className="mt-6 text-center text-xs text-white/80 font-medium drop-shadow-md">
						By continuing, you agree to our Terms of Service and Privacy Policy
					</p>
				</div>
			</div>

			{/* Add custom animations */}
			<style>{`
				@keyframes blob {
					0% {
						transform: translate(0px, 0px) scale(1);
					}
					33% {
						transform: translate(30px, -50px) scale(1.1);
					}
					66% {
						transform: translate(-20px, 20px) scale(0.9);
					}
					100% {
						transform: translate(0px, 0px) scale(1);
					}
				}
				.animate-blob {
					animation: blob 7s infinite;
				}
				.animation-delay-2000 {
					animation-delay: 2s;
				}
				.animation-delay-4000 {
					animation-delay: 4s;
				}
			`}</style>
		</div>
	);
}
