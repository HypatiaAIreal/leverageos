'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lever, FulcrumStatus, HistoryEntry } from '@/lib/types';
import { getLevers, saveLever } from '@/lib/store';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart,
} from 'recharts';

const statusScore: Record<FulcrumStatus, number> = {
  verified: 100,
  assumed: 60,
  at_risk: 25,
  absent: 0,
};

interface Milestone {
  leverId: string;
  leverName: string;
  date: string;
  description: string;
}

const MILESTONES_KEY = 'leverageos_milestones';

function getMilestones(): Milestone[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MILESTONES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMilestones(ms: Milestone[]) {
  localStorage.setItem(MILESTONES_KEY, JSON.stringify(ms));
}

function detectPatterns(lever: Lever): string[] {
  const patterns: string[] = [];
  const history = lever.history;
  if (history.length < 2) return patterns;

  const recent = history[history.length - 1];
  const prev = history[history.length - 2];

  // R×L×Q trend
  const recentScore = recent.properties.r * recent.properties.l * recent.properties.q;
  const prevScore = prev.properties.r * prev.properties.l * prev.properties.q;
  if (recentScore > prevScore) {
    patterns.push(`R×L×Q is trending upward (${prevScore} → ${recentScore})`);
  } else if (recentScore < prevScore) {
    patterns.push(`R×L×Q has declined (${prevScore} → ${recentScore})`);
  }

  // Fulcrum progression
  const fulcrumTypes = ['material', 'epistemic', 'relational'] as const;
  fulcrumTypes.forEach((f) => {
    const prevS = statusScore[prev.fulcrums[f].status];
    const curS = statusScore[recent.fulcrums[f].status];
    if (curS > prevS) {
      patterns.push(`${f.charAt(0).toUpperCase() + f.slice(1)} fulcrum strengthened`);
    } else if (curS < prevS) {
      patterns.push(`${f.charAt(0).toUpperCase() + f.slice(1)} fulcrum weakened — investigate`);
    }
  });

  // Stagnation detection
  if (history.length >= 3) {
    const last3 = history.slice(-3);
    const scores = last3.map((h) => h.properties.r * h.properties.l * h.properties.q);
    if (scores[0] === scores[1] && scores[1] === scores[2]) {
      patterns.push('R×L×Q has been flat for 3+ entries — consider recalibrating');
    }
  }

  return patterns;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-muted font-mono mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">{entry.name}: {Math.round(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function EvolutionPage() {
  const [levers, setLevers] = useState<Lever[]>([]);
  const [selectedLever, setSelectedLever] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [view, setView] = useState<'fulcrums' | 'leverage'>('fulcrums');

  useEffect(() => {
    const loaded = getLevers();
    setLevers(loaded);
    if (loaded.length > 0) setSelectedLever(loaded[0].id);
    setMilestones(getMilestones());
  }, []);

  const activeLever = levers.find((l) => l.id === selectedLever);

  const chartData = useMemo(() => {
    if (!activeLever || activeLever.history.length === 0) return [];
    return activeLever.history.map((h: HistoryEntry) => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: h.date,
      material: statusScore[h.fulcrums.material.status],
      epistemic: statusScore[h.fulcrums.epistemic.status],
      relational: statusScore[h.fulcrums.relational.status],
      'R×L×Q': h.properties.r * h.properties.l * h.properties.q,
      R: h.properties.r,
      L: h.properties.l,
      Q: h.properties.q,
    }));
  }, [activeLever]);

  // Add current state as last data point
  const fullChartData = useMemo(() => {
    if (!activeLever) return chartData;
    const current = {
      date: 'Now',
      rawDate: new Date().toISOString(),
      material: statusScore[activeLever.fulcrums.material.status],
      epistemic: statusScore[activeLever.fulcrums.epistemic.status],
      relational: statusScore[activeLever.fulcrums.relational.status],
      'R×L×Q': activeLever.effectiveLeverage,
      R: activeLever.properties.r,
      L: activeLever.properties.l,
      Q: activeLever.properties.q,
    };
    return [...chartData, current];
  }, [chartData, activeLever]);

  const leverMilestones = milestones.filter((m) => m.leverId === selectedLever);
  const patterns = activeLever ? detectPatterns(activeLever) : [];

  const handleAddMilestone = () => {
    if (!newMilestone.trim() || !activeLever) return;
    const ms: Milestone = {
      leverId: activeLever.id,
      leverName: activeLever.name,
      date: new Date().toISOString(),
      description: newMilestone.trim(),
    };
    const updated = [...milestones, ms];
    setMilestones(updated);
    saveMilestones(updated);
    setNewMilestone('');
  };

  const handleSnapshotNow = () => {
    if (!activeLever) return;
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      properties: { ...activeLever.properties },
      fulcrums: {
        material: { ...activeLever.fulcrums.material },
        epistemic: { ...activeLever.fulcrums.epistemic },
        relational: { ...activeLever.fulcrums.relational },
      },
    };
    const updated = { ...activeLever, history: [...activeLever.history, entry] };
    saveLever(updated);
    const allLevers = levers.map((l) => (l.id === updated.id ? updated : l));
    setLevers(allLevers);
  };

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Evolution Tracker</h1>
          <p className="text-muted text-sm mt-1">Track lever growth and fulcrum progression over time</p>
        </div>
      </div>

      {levers.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-2">No levers to track</p>
          <p className="text-sm">Create levers in the <Link href="/workshop" className="text-accent hover:underline">Workshop</Link> first.</p>
        </div>
      ) : (
        <>
          {/* Lever selector */}
          <div className="flex gap-2 flex-wrap">
            {levers.map((lever) => (
              <motion.button
                key={lever.id}
                onClick={() => setSelectedLever(lever.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  lever.id === selectedLever
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-surface text-muted border border-white/5 hover:border-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {lever.name}
                <span className="ml-2 font-mono text-[10px] opacity-50">{lever.effectiveLeverage}</span>
              </motion.button>
            ))}
          </div>

          {activeLever && (
            <>
              {/* Chart area */}
              <div className="bg-surface rounded-xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-semibold">
                    {activeLever.name}
                    <span className="text-muted text-sm ml-2 font-body">— {activeLever.history.length} snapshots</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 rounded-lg p-0.5">
                      <button
                        onClick={() => setView('fulcrums')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'fulcrums' ? 'bg-accent/20 text-accent' : 'text-muted'}`}
                      >
                        Fulcrum Scores
                      </button>
                      <button
                        onClick={() => setView('leverage')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${view === 'leverage' ? 'bg-accent/20 text-accent' : 'text-muted'}`}
                      >
                        R×L×Q Growth
                      </button>
                    </div>
                    <motion.button
                      onClick={handleSnapshotNow}
                      className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Snapshot Now
                    </motion.button>
                  </div>
                </div>

                {fullChartData.length < 2 ? (
                  <div className="text-center py-16 text-muted">
                    <p className="text-sm mb-2">Not enough data points yet</p>
                    <p className="text-xs">Use &quot;Snapshot Now&quot; or edit the lever in the Workshop to record history.</p>
                  </div>
                ) : view === 'fulcrums' ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={fullChartData}>
                      <defs>
                        <linearGradient id="gradMaterial" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradEpistemic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#378ADD" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRelational" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D85A30" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D85A30" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="material" name="Material" stroke="#1D9E75" fill="url(#gradMaterial)" strokeWidth={2} dot={{ r: 3 }} />
                      <Area type="monotone" dataKey="epistemic" name="Epistemic" stroke="#378ADD" fill="url(#gradEpistemic)" strokeWidth={2} dot={{ r: 3 }} />
                      <Area type="monotone" dataKey="relational" name="Relational" stroke="#D85A30" fill="url(#gradRelational)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={fullChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} />
                      <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="R×L×Q" name="R×L×Q" stroke="#c4a35a" strokeWidth={2} dot={{ r: 4, fill: '#c4a35a' }} />
                      <Line type="monotone" dataKey="R" name="Rigidity" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="L" name="Length" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Q" name="Quality" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Milestones */}
                <div className="bg-surface rounded-xl border border-white/5 p-6">
                  <h2 className="font-heading text-xl font-semibold mb-4">Milestones</h2>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                      placeholder="Log a milestone..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/30"
                    />
                    <motion.button
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.trim()}
                      className="px-3 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-accent/30 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add
                    </motion.button>
                  </div>
                  {leverMilestones.length === 0 ? (
                    <p className="text-muted text-xs text-center py-6">No milestones logged for this lever yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <AnimatePresence>
                        {leverMilestones.slice().reverse().map((ms, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 items-start p-2 rounded bg-white/[0.02]"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            <div>
                              <p className="text-xs text-foreground">{ms.description}</p>
                              <p className="text-[10px] text-muted font-mono mt-0.5">
                                {new Date(ms.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Pattern Detection */}
                <div className="bg-surface rounded-xl border border-white/5 p-6">
                  <h2 className="font-heading text-xl font-semibold mb-4">Pattern Detection</h2>
                  {patterns.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                      <p className="text-sm mb-1">No patterns detected yet</p>
                      <p className="text-xs">Patterns emerge as history grows. Record more snapshots.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patterns.map((pattern, i) => {
                        const isPositive = pattern.includes('upward') || pattern.includes('strengthened') || pattern.includes('verified');
                        const isNegative = pattern.includes('declined') || pattern.includes('weakened') || pattern.includes('flat');
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-3 rounded-lg border ${
                              isPositive ? 'bg-verified/5 border-verified/20' :
                              isNegative ? 'bg-at-risk/5 border-at-risk/20' :
                              'bg-assumed/5 border-assumed/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${isPositive ? 'text-verified' : isNegative ? 'text-at-risk' : 'text-assumed'}`}>
                                {isPositive ? '↗' : isNegative ? '↘' : '→'}
                              </span>
                              <p className="text-xs text-foreground/80">{pattern}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick stats */}
                  {activeLever && (
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                        <p className="text-lg font-mono font-bold text-accent">{activeLever.effectiveLeverage}</p>
                        <p className="text-[10px] text-muted">Current R×L×Q</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                        <p className="text-lg font-mono font-bold text-foreground">{activeLever.history.length}</p>
                        <p className="text-[10px] text-muted">Snapshots</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3 text-center">
                        <p className="text-lg font-mono font-bold text-foreground">{leverMilestones.length}</p>
                        <p className="text-[10px] text-muted">Milestones</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
}
