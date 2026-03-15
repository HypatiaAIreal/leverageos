'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lever, FulcrumStatus } from '@/lib/types';
import { getLevers, detectSequenceViolations } from '@/lib/store';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

const fulcrumOrder = ['material', 'epistemic', 'relational'] as const;
const fulcrumLabels: Record<string, string> = {
  material: 'Material',
  epistemic: 'Epistemic',
  relational: 'Relational',
};
const fulcrumColors: Record<string, string> = {
  material: '#1D9E75',
  epistemic: '#378ADD',
  relational: '#D85A30',
};
const statusScore: Record<FulcrumStatus, number> = {
  verified: 3,
  assumed: 2,
  at_risk: 1,
  absent: 0,
};
const statusLabels: Record<FulcrumStatus, string> = {
  verified: 'Verified',
  assumed: 'Assumed',
  at_risk: 'At Risk',
  absent: 'Absent',
};

function getFulcrumPhase(lever: Lever): string {
  const { material, epistemic, relational } = lever.fulcrums;
  if (material.status === 'absent' || material.status === 'at_risk') return 'material';
  if (epistemic.status === 'absent' || epistemic.status === 'at_risk') return 'epistemic';
  if (relational.status === 'absent' || relational.status === 'at_risk') return 'relational';
  return 'complete';
}

function getCascadeEffects(lever: Lever): string[] {
  const effects: string[] = [];
  const { material, epistemic, relational } = lever.fulcrums;

  if (material.status === 'at_risk' || material.status === 'absent') {
    effects.push('Securing Material unlocks Epistemic work — you can\'t prove credibility while survival is uncertain.');
    if (epistemic.status === 'assumed' || epistemic.status === 'at_risk') {
      effects.push('Once Material is stable, focus shifts to verifying Epistemic evidence.');
    }
  }
  if (material.status === 'verified' && (epistemic.status === 'at_risk' || epistemic.status === 'absent')) {
    effects.push('Material is secured. Verifying Epistemic now unlocks Relational outreach.');
  }
  if (material.status === 'verified' && epistemic.status === 'verified' && (relational.status === 'at_risk' || relational.status === 'absent')) {
    effects.push('Both foundations are solid. Building Relational trust is the final unlock for full leverage.');
  }
  if (material.status === 'verified' && epistemic.status === 'verified' && relational.status === 'verified') {
    effects.push('All three fulcrums verified — this lever is operating at maximum structural integrity.');
  }

  return effects;
}

