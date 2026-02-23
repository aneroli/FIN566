'use client';

import React, { useState, useEffect, useCallback } from 'react';

const ClassView = () => {
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [view, setView] = useState('round');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [rankRes, cfgRes] = await Promise.all([
        fetch('/api/class-rankings'),
        fetch('/api/config'),
      ]);
      const rankData = await rankRes.json();
      const cfgData = await cfgRes.json();
      setData(rankData);
      setConfig(cfgData);
      if (selectedRound === null && rankData.rankings) {
        const rounds = Object.keys(rankData.rankings).map(Number).sort((a, b) => b - a);
        const latestWithBids = rounds.find(r => rankData.rankings[r]?.some(t => t.submitted));
        setSelectedRound(latestWithBids ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  }, [selectedRound]);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  if (!data || !config) {
    return <div className="flex items-center justify-center p-20"><div className="animate-pulse text-slate-400 text-lg">Loading leaderboard...</div></div>;
  }

  const rankings = data.rankings || {};
  const cumulative = data.cumulative || {};
  const currentRankings = rankings[selectedRound] || [];
  const maxRounds = config.max_rounds || 7;
  const submittedTeams = currentRankings.filter(t => t.submitted);
  const topAccuracy = submittedTeams.length > 0 ? submittedTeams[0].accuracy : 100;

  const roundLabel = (r) => r === 0 ? 'Base' : `R${r}`;
  const getRoundTitle = (r) => {
    if (r === 0) return 'Base Case — Initial Valuation';
    return config.rounds?.[`round${r}`]?.title || `Round ${r}`;
  };

  const getPositionFlair = (idx, total) => {
    if (total <= 1) return '';
    if (idx === 0) return '🔥 Leading the pack!';
    if (idx === 1) return '💪 Hot on their heels';
    if (idx === 2) return '📈 Climbing up';
    if (idx === total - 1 && total > 3) return '🚀 Room to grow';
    return '💼 In the mix';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button onClick={() => setView('round')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'round' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Round View
          </button>
          <button onClick={() => setView('cumulative')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'cumulative' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
            Overall Standings
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData}
            className="px-3 py-2 bg-white/10 text-slate-300 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
            ↻ Refresh
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded border-slate-600" />
            Auto-refresh
          </label>
        </div>
      </div>

      {view === 'round' ? (
        <>
          {/* Round Selector */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {Array.from({ length: maxRounds + 1 }, (_, i) => {
              const hasData = rankings[i]?.some(t => t.submitted);
              return (
                <button key={i} onClick={() => hasData && setSelectedRound(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    i === selectedRound ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : hasData ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/5 text-slate-600 cursor-default'
                  }`}>
                  {roundLabel(i)}
                </button>
              );
            })}
          </div>

          {/* Round Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {getRoundTitle(selectedRound)}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {submittedTeams.length} of {currentRankings.length} teams have submitted
            </p>
          </div>

          {/* Race Track Leaderboard */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-3">
            {currentRankings.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No submissions yet for this round</p>
            ) : (
              currentRankings.map((team, idx) => {
                const barWidth = team.submitted ? Math.max(15, (team.accuracy / Math.max(topAccuracy, 1)) * 100) : 8;
                const isFirst = idx === 0 && team.submitted;
                return (
                  <div key={team.groupId}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                        !team.submitted ? 'bg-white/5 text-slate-600'
                        : isFirst ? 'bg-amber-500/20 text-amber-300'
                        : idx === 1 ? 'bg-slate-400/20 text-slate-300'
                        : idx === 2 ? 'bg-orange-400/20 text-orange-300'
                        : 'bg-white/5 text-slate-400'
                      }`}>
                        {!team.submitted ? '·' : idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold text-sm ${team.submitted ? 'text-white' : 'text-slate-600'}`}>
                            {team.emoji} {team.teamName}
                          </span>
                          {team.submitted && (
                            <span className="text-xs text-slate-500 hidden sm:inline">
                              {getPositionFlair(idx, submittedTeams.length)}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${
                              !team.submitted ? 'bg-white/5'
                              : isFirst ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                              : idx === 1 ? 'bg-gradient-to-r from-slate-600 to-slate-400'
                              : idx === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                              : 'bg-gradient-to-r from-blue-700 to-blue-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          >
                            {team.submitted && (
                              <span className="text-xs font-bold text-white/90 whitespace-nowrap">
                                {team.accuracy.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {!team.submitted && (
                          <p className="text-xs text-slate-600 mt-1">Waiting for submission...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {submittedTeams.length > 0 && (
              <div className="pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-slate-600">
                  Accuracy score = how close your valuation is to the target — higher is better!
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Cumulative Standings */
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Overall Standings
            </h2>
            <p className="text-slate-500 text-sm mt-1">Cumulative accuracy across all completed rounds</p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            {cumulative.details?.length > 0 ? (
              <div className="divide-y divide-white/5">
                {cumulative.details.map((team, idx) => {
                  const maxScore = cumulative.details[0]?.totalScore || 1;
                  const barWidth = team.totalScore > 0 ? Math.max(10, (team.totalScore / maxScore) * 100) : 5;

                  return (
                    <div key={team.groupId} className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/30 text-amber-300'
                          : idx === 1 ? 'bg-slate-500/20 text-slate-300'
                          : idx === 2 ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-white/5 text-slate-400'
                        }`}>
                          {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-white">{team.emoji} {team.teamName}</span>
                            <div className="text-right">
                              <span className={`text-lg font-bold font-mono ${idx === 0 ? 'text-amber-300' : 'text-white'}`}>
                                {team.totalScore}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">pts</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              idx === 0 ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                              : 'bg-gradient-to-r from-blue-700 to-blue-500'
                            }`} style={{ width: `${barWidth}%` }} />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {Array.from({ length: maxRounds + 1 }, (_, r) => {
                              const rs = team.roundScores[r];
                              const hasScore = rs?.bid !== null;
                              return (
                                <div key={r} className={`text-center flex-1 rounded-lg py-1 ${hasScore ? 'bg-white/5' : ''}`}>
                                  <div className="text-[10px] text-slate-600">{r === 0 ? 'B' : `R${r}`}</div>
                                  {hasScore && <div className="text-xs font-bold text-slate-300">{rs.score}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">No submissions yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassView;
