'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lever, FulcrumStatus } from '@/lib/types';
import { getLevers, loadSampleData, loadCarlesPortfolio, detectSequenceViolations, saveReview, getReviews, generateId, getLanguage, getProjects, exportAllData, importAllData } from '@/lib/store';
import { SavedReview } from '@/lib/types';
import Link from 'next/link';
import { useOnboarding, OnboardingModal } from '@/components/Onboarding';
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
  const [showLoadChoice, setShowLoadChoice] = useState<'sample' | 'carles' | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const { showOnboarding, completeOnboarding } = useOnboarding();

  useEffect(() => {
    setLevers(getLevers());
  }, []);

  const refreshLevers = () => setLevers(getLevers());

  const handleLoad = (type: 'sample' | 'carles', addToExisting: boolean) => {
    if (type === 'sample') {
      setLevers(loadSampleData(addToExisting));
    } else {
      setLevers(loadCarlesPortfolio(addToExisting));
    }
    setShowLoadChoice(null);
  };

  const handleExportAll = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leverageos-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importAllData(ev.target?.result as string);
      setImportStatus({ type: result.success ? 'success' : 'error', msg: result.message });
      if (result.success) refreshLevers();
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    localStorage.removeItem('leverageos_levers');
    localStorage.removeItem('leverageos_milestones');
    localStorage.removeItem('leverageos_reviews');
    localStorage.removeItem('leverageos_chat');
    localStorage.removeItem('leverageos_projects');
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
            <motion.button
              onClick={() => generateLeverageReport(levers)}
              className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Print Report
            </motion.button>
          )}
        </div>
      </div>

      {/* Data Management Bar */}
      <div className="bg-surface rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Data</span>
            <motion.button
              onClick={() => levers.length > 0 ? setShowLoadChoice('carles') : handleLoad('carles', false)}
              className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              My Portfolio
            </motion.button>
            <motion.button
              onClick={() => levers.length > 0 ? setShowLoadChoice('sample') : handleLoad('sample', false)}
              className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Demo Data
            </motion.button>
            {levers.length > 0 && (
              <motion.button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-at-risk/5 text-at-risk/70 border border-at-risk/20 rounded-lg text-xs font-medium hover:bg-at-risk/10 hover:text-at-risk transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear All
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleExportAll}
              className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Export All
            </motion.button>
            <label className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors cursor-pointer">
              Import
              <input type="file" accept=".json" className="hidden" onChange={handleImportAll} />
            </label>
          </div>
        </div>
        <AnimatePresence>
          {importStatus && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-xs mt-2 ${importStatus.type === 'success' ? 'text-verified' : 'text-at-risk'}`}
            >
              {importStatus.msg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Load Choice Dialog */}
      <AnimatePresence>
        {showLoadChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowLoadChoice(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                Load {showLoadChoice === 'carles' ? 'My Portfolio' : 'Demo Data'}
              </h3>
              <p className="text-sm text-muted mb-6">You already have {levers.length} lever{levers.length !== 1 ? 's' : ''}. How would you like to load?</p>
              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={() => handleLoad(showLoadChoice!, true)}
                  className="px-4 py-2.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add to existing
                  <span className="block text-[10px] text-accent/60 mt-0.5">Keep current levers and add new ones</span>
                </motion.button>
                <motion.button
                  onClick={() => handleLoad(showLoadChoice!, false)}
                  className="px-4 py-2.5 bg-white/5 text-muted border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-foreground transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Replace all
                  <span className="block text-[10px] text-muted/50 mt-0.5">Remove existing levers and load fresh</span>
                </motion.button>
                <button
                  onClick={() => setShowLoadChoice(null)}
                  className="text-muted text-xs mt-1 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-sm text-muted mb-6">This will delete all levers, projects, reviews, and chat history. This action cannot be undone.</p>
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

      {/* Strategic Health Panel */}
      {levers.length > 0 && <StrategicHealthPanel levers={levers} />}

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
          <WeeklyReviewPanel levers={levers} materialScore={materialHealth.score} epistemicScore={epistemicHealth.score} relationalScore={relationalHealth.score} />

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

      {/* Review History */}
      <ReviewHistoryPanel />
    </div>
    </PageTransition>
  );
}

function StrategicHealthPanel({ levers }: { levers: Lever[] }) {
  const projects = getProjects();
  if (projects.length === 0) return null;

  // Tasks per lever
  const leverTaskCounts: Record<string, { name: string; total: number; done: number }> = {};
  projects.forEach((p) => {
    if (!leverTaskCounts[p.leverId]) {
      leverTaskCounts[p.leverId] = { name: p.leverName, total: 0, done: 0 };
    }
    p.subtasks.forEach((s) => {
      leverTaskCounts[p.leverId].total++;
      if (s.done) leverTaskCounts[p.leverId].done++;
    });
    // Count the project itself as a task unit
    leverTaskCounts[p.leverId].total++;
    if (p.status === 'done') leverTaskCounts[p.leverId].done++;
  });

  const entries = Object.entries(leverTaskCounts);
  const maxTasks = Math.max(...entries.map(([, v]) => v.total), 1);

  // Overdue projects
  const overdueProjects = projects.filter((p) => {
    if (p.status === 'done') return false;
    if (p.dueDate && new Date(p.dueDate) < new Date()) return true;
    return p.subtasks.some((s) => !s.done && s.dueDate && new Date(s.dueDate) < new Date());
  });

  // Imbalance detector
  const imbalances: string[] = [];
  const sortedEntries = [...entries].sort((a, b) => b[1].total - a[1].total);
  if (sortedEntries.length >= 2) {
    const top = sortedEntries[0];
    const bottom = sortedEntries[sortedEntries.length - 1];
    if (top[1].total > 0 && bottom[1].total === 0) {
      imbalances.push(`You have ${top[1].total} tasks for ${top[1].name} but 0 for ${bottom[1].name}`);
    } else if (top[1].total >= bottom[1].total * 4 && bottom[1].total > 0) {
      imbalances.push(`${top[1].name} has ${top[1].total} tasks vs ${bottom[1].name} with only ${bottom[1].total}`);
    }
  }

  // Levers with no projects
  const leversWithoutProjects = levers.filter((l) => !leverTaskCounts[l.id]);
  if (leversWithoutProjects.length > 0 && entries.length > 0) {
    leversWithoutProjects.forEach((l) => {
      imbalances.push(`${l.name} has no projects or tasks assigned`);
    });
  }

  // Sequence alignment: check if spending tasks on levers with weak fulcrums
  const sequenceWarnings: string[] = [];
  projects.forEach((p) => {
    if (p.status === 'done') return;
    const lever = levers.find((l) => l.id === p.leverId);
    if (!lever) return;
    if (lever.fulcrums.material.status === 'absent' || lever.fulcrums.material.status === 'at_risk') {
      if (lever.fulcrums.relational.status === 'verified' || lever.fulcrums.relational.status === 'assumed') {
        sequenceWarnings.push(`${lever.name}: building relational tasks while material fulcrum is ${lever.fulcrums.material.status}`);
      }
    }
  });

  // Momentum: completed tasks in current projects
  const totalSubtasks = projects.reduce((sum, p) => sum + p.subtasks.length, 0);
  const doneSubtasks = projects.reduce((sum, p) => sum + p.subtasks.filter((s) => s.done).length, 0);
  const completionRate = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-xl border border-white/5 p-6"
    >
      <h2 className="font-heading text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Strategic Health</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Task Allocation */}
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">Task Allocation</p>
          <div className="space-y-2">
            {entries.map(([id, data]) => (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/70 truncate">{data.name}</span>
                  <span className="font-mono text-muted">{data.total}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(data.total / maxTasks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Momentum */}
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">Momentum</p>
          <div className="text-center py-2">
            <span className={`font-mono text-3xl font-bold ${completionRate >= 70 ? 'text-verified' : completionRate >= 40 ? 'text-assumed' : 'text-at-risk'}`}>
              {completionRate}%
            </span>
            <p className="text-[10px] text-muted mt-1">{doneSubtasks}/{totalSubtasks} subtasks completed</p>
            <p className="text-[10px] text-muted">{projects.filter((p) => p.status === 'done').length}/{projects.length} projects done</p>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">Execution Alerts</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {overdueProjects.length > 0 && overdueProjects.map((p) => (
              <div key={p.id} className="flex items-start gap-2 p-2 bg-at-risk/5 border border-at-risk/20 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-at-risk mt-1 shrink-0" />
                <p className="text-[10px] text-at-risk">{p.name}: overdue</p>
              </div>
            ))}
            {sequenceWarnings.map((w, i) => (
              <div key={`sw-${i}`} className="flex items-start gap-2 p-2 bg-assumed/5 border border-assumed/20 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-assumed mt-1 shrink-0" />
                <p className="text-[10px] text-assumed">{w}</p>
              </div>
            ))}
            {imbalances.map((w, i) => (
              <div key={`im-${i}`} className="flex items-start gap-2 p-2 bg-epistemic/5 border border-epistemic/20 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-epistemic mt-1 shrink-0" />
                <p className="text-[10px] text-epistemic">{w}</p>
              </div>
            ))}
            {overdueProjects.length === 0 && sequenceWarnings.length === 0 && imbalances.length === 0 && (
              <p className="text-[10px] text-verified text-center py-2">All clear. No execution alerts.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function generateReviewsPDF(reviews: SavedReview[]) {
  const html = `<!DOCTYPE html><html><head><title>LeverageOS Review History</title>
<style>body{font-family:'Helvetica Neue',sans-serif;background:#0a0a0f;color:#e8e4df;padding:40px;max-width:800px;margin:0 auto}
h1{color:#c4a35a;font-size:24px;border-bottom:1px solid #333;padding-bottom:10px}
.review{border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0;background:#12121a}
.date{color:#6a6570;font-size:11px;font-family:monospace}
.label{color:#6a6570;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:8px}
.value{font-size:13px;margin:2px 0 8px}
.scores{display:flex;gap:16px;margin-top:8px}
.score-box{padding:4px 8px;border-radius:4px;font-size:11px;font-family:monospace}
.material{background:#1D9E7520;color:#1D9E75}.epistemic{background:#378ADD20;color:#378ADD}.relational{background:#D85A3020;color:#D85A30}
@media print{body{background:white;color:#333}h1{color:#333}.review{border-color:#ddd;background:#f9f9f9}}
</style></head><body>
<h1>LeverageOS — Review History</h1>
<p style="color:#6a6570;font-size:12px">Generated ${new Date().toLocaleDateString()} — The Invisible Fulcrum (Garcia Bach & Hypatia, 2026)</p>
${reviews.map((r) => `<div class="review">
<div class="date">${new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(r.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
${r.materialScore !== undefined ? `<div class="scores"><span class="score-box material">Material ${r.materialScore}%</span><span class="score-box epistemic">Epistemic ${r.epistemicScore}%</span><span class="score-box relational">Relational ${r.relationalScore}%</span></div>` : ''}
<div class="label">Quick Win</div><div class="value">${r.quickWin}</div>
<div class="label">Bottleneck</div><div class="value">${r.bottleneck}</div>
${r.sequenceAlerts.length > 0 ? `<div class="label" style="color:#ef4444">Sequence Alerts</div>${r.sequenceAlerts.map((a) => `<div class="value" style="color:#ef444499">• ${a}</div>`).join('')}` : ''}
${r.fulcrumTraps.length > 0 ? `<div class="label" style="color:#f59e0b">Fulcrum Traps</div>${r.fulcrumTraps.map((t) => `<div class="value" style="color:#f59e0b99">• ${t}</div>`).join('')}` : ''}
<div class="label" style="color:#22c55e">Celebration</div><div class="value">${r.celebration}</div>
</div>`).join('')}
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

function ReviewHistoryPanel() {
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  if (reviews.length === 0) return null;

  // Detect trend: find bottleneck mentions across last reviews
  const recentReviews = reviews.slice(0, 5);
  const bottleneckWords = recentReviews.map((r) => r.bottleneck.toLowerCase());
  const trendMap: Record<string, number> = {};
  ['material', 'epistemic', 'relational'].forEach((fulcrum) => {
    const count = bottleneckWords.filter((b) => b.includes(fulcrum)).length;
    if (count >= 2) trendMap[fulcrum] = count;
  });

  // Evolution chart data (reverse so oldest first)
  const chartData = [...reviews]
    .filter((r) => r.materialScore !== undefined)
    .reverse()
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Material: r.materialScore || 0,
      Epistemic: r.epistemicScore || 0,
      Relational: r.relationalScore || 0,
    }));

  return (
    <div className="bg-surface rounded-xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
          Review History
          <span className="text-xs text-muted font-mono">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        </h2>
        <div className="flex items-center gap-2">
          {chartData.length >= 2 && (
            <button
              onClick={() => setShowChart(!showChart)}
              className="px-2 py-1 text-[10px] text-muted border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              {showChart ? 'Hide Chart' : 'Evolution'}
            </button>
          )}
          <button
            onClick={() => generateReviewsPDF(reviews)}
            className="px-2 py-1 text-[10px] text-muted border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Evolution Chart */}
      <AnimatePresence>
        {showChart && chartData.length >= 2 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4"
          >
            <ReviewEvolutionChart data={chartData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trend indicators */}
      {Object.keys(trendMap).length > 0 && (
        <div className="mb-4 space-y-1">
          {Object.entries(trendMap).map(([fulcrum, count]) => (
            <div key={fulcrum} className="flex items-center gap-2 text-xs p-2 bg-assumed/5 border border-assumed/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-assumed" />
              <span className="text-assumed">
                {fulcrum.charAt(0).toUpperCase() + fulcrum.slice(1)} fulcrum mentioned as bottleneck {count}/{recentReviews.length} recent reviews
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {reviews.map((review) => {
          const isExpanded = expandedId === review.id;
          const date = new Date(review.date);
          return (
            <motion.div
              key={review.id}
              className="border border-white/5 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : review.id)}
                className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-muted/50">
                      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {review.materialScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-material">{review.materialScore}%</span>
                        <span className="text-[10px] font-mono text-epistemic">{review.epistemicScore}%</span>
                        <span className="text-[10px] font-mono text-relational">{review.relationalScore}%</span>
                      </div>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                <p className="text-xs text-foreground/70 mt-1 line-clamp-1">{review.quickWin}</p>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5"
                  >
                    <div className="p-4 space-y-3 text-xs">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewEvolutionChart({ data }: { data: { date: string; Material: number; Epistemic: number; Relational: number }[] }) {
  // Dynamic import to avoid SSR issues — use a simple CSS-based chart
  return (
    <div className="bg-white/[0.02] rounded-lg p-4">
      <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">Fulcrum Score Evolution</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((point, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
              <div className="flex-1 flex items-end">
                <div className="w-full bg-material/40 rounded-t-sm" style={{ height: `${point.Material}%` }} title={`Material: ${point.Material}%`} />
              </div>
            </div>
            <span className="text-[8px] text-muted/40 font-mono truncate w-full text-center">{point.date}</span>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1 h-24 mt-2">
        {data.map((point, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-px" style={{ height: '80px' }}>
              <div className="flex-1 flex items-end">
                <div className="w-full bg-material/60 rounded-t-sm" style={{ height: `${point.Material}%` }} />
              </div>
              <div className="flex-1 flex items-end">
                <div className="w-full bg-epistemic/60 rounded-t-sm" style={{ height: `${point.Epistemic}%` }} />
              </div>
              <div className="flex-1 flex items-end">
                <div className="w-full bg-relational/60 rounded-t-sm" style={{ height: `${point.Relational}%` }} />
              </div>
            </div>
            <span className="text-[8px] text-muted/40 font-mono truncate w-full text-center">{point.date}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-material" /><span className="text-[10px] text-muted">Material</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-epistemic" /><span className="text-[10px] text-muted">Epistemic</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-relational" /><span className="text-[10px] text-muted">Relational</span></div>
      </div>
    </div>
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

function WeeklyReviewPanel({ levers, materialScore, epistemicScore, relationalScore }: { levers: Lever[]; materialScore: number; epistemicScore: number; relationalScore: number }) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (levers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const lang = getLanguage();
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levers, lang }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get review');
      }
      const data = await res.json();
      setReview(data);
      // Save to review history with fulcrum scores
      const saved: SavedReview = {
        id: generateId(),
        date: new Date().toISOString(),
        materialScore,
        epistemicScore,
        relationalScore,
        ...data,
      };
      saveReview(saved);
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