function getRecommendations(levers: Lever[]): { lever: string; recommendation: string; priority: 'high' | 'medium' | 'low' }[] {
  const recs: { lever: string; recommendation: string; priority: 'high' | 'medium' | 'low' }[] = [];

  levers.forEach((lever) => {
    const violations = detectSequenceViolations(lever);
    const phase = getFulcrumPhase(lever);

    if (violations.length > 0) {
      recs.push({
        lever: lever.name,
        recommendation: `Fix sequence violations first. ${violations[0].split('.')[0]}.`,
        priority: 'high',
      });
    } else if (phase === 'material') {
      recs.push({
        lever: lever.name,
        recommendation: 'Focus on securing Material fulcrum before advancing. Can you survive while this operates?',
        priority: 'high',
      });
    } else if (phase === 'epistemic') {
      recs.push({
        lever: lever.name,
        recommendation: 'Material is secured. Gather evidence to verify Epistemic credibility.',
        priority: 'medium',
      });
    } else if (phase === 'relational') {
      recs.push({
        lever: lever.name,
        recommendation: 'Foundations solid. Build trust — seek testimonials, endorsements, social proof.',
        priority: 'low',
      });
    }
  });

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export default function SequencePage() {
  const [levers, setLevers] = useState<Lever[]>([]);
  const [selectedLever, setSelectedLever] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getLevers();
    setLevers(loaded);
    if (loaded.length > 0) setSelectedLever(loaded[0].id);
  }, []);

  const recommendations = getRecommendations(levers);
  const activeLever = levers.find((l) => l.id === selectedLever);

  return (
    <PageTransition>
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Sequence Analyzer</h1>
        <p className="text-muted text-sm mt-1">Material → Epistemic → Relational. Always. (Ch. 10)</p>
      </div>

      {levers.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-2">No levers to analyze</p>
          <p className="text-sm">Create levers in the <Link href="/workshop" className="text-accent hover:underline">Workshop</Link> first.</p>
        </div>
      ) : (
        <>
          {/* Timeline View */}
          <div className="bg-surface rounded-xl border border-white/5 p-6">
            <h2 className="font-heading text-xl font-semibold mb-6">Sequence Timeline</h2>

            <div className="flex gap-6 mb-6 text-xs text-muted">
              {fulcrumOrder.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fulcrumColors[f] }} />
                  <span>{fulcrumLabels[f]}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verified" /> Verified</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-assumed" /> Assumed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-at-risk" /> At Risk</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-absent" /> Absent</span>
              </div>
            </div>

            <div className="space-y-3">
              {levers.map((lever, idx) => {
                const violations = detectSequenceViolations(lever);
                const hasViolation = violations.length > 0;
                const isSelected = lever.id === selectedLever;

                return (
                  <motion.div
                    key={lever.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-white/[0.05] border border-accent/20' : 'hover:bg-white/[0.02] border border-transparent'
                    } ${hasViolation ? 'ring-1 ring-at-risk/30' : ''}`}
                    onClick={() => setSelectedLever(lever.id)}
                  >
                    <div className="w-44 shrink-0">
                      <p className="text-sm font-medium text-foreground truncate">{lever.name}</p>
                      <p className="text-[10px] text-muted font-mono">{lever.category}</p>
                    </div>

                    <div className="flex-1 flex items-center gap-1">
                      {fulcrumOrder.map((f, fi) => {
                        const status = lever.fulcrums[f].status;
                        const score = statusScore[status];
                        const width = Math.max(15, score * 33);
                        const isViolated = (
                          (f === 'epistemic' && (status === 'verified' || status === 'assumed') && (lever.fulcrums.material.status === 'absent' || lever.fulcrums.material.status === 'at_risk')) ||
                          (f === 'relational' && (status === 'verified' || status === 'assumed') && (lever.fulcrums.epistemic.status === 'absent' || lever.fulcrums.epistemic.status === 'at_risk'))
                        );

                        return (
                          <div key={f} className="flex items-center gap-1">
                            {fi > 0 && (
                              <svg className="w-4 h-4 text-muted/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            )}
                            <motion.div
                              className={`h-8 rounded flex items-center justify-center text-[10px] font-mono relative ${
                                isViolated ? 'ring-2 ring-at-risk animate-pulse' : ''
                              }`}
                              style={{
                                width: `${width}%`,
                                backgroundColor: `${fulcrumColors[f]}${score === 3 ? 'cc' : score === 2 ? '80' : score === 1 ? '40' : '15'}`,
                                borderLeft: `3px solid ${fulcrumColors[f]}`,
                              }}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: idx * 0.05 + fi * 0.1, duration: 0.3 }}
                            >
                              <span className="text-white/80">{statusLabels[status]}</span>
                              {isViolated && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-at-risk rounded-full flex items-center justify-center text-[8px] text-white font-bold">!</span>
                              )}
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-6 shrink-0 flex justify-center">
                      {hasViolation && (
                        <motion.span
                          className="text-at-risk text-lg"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          title={violations[0]}
                        >
                          ⚠
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cascade Effect Panel */}
            <div className="bg-surface rounded-xl border border-white/5 p-6">
              <h2 className="font-heading text-xl font-semibold mb-4">Cascade Effect</h2>
              {activeLever ? (
                <div>
                  <p className="text-sm text-accent font-medium mb-3">{activeLever.name}</p>
                  <div className="mb-4">
                    <p className="text-xs text-muted mb-2 font-mono uppercase tracking-wider">Current Phase</p>
                    <div className="flex items-center gap-2">
                      {fulcrumOrder.map((f) => {
                        const phase = getFulcrumPhase(activeLever);
                        const isActive = f === phase;
                        const isPast = fulcrumOrder.indexOf(f) < fulcrumOrder.indexOf(phase as typeof fulcrumOrder[number]);
                        const isComplete = phase === 'complete';

                        return (
                          <div key={f} className="flex items-center gap-2">
                            {fulcrumOrder.indexOf(f) > 0 && (
                              <div className={`w-8 h-0.5 ${isPast || isComplete ? 'bg-verified' : 'bg-white/10'}`} />
                            )}
                            <motion.div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                                isComplete || isPast
                                  ? 'border-verified bg-verified/20 text-verified'
                                  : isActive
                                  ? 'border-accent bg-accent/20 text-accent'
                                  : 'border-white/10 bg-white/5 text-muted'
                              }`}
                              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              {(isComplete || isPast) ? '✓' : fulcrumLabels[f][0]}
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <AnimatePresence>
                      {getCascadeEffects(activeLever).map((effect, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-3 items-start"
                        >
                          <div className="w-5 h-5 shrink-0 rounded bg-accent/10 flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                          <p className="text-sm text-foreground/80">{effect}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 space-y-2">
                    {fulcrumOrder.map((f) => {
                      const state = activeLever.fulcrums[f];
                      return (
                        <div key={f} className="flex items-center gap-3 p-2 rounded bg-white/[0.02]">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fulcrumColors[f] }} />
                          <span className="text-xs font-medium w-20">{fulcrumLabels[f]}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            state.status === 'verified' ? 'bg-verified/20 text-verified' :
                            state.status === 'assumed' ? 'bg-assumed/20 text-assumed' :
                            state.status === 'at_risk' ? 'bg-at-risk/20 text-at-risk' :
                            'bg-white/5 text-muted'
                          }`}>{statusLabels[state.status]}</span>
                          {state.evidence && (
                            <span className="text-[10px] text-muted truncate flex-1">{state.evidence}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-muted text-sm">Select a lever from the timeline above.</p>
              )}
            </div>

            {/* Recommendations Panel */}
            <div className="bg-surface rounded-xl border border-white/5 p-6">
              <h2 className="font-heading text-xl font-semibold mb-4">Recommendations</h2>
              {recommendations.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">All levers are in sequence. No recommendations needed.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border ${
                        rec.priority === 'high'
                          ? 'bg-at-risk/5 border-at-risk/20'
                          : rec.priority === 'medium'
                          ? 'bg-assumed/5 border-assumed/20'
                          : 'bg-verified/5 border-verified/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          rec.priority === 'high' ? 'bg-at-risk/20 text-at-risk' :
                          rec.priority === 'medium' ? 'bg-assumed/20 text-assumed' :
                          'bg-verified/20 text-verified'
                        }`}>{rec.priority}</span>
                        <span className="text-xs font-medium text-foreground">{rec.lever}</span>
                      </div>
                      <p className="text-xs text-foreground/70">{rec.recommendation}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </PageTransition>
  );
}
