'use client';

import React, { useState, useEffect } from 'react';

const InstructorPanel = () => {
  const [scores, setScores] = useState(null);
  const [progress, setProgress] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');
  const [expandedTeam, setExpandedTeam] = useState(null);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/get-progress');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProgress(data.progressData);
    } catch (err) { setError(err.message); }
  };

  const fetchConfig = async () => {
    try {
      const r = await fetch('/api/config');
      setConfig(await r.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchConfig();
    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  const resetBids = async () => {
    if (!confirm('Reset ALL bids? This cannot be undone.')) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/reset-bids', { method: 'POST' });
      if (!r.ok) throw new Error('Reset failed');
      await fetchProgress(); setScores(null);
      alert('All bids reset!');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const calculateScores = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/calculate-scores');
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setScores(data.results);
      setActiveTab('scores');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const maxRounds = config?.max_rounds || 7;
  const trueValues = config?.true_values || {};

  const getQuestions = (round) => {
    if (round === 0) return config?.initial_questions || [];
    return config?.rounds?.[`round${round}`]?.questions || [];
  };

  const getPrivateInfo = (round, groupId) => {
    if (round === 0) return null;
    return config?.rounds?.[`round${round}`]?.private_info?.[groupId] || null;
  };

  const hasPrivateInfoRound = (round) => {
    if (round === 0) return false;
    return !!config?.rounds?.[`round${round}`]?.private_info;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'progress' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Team Progress
          </button>
          <button onClick={() => { setActiveTab('scores'); if (!scores) calculateScores(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'scores' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Scores
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProgress}
            className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-sm font-medium hover:bg-white/20 transition">
            ↻ Refresh
          </button>
          <button onClick={calculateScores} disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
            Calculate Scores
          </button>
          <button onClick={resetBids} disabled={loading}
            className="px-4 py-2 bg-red-600/80 text-white rounded-lg text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition">
            Reset All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* True Values Reference */}
      {activeTab === 'progress' && config && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-amber-300/80 font-medium mb-2">TARGET VALUES (instructor only)</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(trueValues).map(([r, v]) => (
              <span key={r} className="text-xs font-mono text-amber-200/60">
                {r === '0' ? 'Base' : `R${r}`}: {fmt(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && progress && (
        <div className="space-y-4">
          {Object.values(progress).map((team) => {
            const isExpanded = expandedTeam === team.groupId;
            const completedCount = Object.values(team.bids).filter(b => b !== null).length;

            return (
              <div key={team.groupId} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.groupId)}
                  className="w-full px-6 py-4 border-b border-white/10 flex items-center justify-between hover:bg-white/5 transition text-left"
                >
                  <h3 className="text-lg font-semibold text-white">{team.emoji} {team.teamName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{completedCount}/{maxRounds + 1} rounds</span>
                    <div className="flex gap-1">
                      {Array.from({ length: maxRounds + 1 }, (_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${team.bids[i] ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className="text-slate-500">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-white/5">
                    {Array.from({ length: maxRounds + 1 }, (_, r) => {
                      const bid = team.bids[r];
                      const trueVal = trueValues[r];
                      const questions = getQuestions(r);
                      const privateInfo = getPrivateInfo(r, team.groupId);
                      const isPrivateRound = hasPrivateInfoRound(r);

                      return (
                        <div key={r} className="px-6 py-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${bid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                                {r === 0 ? 'BASE' : `R${r}`}
                              </span>
                              {isPrivateRound && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">🔒 Private</span>
                              )}
                              {bid ? (
                                <span className="text-white font-mono font-semibold">{fmt(bid.amount)}</span>
                              ) : (
                                <span className="text-slate-600 text-sm">Not submitted</span>
                              )}
                            </div>
                            {bid && trueVal && (
                              <div className="text-right">
                                <div className={`text-xs font-medium ${Math.abs(bid.amount - trueVal) / trueVal < 0.05 ? 'text-emerald-400' : Math.abs(bid.amount - trueVal) / trueVal < 0.15 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {((bid.amount - trueVal) / trueVal * 100).toFixed(1)}% {bid.amount > trueVal ? 'over' : 'under'}
                                </div>
                                <div className="text-xs text-slate-600">target: {fmt(trueVal)}</div>
                              </div>
                            )}
                          </div>

                          {bid && (
                            <div className="ml-10 space-y-3 mt-3">
                              {privateInfo && (
                                <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">🔒 Private Intel (this team only)</span>
                                  <pre className="text-sm text-amber-200/70 mt-1 whitespace-pre-wrap font-sans">{privateInfo}</pre>
                                </div>
                              )}
                              {bid.reflection && (
                                <div className="bg-white/3 rounded-lg p-3">
                                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Reflection</span>
                                  <p className="text-sm text-slate-300 mt-1">{bid.reflection}</p>
                                </div>
                              )}

                              {/* Answers to questions */}
                              {bid.answers && Object.keys(bid.answers).length > 0 && (
                                <div className="space-y-2">
                                  {Object.entries(bid.answers).map(([qIdx, answer]) => (
                                    <div key={qIdx} className="bg-white/3 rounded-lg p-3">
                                      <span className="text-xs font-semibold text-blue-400">Q{parseInt(qIdx) + 1}: </span>
                                      <span className="text-xs text-slate-500">{questions[parseInt(qIdx)] || ''}</span>
                                      <p className="text-sm text-slate-300 mt-1">{answer}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {bid.fileName && (
                                <p className="text-xs text-blue-400">
                                  📎 {bid.fileUrl ? (
                                    <a href={bid.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                      {bid.fileName.split('/').pop()}
                                    </a>
                                  ) : bid.fileName}
                                </p>
                              )}
                              <p className="text-xs text-slate-600">{new Date(bid.timestamp).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scores Tab */}
      {activeTab === 'scores' && scores && (
        <div className="space-y-4">
          {scores.winner && (
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-xl font-bold text-amber-300">{scores.winner.teamName}</h3>
              <p className="text-amber-200/70 text-sm mt-1">Winner with {scores.winner.totalScore} points</p>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-slate-400">True Values by Round</p>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {Object.entries(scores.trueValues).map(([r, v]) => (
                <span key={r} className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-white">
                  {r === '0' ? 'Base' : `R${r}`}: {fmt(v)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Team</th>
                    {Array.from({ length: maxRounds + 1 }, (_, i) => (
                      <th key={i} className="px-3 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                        {i === 0 ? 'Base' : `R${i}`}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scores.details.map((team, idx) => (
                    <tr key={team.groupId} className={idx === 0 ? 'bg-amber-500/5' : ''}>
                      <td className="px-4 py-3 text-slate-400 font-medium">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{team.emoji} {team.teamName}</td>
                      {Array.from({ length: maxRounds + 1 }, (_, r) => {
                        const rs = team.roundScores[r];
                        return (
                          <td key={r} className="px-3 py-3 text-center">
                            {rs?.bid !== null ? (
                              <div>
                                <div className="text-white text-sm font-mono font-bold">{rs.score}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{fmt(rs.bid)}</div>
                                <div className="text-[10px] text-slate-600">{rs.deviation}%</div>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold font-mono ${idx === 0 ? 'text-amber-300' : 'text-white'}`}>
                          {team.totalScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorPanel;
