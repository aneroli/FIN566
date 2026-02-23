'use client';

import React, { useState, useEffect } from 'react';

const BidSubmissionForm = () => {
  const [config, setConfig] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [submitterName, setSubmitterName] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [answers, setAnswers] = useState({});
  const [reflection, setReflection] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(new Set());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => setError('Failed to load configuration'));
  }, []);

  const getTemplateUrl = (round) => {
    if (!config?.templates) return null;
    // Check for round-specific template, then fall back to base (0)
    if (config.templates[round]) return `/templates/${config.templates[round]}`;
    if (config.templates[0]) return `/templates/${config.templates[0]}`;
    return null;
  };

  const getRoundData = (round) => {
    if (!config) return null;
    if (round === 0) {
      return {
        title: 'Base Case — Initial Valuation',
        subtitle: 'Build your 5-year pro forma',
        description: 'Review the property details below and build your base case valuation.',
        info: config.initial_scenario,
        questions: config.initial_questions || [],
        templateUrl: getTemplateUrl(0),
      };
    }
    const rd = config.rounds?.[`round${round}`];
    if (!rd) return null;
    const privateInfo = rd.private_info?.[selectedGroup] || null;
    return {
      title: rd.title,
      subtitle: rd.subtitle,
      description: rd.description,
      info: rd.info,
      privateInfo,
      hasPrivateInfo: !!rd.private_info,
      questions: rd.questions || [],
      templateUrl: getTemplateUrl(round),
    };
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    resetForm();
    setCurrentRound(0);
    setCompletedRounds(new Set());
  };

  const resetForm = () => {
    setBidAmount('');
    setAnswers({});
    setReflection('');
    setFile(null);
    setError('');
    setSubmitted(false);
    setShowForm(false);
  };

  const navigateToRound = (round) => {
    if (round < 0 || round > config.max_rounds) return;
    resetForm();
    setCurrentRound(round);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.size <= 10 * 1024 * 1024) { setFile(f); setError(''); }
    else { setError('File must be under 10MB'); e.target.value = null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) { setError('Please select a team'); return; }
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('submitterName', submitterName);
      formData.append('bidAmount', bidAmount);
      formData.append('round', currentRound);
      formData.append('groupId', selectedGroup);
      formData.append('reflection', reflection);
      formData.append('answers', JSON.stringify(answers));
      if (file) formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setSubmitted(true);
      setShowForm(false);
      setCompletedRounds(prev => new Set([...prev, currentRound]));
    } catch (err) {
      setError(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) return <div className="flex items-center justify-center p-12"><div className="animate-pulse text-slate-400 text-lg">Loading exercise...</div></div>;

  const roundData = selectedGroup ? getRoundData(currentRound) : null;
  const groupObj = config.groups.find(g => g.id === selectedGroup);
  const totalRounds = config.max_rounds + 1;
  const isRoundCompleted = completedRounds.has(currentRound);
  const allDone = completedRounds.size === totalRounds;

  return (
    <div className="space-y-6">
      {/* Team Selection */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select Your Team</label>
        <select
          value={selectedGroup || ''}
          onChange={e => handleGroupSelect(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
        >
          <option value="" className="bg-slate-800">Choose your team...</option>
          {config.groups.map(g => (
            <option key={g.id} value={g.id} className="bg-slate-800">{g.emoji} {g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroup && (
        <>
          {/* Round Navigation — clickable dots */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {Array.from({ length: totalRounds }, (_, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => navigateToRound(i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer hover:scale-110 ${
                    i === currentRound ? 'bg-blue-500 text-white ring-4 ring-blue-500/30 scale-110'
                    : completedRounds.has(i) ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : 'bg-white/10 text-slate-500 hover:bg-white/20 hover:text-slate-300'
                  }`}
                  title={`${i === 0 ? 'Base Case' : `Round ${i}`}${completedRounds.has(i) ? ' ✓ Submitted' : ''}`}
                >
                  {completedRounds.has(i) ? '✓' : i === 0 ? 'B' : i}
                </button>
                {i < totalRounds - 1 && <div className={`w-4 h-0.5 ${completedRounds.has(i) ? 'bg-emerald-500' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* All Done Banner */}
          {allDone && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-emerald-400 mb-1">All Rounds Complete!</h2>
              <p className="text-slate-400 text-sm">
                Great work, {groupObj?.emoji} {groupObj?.name}! You can still browse rounds above.
              </p>
            </div>
          )}

          {/* Round Content */}
          {roundData && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {roundData.title}
                  </h2>
                  {roundData.subtitle && <p className="text-xs text-slate-500 mt-0.5">{roundData.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {isRoundCompleted && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">✓ Submitted</span>
                  )}
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
                    {groupObj?.emoji} {groupObj?.name}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-slate-400 mb-4">{roundData.description}</p>

                {/* Scenario Info */}
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-5 mb-4 max-h-[500px] overflow-y-auto overflow-x-auto">
                  <pre className="text-slate-200 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'IBM Plex Mono', 'Courier New', Courier, monospace" }}>{roundData.info}{roundData.privateInfo ? '\n' + roundData.privateInfo : ''}</pre>
                </div>

                {/* Template Download */}
                {roundData.templateUrl && (
                  <div className="mb-6">
                    <a
                      href={roundData.templateUrl}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-sm text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                    >
                      <span>📥</span>
                      Download Spreadsheet Template
                    </a>
                  </div>
                )}

                {/* Submission area */}
                {submitted || isRoundCompleted ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-emerald-400 font-semibold mb-1">
                      {currentRound === 0 ? 'Base Case' : `Round ${currentRound}`} Submitted!
                    </p>
                    <p className="text-slate-500 text-sm">Your valuation and analysis have been recorded.</p>
                  </div>
                ) : !showForm ? (
                  <div className="text-center py-4">
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      Submit {currentRound === 0 ? 'Base Case' : `Round ${currentRound}`} Valuation
                    </button>
                    <p className="text-xs text-slate-600 mt-2">Only one team member needs to submit</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 border-t border-white/5 pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Submit Valuation</h3>
                      <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-300 transition">
                        ✕ Close
                      </button>
                    </div>

                    {/* Name (first round only) */}
                    {currentRound === 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Team Contact Name</label>
                        <input type="text" required value={submitterName} onChange={e => setSubmitterName(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your name" />
                      </div>
                    )}

                    {/* Reflection (rounds > 0) */}
                    {currentRound > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Pre-Bid Reflection
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                          Before running the numbers — based on the new information alone, do you expect your valuation to go up or down? Why?
                        </p>
                        <textarea required value={reflection} onChange={e => setReflection(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                          placeholder="I expect the value to..." />
                      </div>
                    )}

                    {/* Valuation */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Your Property Valuation ($)
                      </label>
                      <input type="number" required min="0" step="1" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono"
                        placeholder="e.g. 8456000" />
                    </div>

                    {/* Analysis Questions */}
                    {roundData.questions?.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Analysis Questions</h3>
                        {roundData.questions.map((q, idx) => (
                          <div key={idx}>
                            <label className="block text-sm text-slate-400 mb-1.5">
                              <span className="text-blue-400 font-medium">Q{idx + 1}.</span> {q}
                            </label>
                            <textarea
                              required
                              value={answers[idx] || ''}
                              onChange={e => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px] resize-y text-sm"
                              placeholder="Your answer..."
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Upload Spreadsheet
                      </label>
                      <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 file:cursor-pointer cursor-pointer" />
                      {file && <p className="text-xs text-emerald-400 mt-1">📎 {file.name}</p>}
                      <p className="text-xs text-slate-600 mt-1">PDF, DOC, DOCX, XLS, XLSX, CSV — Max 10MB</p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}

                    <button type="submit" disabled={isSubmitting}
                      className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 ${
                        isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
                      }`}>
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Submitting...
                        </span>
                      ) : (
                        `Submit ${currentRound === 0 ? 'Base Case' : `Round ${currentRound}`} Valuation`
                      )}
                    </button>
                  </form>
                )}

                {/* Prev / Next Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => navigateToRound(currentRound - 1)}
                    disabled={currentRound === 0}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentRound === 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    ← {currentRound === 1 ? 'Base Case' : currentRound > 1 ? `Round ${currentRound - 1}` : 'Previous'}
                  </button>

                  <span className="text-xs text-slate-600">
                    {currentRound === 0 ? 'Base' : `R${currentRound}`} of {config.max_rounds}
                  </span>

                  <button
                    onClick={() => navigateToRound(currentRound + 1)}
                    disabled={currentRound >= config.max_rounds}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentRound >= config.max_rounds
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {currentRound + 1 <= config.max_rounds ? `Round ${currentRound + 1}` : 'Next'} →
                  </button>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BidSubmissionForm;
