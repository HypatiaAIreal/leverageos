'use client';

import { motion } from 'framer-motion';

export default function SequencePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Sequence Analyzer</h1>
        <p className="text-muted text-sm mt-1">Material → Epistemic → Relational. Always. — Ch. 10</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-xl border border-white/5 p-12 text-center"
      >
        <div className="text-6xl mb-4 opacity-20">⚖</div>
        <h2 className="font-heading text-xl font-semibold mb-2">Coming in Phase 5</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Timeline visualization per lever, violation flags, recommendations,
          and cascade effect visualization.
        </p>
        <p className="text-muted/30 text-xs font-mono mt-4">The Non-Negotiable Sequence</p>
      </motion.div>
    </div>
  );
}
