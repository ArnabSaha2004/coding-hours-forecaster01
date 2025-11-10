import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';
import Papa from 'papaparse';

// API Base URL configuration for mobile and web
import { Capacitor } from '@capacitor/core';

const getApiBase = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	if (Capacitor.isNativePlatform()) {
		return 'http://localhost:4000';
	}
	return 'http://localhost:4000';
};

const API_BASE = getApiBase();

function Footer() {
	return (
		<footer className="mt-8 border-t-2 border-gradient-to-r from-purple-200 via-pink-200 to-yellow-200 bg-gradient-to-r from-purple-50/80 via-pink-50/80 to-yellow-50/80 backdrop-blur">
			<div className="container-app py-6 text-sm flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
				<p className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
					© {new Date().getFullYear()} Coding Hours Forecaster
				</p>
				<p className="text-gray-600">
					<span className="text-gray-500">Built with</span>{' '}
					<span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">React</span>
					{' '}&{' '}
					<span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Express</span>
				</p>
			</div>
		</footer>
	);
}

export default function Dashboard({ token, setToken }) {
	const navigate = useNavigate();
	const [logs, setLogs] = useState([]);
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [hours, setHours] = useState(1);
	const [category, setCategory] = useState('General');
	const [forecast, setForecast] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [forecastInfo, setForecastInfo] = useState('');
	
	const categories = ['General', 'DSA', 'Web Dev', 'ML', 'Mobile', 'DevOps', 'Other'];

	const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

	// Redirect to login if no token
	useEffect(() => {
		if (!token) {
			navigate('/login');
		}
	}, [token, navigate]);

	async function refreshLogs() {
		setError('');
		try {
			const res = await fetch(`${API_BASE}/api/logs`, { headers: authHeaders });
			if (!res.ok) { 
				if (res.status === 401) {
					setToken('');
					navigate('/login');
					setError('Session expired. Please login again.');
				} else {
					setError('Failed to load logs.');
				}
				setLogs([]); 
				return; 
			}
			const data = await res.json().catch(() => []);
			setLogs(data);
		} catch (err) {
			console.error('Refresh logs error:', err);
			setError('Network error. Make sure the backend server is running.');
			setLogs([]);
		}
	}

	async function addLog() {
		setError('');
		const n = Number(hours);
		if (!date || Number.isNaN(n) || n < 0) { setError('Provide a valid date and non-negative hours.'); return; }
		try {
			const res = await fetch(`${API_BASE}/api/logs`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders },
				body: JSON.stringify({ date, hours: n, project: category || 'General' }),
			});
			if (res.ok) {
				await refreshLogs();
				setError('');
			} else {
				const data = await res.json().catch(() => ({ message: 'Failed to add log' }));
				if (res.status === 401) {
					setToken('');
					navigate('/login');
					setError('Session expired. Please login again.');
				} else {
					setError(data.message || 'Failed to add log. Make sure database is set up.');
				}
			}
		} catch (err) {
			console.error('Add log error:', err);
			setError('Network error. Make sure the backend server is running.');
		}
	}

	async function getForecast() {
		setError('');
		setForecastInfo('');
		if (!token) { setError('Please login first.'); return; }
		const history = logs
			.map((l) => ({ date: String(l.date).slice(0,10), hours: Number(l.hours) }))
			.filter((p) => p.date && !Number.isNaN(p.hours))
			.sort((a,b) => a.date.localeCompare(b.date))
			.slice(-180);
		if (!history.length) { setError('Add at least one log before forecasting.'); return; }
		setLoading(true);
		try {
			const body = { history, horizon: 7 };
			const res = await fetch(`${API_BASE}/api/forecast`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders },
				body: JSON.stringify(body),
			});
			if (res.status === 401) { setError('Login required to run forecast.'); setForecast([]); return; }
			const data = await res.json().catch(() => ({}));
			if (!res.ok) { setError(data?.message || 'Forecast failed.'); setForecast([]); return; }
			const preds = Array.isArray(data.predictions) ? data.predictions : [];
			setForecast(preds);
			setForecastInfo(`${history.length} history points → ${preds.length} predictions`);
		} catch (e) {
			setError('Network error while forecasting.');
			setForecast([]);
		} finally {
			setLoading(false);
		}
	}

	function exportCsv() {
		const csv = Papa.unparse(logs.map(l => ({ date: l.date, hours: l.hours, project: l.project, notes: l.notes || '' })));
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `coding-logs-${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function importCsv(file) {
		setError('');
		if (!file) return;
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: async (results) => {
				try {
					const rows = Array.isArray(results.data) ? results.data : [];
					let successCount = 0;
					for (const r of rows) {
						const d = (r.date || '').slice(0,10);
						const h = Number(r.hours);
						if (!d || Number.isNaN(h)) continue;
						try {
							const res = await fetch(`${API_BASE}/api/logs`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json', ...authHeaders },
								body: JSON.stringify({ date: d, hours: h, project: r.project || 'General', notes: r.notes || '' })
							});
							if (res.ok) successCount++;
						} catch (err) {
							console.error('Import row error:', err);
						}
					}
					await refreshLogs();
					if (successCount > 0) {
						setError('');
					} else {
						setError('No valid rows imported. Check CSV format.');
					}
				} catch (err) {
					console.error('Import CSV error:', err);
					setError('Failed to import CSV file.');
				}
			},
			error: (err) => {
				console.error('CSV parse error:', err);
				setError('Failed to parse CSV file.');
			}
		});
	}

	function handleLogout() {
		setToken('');
		localStorage.removeItem('token');
		navigate('/login');
	}

	useEffect(() => { 
		if (token) {
			refreshLogs();
		} else {
			setLogs([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);
	
	useEffect(() => {
		setDate(new Date().toISOString().slice(0, 10));
	}, []);

	const totalHours = logs.reduce((s, l) => s + Number(l.hours || 0), 0);
	const avgHours = logs.length ? (totalHours / logs.length) : 0;
	const chartData = React.useMemo(() => {
		const history = logs.map(l => ({ date: String(l.date).slice(0,10), historyHours: Number(l.hours) })).sort((a,b)=>a.date.localeCompare(b.date));
		const forecastPoints = forecast.map(p => ({ date: String(p.date).slice(0,10), forecastHours: Number(p.hours), lower: Number(p.lower), upper: Number(p.upper) }));
		const map = new Map();
		for (const h of history) map.set(h.date, { date: h.date, historyHours: h.historyHours });
		for (const f of forecastPoints) map.set(f.date, { ...(map.get(f.date)||{ date: f.date }), ...f });
		return Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date));
	}, [logs, forecast]);

	if (!token) return null;

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 via-yellow-50 to-orange-50">
			{/* Colorful Header */}
			<header className="bg-gradient-to-r from-purple-600 via-pink-600 via-red-500 to-orange-500 shadow-2xl">
				<div className="container-app">
					<div className="flex items-center justify-between py-4">
						<h1 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
							<span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
								Coding Hours Forecaster
							</span>
						</h1>
						<nav className="flex items-center gap-4 text-white/90">
							<a className="hover:text-yellow-200 hidden sm:block font-medium transition-colors" href="#logs">Logs</a>
							<a className="hover:text-yellow-200 hidden sm:block font-medium transition-colors" href="#forecast">Forecast</a>
							<button
								onClick={handleLogout}
								className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
							>
								Logout
							</button>
						</nav>
					</div>
				</div>
			</header>

			<main className="container-app space-y-6 py-6">
				{error && (
					<div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4 text-red-700 text-sm font-medium shadow-lg" role="alert">
						<div className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							{error}
						</div>
					</div>
				)}

				{/* Colorful Summary cards */}
				<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
						<div className="p-6 text-white">
							<div className="text-sm font-medium text-white/80 mb-1">Total hours</div>
							<div className="text-4xl font-extrabold">{totalHours.toFixed(2)}</div>
							<div className="mt-2 text-xs text-white/70">All time coding hours</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
						<div className="p-6 text-white">
							<div className="text-sm font-medium text-white/80 mb-1">Average / day</div>
							<div className="text-4xl font-extrabold">{avgHours.toFixed(2)}</div>
							<div className="mt-2 text-xs text-white/70">Daily average hours</div>
						</div>
					</div>
					<div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
						<div className="p-6 text-white">
							<div className="text-sm font-medium text-white/80 mb-1">Entries</div>
							<div className="text-4xl font-extrabold">{logs.length}</div>
							<div className="mt-2 text-xs text-white/70">Total log entries</div>
						</div>
					</div>
				</section>

				{/* Chart */}
				<section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-purple-200/50">
					<div className="p-6">
						<h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
							History & Forecast
						</h2>
						<div className="w-full h-64">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="date" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} allowDecimals domain={[0, 'auto']} />
									<Tooltip />
									<Area type="monotone" dataKey="lower" stroke="#a78bfa" fill="#c4b5fd" fillOpacity={0.4} name="Lower" />
									<Area type="monotone" dataKey="upper" stroke="#8b5cf6" fill="#a78bfa" fillOpacity={0.3} name="Upper" />
									<Line type="monotone" dataKey="historyHours" stroke="#1f2937" strokeWidth={3} dot={{ fill: '#7c3aed', r: 4 }} name="History" />
									<Line type="monotone" dataKey="forecastHours" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} name="Forecast" />
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>
				</section>

				{/* Add Log + CSV */}
				<section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-pink-200/50" id="logs">
					<div className="p-6">
						<h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
							Logs
						</h2>
						<div className="flex flex-wrap gap-3 items-end mb-4">
							<input 
								type="date" 
								className="px-4 py-2 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-pink-500 transition-all bg-white" 
								value={date} 
								onChange={(e)=>setDate(e.target.value)} 
							/>
							<input 
								type="number" 
								step="0.25" 
								min="0" 
								className="px-4 py-2 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-orange-500 transition-all bg-white w-36" 
								value={hours} 
								onChange={(e)=>setHours(e.target.value)} 
								placeholder="Hours" 
							/>
							<select 
								className="px-4 py-2 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-yellow-500 transition-all bg-white" 
								value={category} 
								onChange={(e)=>setCategory(e.target.value)}
							>
								{categories.map(cat => (
									<option key={cat} value={cat}>{cat}</option>
								))}
							</select>
							<button 
								className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all" 
								onClick={addLog}
							>
								Add
							</button>
							<button 
								className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all" 
								onClick={refreshLogs}
							>
								Refresh
							</button>
							<button 
								className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
								onClick={exportCsv} 
								disabled={!logs.length}
							>
								Export CSV
							</button>
							<label className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer">
								<input type="file" accept=".csv" className="hidden" onChange={(e)=>importCsv(e.target.files?.[0])} />
								<span>Import CSV</span>
							</label>
						</div>
						<ul className="space-y-2">
							{logs.map((l)=> {
								const logCategory = l.project || 'General';
								const categoryColors = {
									'DSA': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400',
									'Web Dev': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400',
									'ML': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400',
									'Mobile': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400',
									'DevOps': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400',
									'General': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400',
									'Other': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400'
								};
								const tagClass = categoryColors[logCategory] || categoryColors['Other'];
								return (
									<li key={l.id} className="flex justify-between items-center border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-r from-white to-purple-50/50 hover:shadow-lg transition-all">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-sm sm:text-base font-semibold text-gray-800">{l.date} — {l.hours}h</span>
											<span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 shadow-md ${tagClass}`}>
												{logCategory}
											</span>
										</div>
										<span className="text-xs text-gray-600 font-medium">{new Date(l.createdAt).toLocaleDateString()}</span>
									</li>
								);
							})}
							{!logs.length && <li className="text-sm text-gray-500 text-center py-8">No logs yet. Add your first log above! 🚀</li>}
						</ul>
					</div>
				</section>

				{/* Forecast */}
				<section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-orange-200/50" id="forecast">
					<div className="p-6">
						<h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
							Forecast (7 days)
						</h2>
						<div className="flex flex-wrap gap-3 items-center mb-4">
							<button 
								className="px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
								onClick={getForecast} 
								disabled={loading}
							>
								{loading ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Running…
									</span>
								) : (
									'Run forecast'
								)}
							</button>
							{forecast.length > 0 && <span className="text-xs text-gray-600 font-medium">{forecastInfo}</span>}
							{forecast.length > 0 && (
								<div className="ml-auto flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-xl">
									<span className="text-sm font-bold text-gray-700">Total Weekly:</span>
									<span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
										{forecast.reduce((sum, p) => sum + Number(p.hours || 0), 0).toFixed(2)}h
									</span>
								</div>
							)}
						</div>
						{forecast.length > 0 && (() => {
							const avgHours = forecast.reduce((sum, p) => sum + Number(p.hours || 0), 0) / forecast.length;
							const chartData = forecast.map(p => {
								const dateStr = String(p.date).slice(0, 10);
								const dateObj = new Date(dateStr + 'T00:00:00');
								return {
									date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
									hours: Number(p.hours || 0),
									fullDate: dateStr
								};
							});
							return (
								<div className="mb-6">
									<h3 className="text-sm font-bold text-gray-700 mb-3">Prediction Chart</h3>
									<div className="w-full h-64">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
												<XAxis 
													dataKey="date" 
													tick={{ fontSize: 12, fill: '#6b7280' }}
													angle={-45}
													textAnchor="end"
													height={60}
												/>
												<YAxis 
													tick={{ fontSize: 12, fill: '#6b7280' }} 
													allowDecimals 
													domain={[0, 'auto']}
												/>
												<Tooltip 
													contentStyle={{ 
														backgroundColor: 'white', 
														border: '2px solid #ec4899',
														borderRadius: '12px',
														padding: '12px',
														boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
													}}
													formatter={(value, name, props) => [`${value.toFixed(2)}h`, 'Predicted Hours']}
													labelFormatter={(label) => `Date: ${chartData.find(d => d.date === label)?.fullDate || label}`}
												/>
												<Bar dataKey="hours" radius={[12, 12, 0, 0]}>
													{chartData.map((entry, index) => {
														const isHigh = entry.hours >= avgHours;
														const colors = [
															'#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
															'#eab308', '#22c55e', '#3b82f6'
														];
														return (
															<Cell 
																key={`cell-${index}`} 
																fill={isHigh ? colors[index % colors.length] : colors[index % colors.length] + '80'} 
															/>
														);
													})}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</div>
									<div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-pink-500"></div>
											<span>High (≥{avgHours.toFixed(1)}h avg)</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded bg-gradient-to-r from-purple-300 to-pink-300"></div>
											<span>Low (&lt;{avgHours.toFixed(1)}h avg)</span>
										</div>
									</div>
								</div>
							);
						})()}
						<ul className="mt-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
							{forecast.map((p) => (
								<li key={p.date} className="border-2 border-orange-200 rounded-xl p-4 bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-lg transition-all">
									<div className="font-bold text-gray-800">{p.date}</div>
									<div className="text-gray-700 font-semibold">Hours: <span className="text-orange-600">{p.hours}</span> ( <span className="text-pink-600">{p.lower}</span> - <span className="text-purple-600">{p.upper}</span> )</div>
								</li>
							))}
							{!forecast.length && <li className="text-gray-500 text-center py-8 col-span-2">No predictions yet. Run forecast to see predictions! 🔮</li>}
						</ul>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
