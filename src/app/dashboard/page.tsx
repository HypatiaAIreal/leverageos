'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lever, FulcrumStatus } from '@/lib/types';
import { getLevers, loadSampleData, loadCarlesPortfolio, detectSequenceViolations } from '@/lib/store';
import Link from 'next/link';
import { useOnboarding, OnboardingModal } from '@/components/Onboarding';
import DataPortability from '@/components/DataPortability';
import PageTransition from '@/components/PageTransition';
import { generateLeverageReport } from '@/components/LeverageReport';

const statusColors: Record<FulcrumStatus, string> = {
  verified: 'bg-verified',
  assumed: 'bg-assumed',
  at_risk: 'bg-at-risk',
  absent: 'bg-absent',
};

const statusLabels: Record<FulcrumStatus, string> = {
  verified: 'Verified',
  assumed: 'Assumed',
  at_risk: 'At Risk',
  absent: 'Absent',
};

export default function DashboardPage() {
  const [levers, setLevers] = useState<Lever[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'category'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { showOnboarding, completeOnboarding } = useOnboarding();

  useEffect(() => {
    setLevers(getLevers());
  }, []);

  const refreshLevers = () => setLevers(getLevers());

  const handleLoadSample = () => {
    const samples = loadSampleData();
    setLevers(samples);
  };

  const handleLoadCarles = () => {
    const portfolio = loadCarlesPortfolio();
    setLevers(portfolio);
  };

  const handleClearAll = () => {
    localStorage.removeItem('leverageos_levers');
    localStorage.removeItem('leverageos_milestones');
    setLevers([]);
    setShowClearConfirm(false);
  };

  const sortedLevers = [...levers].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'score') return (a.effectiveLeverage - b.effectiveLeverage) * dir;
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    return a.category.localeCompare(b.category) * dir;
  });

  const handleSort = (col: 'score' | 'name' | 'category') => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'score' ? 'desc' : 'asc');
    }
  };

  // Compute fulcrum health averages
  const fulcrumHealth = (type: 'material' | 'epistemic' | 'relational') => {
    if (levers.length === 0) return { verified: 0, assumed: 0, at_risk: 0, absent: 0, score: 0 };
    const counts = { verified: 0, assumed: 0, at_risk: 0, absent: 0 };
    levers.forEach((l) => counts[l.fulcrums[type].status]++);
    const score = Math.round(
      ((counts.verified * 100 + counts.assumed * 60 + counts.at_risk * 25) / levers.length)
    );
    return { ...counts, score };
  };

  const materialHealth = fulcrumHealth('material');
  const epistemicHealth = fulcrumHealth('epistemic');
  const relationalHealth = fulcrumHealth('relational');

  // Collect all alerts
  const alerts: { lever: string; message: string }[] = [];
  levers.forEach((l) => {
    detectSequenceViolations(l).forEach((msg) => {
      alerts.push({ lever: l.name, message: msg });
    });
    if (l.effectiveLeverage === 0) {
      alerts.push({ lever: l.name, message: 'Effective leverage is ZERO. A property has collapsed.' });
    }
  });

  return (
    <PageTransition>
    <div className="space-y-8">
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
      </AnimatePresence>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Your leverage system at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {levers.length > 0 && (
            <>
              <motion.button
                onClick={() => generateLeverageReport(levers)}
                className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Print Report
              </motion.button>
              <motion.button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-at-risk/5 text-at-risk/70 border border-at-risk/20 rounded-lg text-xs font-medium hover:bg-at-risk/10 hover:text-at-risk transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear All Data
              </motion.button>
            </>
          )}
          <DataPortability onImport={refreshLevers} />
          {levers.length === 0 && (
            <>
              <motion.button
                onClick={handleLoadCarles}
                className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                My Portfolio
              </motion.button>
              <motion.button
                onClick={handleLoadSample}
                className="px-4 py-2 bg-white/5 text-muted border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Demo Data
              </motion.button>
            </>
          )}
        </div>

        {/* Clear All Confirmation Dialog */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface border border-white/10 rounded-xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Clear All Data?</h3>
                <p className="text-sm text-muted mb-6">Are you sure? This will delete all levers and reviews. This action cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-at-risk text-white rounded-lg text-sm font-medium hover:bg-at-risk/80 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Delete Everything
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fulcrum Health Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <FulcrumHealthBar label="Material" subtitle="Can you survive?" color="bg-material" health={materialHealth} chapter="Ch. 7" />
        <FulcrumHealthBar label="Epistemic" subtitle="Can you prove it?" color="bg-epistemic" health={epistemicHealth} chapter="Ch. 8" />
        <FulcrumHealthBar label="Relational" subtitle="Do they trust it?" color="bg-relational" health={relationalHealth} chapter="Ch. 9" />
      </div>

      {/* Auto-generated Interpretation Panel */}
      {levers.length > 0 && (
        <SystemInterpretation
          materialScore={materialHealth.score}
          epistemicScore={epistemicHealth.score}
          relationalScore={relationalHealth.score}
          levers={levers}
          alertCount={alerts.length}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lever Portfolio - takes 2 cols */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Lever Portfolio</h2>
            <Link href="/workshop">
              <span className="text-accent text-sm hover:underline">+ Add Lever</span>
            </Link>
          </div>

          {levers.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-lg mb-2">No levers yet</p>
              <p className="text-sm">Create your first lever in the Workshop or load sample data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="text-left py-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                      Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('category')}>
                      Category {sortBy === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center py-2">R</th>
                    <th className="text-center py-2">L</th>
                    <th className="text-center py-2">Q</th>
                    <th className="text-right py-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('score')}>
                      R&times;L&times;Q {sortBy === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center py-2">Fulcrums</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {sortedLevers.map((lever) => (
                      <motion.tr
                        key={lever.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3">
                          <Link href={`/workshop?edit=${lever.id}`} className="text-foreground hover:text-accent transition-colors">
                            {lever.name}
                          </Link>
                        </td>
                        <td className="py-3 text-muted">{lever.category}</td>
                        <td className="py-3 text-center font-mono text-rigidity">{lever.properties.r}</td>
                        <td className="py-3 text-center font-mono text-length">{lever.properties.l}</td>
                        <td className="py-3 text-center font-mono text-quality">{lever.properties.q}</td>
                        <td className="py-3 text-right font-mono font-bold text-accent">{lever.effectiveLeverage}</td>
                        <td className="py-3">
                          <div className="flex justify-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[lever.fulcrums.material.status]}`} title={`Material: ${statusLabels[lever.fulcrums.material.status]}`} />
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[lever.fulcrums.epistemic.status]}`} title={`Epistemic: ${statusLabels[lever.fulcrums.epistemic.status]}`} />
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[lever.fulcrums.relational.status]}`} title={`Relational: ${statusLabels[lever.fulcrums.relational.status]}`} />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: This Week + Alerts */}
        <div className="space-y-6">
          {/* This Week Panel - AI Review */}
          <WeeklyReviewPanel levers={levers} />

          {/* Alert Panel */}
          <div className="bg-surface rounded-xl border border-white/5 p-6">
            <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
              Alerts
              {alerts.length > 0 && (
                <span className="text-xs bg-at-risk/20 text-at-risk px-2 py-0.5 rounded-full font-mono">
                  {alerts.length}
                </span>
              )}
            </h2>
            {alerts.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">No alerts. System stable.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-at-risk/5 border border-at-risk/20 rounded-lg"
                  >
                    <p className="text-xs font-mono text-at-risk/70 mb-1">{alert.lever}</p>
                    <p className="text-xs text-foreground/80">{alert.message}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}

function FulcrumHealthBar({
  label,
  subtitle,
  color,
  health,
  chapter,
}: {
  label: string;
  subtitle: string;
  color: string;
  health: { verified: number; assumed: number; at_risk: number; absent: number; score: number };
  chapter: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-xl border border-white/5 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-heading text-lg font-semibold">{label}</h3>
          <p className="text-muted text-xs">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono text-muted/40">{chapter}</span>
      </div>

      {/* Vertical bar */}
      <div className="flex items-end justify-center mb-4">
        <div className="w-12 h-32 bg-white/5 rounded-t-lg relative overflow-hidden">
          <motion.div
            className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg`}
            initial={{ height: 0 }}
            animate={{ height: `${health.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="text-center mb-3">
        <span className="font-mono text-2xl font-bold text-foreground">{health.score}%</span>
      </div>

      {/* Status badges */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <StatusBadge label="Verified" count={health.verified} color="text-verified" />
        <StatusBadge label="Assumed" count={health.assumed} color="text-assumed" />
        <StatusBadge label="At Risk" count={health.at_risk} color="text-at-risk" />
        <StatusBadge label="Absent" count={health.absent} color="text-muted" />
      </div>
    </motion.div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.02] rounded px-2 py-1">
      <span className={`font-mono font-bold ${color}`}>{count}</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

function SystemInterpretation({
  materialScore,
  epistemicScore,
  relationalScore,
  levers,
  alertCount,
}: {
  materialScore: number;
  epistemicScore: number;
  relationalScore: number;
  levers: Lever[];
  alertCount: number;
}) {
  const scores = [
    { name: 'Material', score: materialScore, color: 'text-material' },
    { name: 'Epistemic', score: epistemicScore, color: 'text-epistemic' },
    { name: 'Relational', score: relationalScore, color: 'text-relational' },
  ];

  const strongest = [...scores].sort((a, b) => b.score - a.score)[0];
  const weakest = [...scores].sort((a, b) => a.score - b.score)[0];
  const avgScore = Math.round((materialScore + epistemicScore + relationalScore) / 3);

  const insights: { text: string; level: 'green' | 'amber' | 'red' }[] = [];

  // Strongest / weakest
  insights.push({
    text: `Your strongest fulcrum is ${strongest.name} (${strongest.score}%). Your weakest is ${weakest.name} (${weakest.score}%).`,
    level: weakest.score >= 60 ? 'green' : weakest.score >= 30 ? 'amber' : 'red',
  });

  // Specific recommendations
  if (relationalScore < 30 && materialScore > 60) {
    insights.push({
      text: 'Focus on building verified relationships before adding new levers. Your Material base is solid but Relational trust is missing.',
      level: 'amber',
    });
  }
  if (epistemicScore < 40 && materialScore > 50) {
    insights.push({
      text: 'Epistemic credibility needs evidence. Gather proof: testimonials, data, third-party validation.',
      level: 'amber',
    });
  }
  if (materialScore < 30) {
    insights.push({
      text: 'Material fulcrum is critically low. Pause expansion and secure your financial/survival foundation first.',
      level: 'red',
    });
  }
  if (avgScore >= 70 && alertCount === 0) {
    insights.push({
      text: 'System is healthy. All fulcrums above average with no sequence violations.',
      level: 'green',
    });
  }
  if (alertCount > 0) {
    insights.push({
      text: `${alertCount} alert(s) detected. Review the Sequence Analyzer to fix violations before they compound.`,
      level: 'red',
    });
  }

  // Zero leverage warning
  const zeroLevers = levers.filter((l) => l.effectiveLeverage === 0);
  if (zeroLevers.length > 0) {
    insights.push({
      text: `${zeroLevers.length} lever(s) have zero effective leverage. A collapsed property nullifies everything.`,
      level: 'red',
    });
  }

  const levelColors = { green: 'border-verified/20 bg-verified/5', amber: 'border-assumed/20 bg-assumed/5', red: 'border-at-risk/20 bg-at-risk/5' };
  const levelTextColors = { green: 'text-verified', amber: 'text-assumed', red: 'text-at-risk' };
  const levelDots = { green: 'bg-verified', amber: 'bg-assumed', red: 'bg-at-risk' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-xl border border-white/5 p-5"
    >
      <h2 className="font-heading text-sm font-semibold text-muted mb-3 uppercase tracking-wider">System Interpretation</h2>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${levelColors[insight.level]}`}>
            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${levelDots[insight.level]}`} />
            <p className={`text-xs ${levelTextColors[insight.level]}`}>{insight.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface ReviewData {
  quickWin: string;
  bottleneck: string;
  sequenceAlerts: string[];
  fulcrumTraps: string[];
  celebration: string;
}

function WeeklyReviewPanel({ levers }: { levers: Lever[] }) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (levers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levers }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get review');
      }
      const data = await res.json();
      setReview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-white/5 p-6">
      <h2 className="font-heading text-xl font-semibold mb-4">This Week</h2>
      {!review && !loading && !error && (
        <div className="text-center py-4">
          <p className="text-muted text-xs mb-3">AI-powered strategic review</p>
          <motion.button
            onClick={handleReview}
            disabled={levers.length === 0}
            className="px-3 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Run Review
          </motion.button>
        </div>
      )}
      {loading && (
        <div className="text-center py-6">
          <motion.div
            className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <p className="text-muted text-xs mt-2">Analyzing your leverage system...</p>
        </div>
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-at-risk text-xs">{error}</p>
          <button onClick={handleReview} className="text-accent text-xs underline">Retry</button>
        </div>
      )}
      {review && (
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-muted font-mono uppercase tracking-wider text-[10px] mb-1">Quick Win</p>
            <p className="text-foreground/90">{review.quickWin}</p>
          </div>
          <div>
            <p className="text-muted font-mono uppercase tracking-wider text-[10px] mb-1">Bottleneck</p>
            <p className="text-foreground/90">{review.bottleneck}</p>
          </div>
          {review.sequenceAlerts.length > 0 && (
            <div>
              <p className="text-at-risk font-mono uppercase tracking-wider text-[10px] mb-1">Sequence Alerts</p>
              {review.sequenceAlerts.map((a, i) => (
                <p key={i} className="text-foreground/70 ml-2">- {a}</p>
              ))}
            </div>
          )}
          {review.fulcrumTraps.length > 0 && (
            <div>
              <p className="text-assumed font-mono uppercase tracking-wider text-[10px] mb-1">Fulcrum Traps</p>
              {review.fulcrumTraps.map((t, i) => (
                <p key={i} className="text-foreground/70 ml-2">- {t}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-verified font-mono uppercase tracking-wider text-[10px] mb-1">Celebration</p>
            <p className="text-foreground/90">{review.celebration}</p>
          </div>
          <button onClick={handleReview} className="text-accent text-[10px] underline mt-2">Refresh</button>
        </div>
      )}
    </div>
  );
}
