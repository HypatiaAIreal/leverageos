'use client';

import { motion } from 'framer-motion';

export default function EvolutionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Evolution Tracker</h1>
        <p className="text-muted text-sm mt-1">Track lever growth over time</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-xl border border-white/5 p-12 text-center"
      >
        <div className="text-6xl mb-4 opacity-20">📈</div>
        <h2 className="font-heading text-xl font-semibold mb-2">Coming in Phase 6</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          History charts, lever growth tracking, milestones,
          and pattern detection across your entire leverage system.
        </p>
        <p className="text-muted/30 text-xs font-mono mt-4">Growth &amp; Patterns</p>
      </motion.div>
    </div>
  );
}
