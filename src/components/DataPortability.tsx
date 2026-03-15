'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevers, saveLevers } from '@/lib/store';
import { Lever } from '@/lib/types';

export default function DataPortability({ onImport }: { onImport?: () => void }) {
  const [showPanel, setShowPanel] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const levers = getLevers();
    const milestones = typeof window !== 'undefined' ? localStorage.getItem('leverageos_milestones') : null;
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      levers,
      milestones: milestones ? JSON.parse(milestones) : [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leverageos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.levers || !Array.isArray(data.levers)) {
          throw new Error('Invalid format: missing levers array');
        }
        // Validate each lever has required fields
        data.levers.forEach((lever: Lever) => {
          if (!lever.id || !lever.name || !lever.properties || !lever.fulcrums) {
            throw new Error('Invalid lever format');
          }
        });

        saveLevers(data.levers);
        if (data.milestones) {
          localStorage.setItem('leverageos_milestones', JSON.stringify(data.milestones));
        }

        setImportStatus('success');
        setImportMessage(`Imported ${data.levers.length} lever(s) successfully.`);
        onImport?.();
      } catch (err: unknown) {
        setImportStatus('error');
        setImportMessage(err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowPanel(!showPanel)}
        className="px-3 py-1.5 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Import / Export
      </motion.button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 bg-surface border border-white/10 rounded-xl p-4 w-64 z-50 shadow-xl"
          >
            <h3 className="font-heading text-sm font-semibold mb-3">Data Portability</h3>

            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full text-left px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg text-xs transition-colors group"
              >
                <span className="text-foreground font-medium group-hover:text-accent transition-colors">Export JSON</span>
                <p className="text-muted/60 text-[10px] mt-0.5">Download all levers and milestones</p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg text-xs transition-colors group"
              >
                <span className="text-foreground font-medium group-hover:text-accent transition-colors">Import JSON</span>
                <p className="text-muted/60 text-[10px] mt-0.5">Restore from exported file</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            <AnimatePresence>
              {importStatus !== 'idle' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-[10px] mt-2 ${importStatus === 'success' ? 'text-verified' : 'text-at-risk'}`}
                >
                  {importMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
