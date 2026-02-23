'use client';

import ClassView from '../components/ClassView';

export default function ClassPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Maple Creek Leaderboard
          </h1>
          <p className="text-slate-400 text-lg">Who&apos;s closest to the mark?</p>
        </div>
        <ClassView />
      </div>
    </div>
  );
}
