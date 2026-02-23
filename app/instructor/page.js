'use client';

import { useState } from 'react';
import InstructorPanel from '../components/InstructorPanel';

export default function InstructorPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthenticated(true);
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Instructor Dashboard
          </h1>
          <p className="text-slate-400">Monitor submissions, answers, and scores</p>
        </div>

        {authenticated ? (
          <InstructorPanel />
        ) : (
          <div className="max-w-sm mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-slate-300 text-sm">Enter the instructor password to continue</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  autoFocus
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={checking || !password}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                    checking || !password ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {checking ? 'Checking...' : 'Enter'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
