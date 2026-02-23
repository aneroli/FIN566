'use client';

import BidSubmissionForm from './components/BidSubmissionForm';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Maple Creek Mixed-Use Center
          </h1>
          <p className="text-slate-400 text-lg">Dynamic Valuation Exercise</p>
        </div>
        <BidSubmissionForm />
      </div>
    </div>
  );
}
