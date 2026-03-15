'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lever, FulcrumStatus, FulcrumState } from '@/lib/types';
import { getLevers, saveLever, deleteLever, generateId, detectSequenceViolations, getLanguage } from '@/lib/store';

const categories = ['Career', 'Business', 'Brand', 'Education', 'Community', 'Personal', 'Financial', 'Creative'];

const fulcrumStatusOptions: { value: FulcrumStatus; label: string; color: string }[] = [
  { value: 'verified', label: 'Verified', color: 'border-verified text-verified' },
  { value: 'assumed', label: 'Assumed', color: 'border-assumed text-assumed' },
  { value: 'at_risk', label: 'At Risk', color: 'border-at-risk text-at-risk' },
  { value: 'absent', label: 'Absent', color: 'border-absent text-muted' },
];

const emptyFulcrum: FulcrumState = {
  status: 'absent',
  evidence: '',
  lastVerified: null,
  verificationEvent: '',
};

function createEmptyLever(): Lever {
  return {
    id: generateId(),
    name: '',
    description: '',
    category: 'Career',
    created: new Date().toISOString(),
    properties: { r: 5, l: 5, q: 5 },
    effectiveLeverage: 125,
    fulcrums: {
      material: { ...emptyFulcrum },
      epistemic: { ...emptyFulcrum },
      relational: { ...emptyFulcrum },
    },
    dependencies: [],
    history: [],
  };
}

export default function WorkshopPageWrapper() {
  return (
    <Suspense fallback={<div className="text-muted p-8">Loading workshop...</div>}>
      <WorkshopPage />
    </Suspense>
  );
}

function WorkshopPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [levers, setLevers] = useState<Lever[]>([]);
  const [currentLever, setCurrentLever] = useState<Lever>(createEmptyLever());
  const [isEditing, setIsEditing] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getLevers();
    setLevers(stored);
    if (editId) {
      const found = stored.find((l) => l.id === editId);
      if (found) {
        setCurrentLever(found);
        setIsEditing(true);
      }
    }
  }, [editId]);

  const updateViolations = useCallback((lever: Lever) => {
    setViolations(detectSequenceViolations(lever));
  }, []);

  useEffect(() => {
    updateViolations(currentLever);
  }, [currentLever, updateViolations]);

  const score = currentLever.properties.r * currentLever.properties.l * currentLever.properties.q;

  const updateProperty = (prop: 'r' | 'l' | 'q', value: number) => {
    setCurrentLever((prev) => ({
      ...prev,
      properties: { ...prev.properties, [prop]: value },
      effectiveLeverage: prop === 'r' ? value * prev.properties.l * prev.properties.q
        : prop === 'l' ? prev.properties.r * value * prev.properties.q
        : prev.properties.r * prev.properties.l * value,
    }));
  };

  const updateFulcrum = (type: 'material' | 'epistemic' | 'relational', field: keyof FulcrumState, value: string) => {
    setCurrentLever((prev) => ({
      ...prev,
      fulcrums: {
        ...prev.fulcrums,
        [type]: {
          ...prev.fulcrums[type],
          [field]: value,
          ...(field === 'status' && value === 'verified' ? { lastVerified: new Date().toISOString() } : {}),
        },
      },
    }));
  };

  const handleSave = () => {
    if (!currentLever.name.trim()) return;
    const lever = { ...currentLever, effectiveLeverage: score };
    saveLever(lever);
    setLevers(getLevers());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!isEditing) {
      setCurrentLever(createEmptyLever());
    }
  };

  const handleNew = () => {
    setCurrentLever(createEmptyLever());
    setIsEditing(false);
    setSaved(false);
  };

  const handleDelete = () => {
    if (isEditing) {
      deleteLever(currentLever.id);
      setLevers(getLevers());
      handleNew();
    }
  };

  const handleEditLever = (lever: Lever) => {
    setCurrentLever(lever);
    setIsEditing(true);
    setSaved(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Lever Workshop</h1>
          <p className="text-muted text-sm mt-1">Define and calibrate your levers — Ch. 5</p>
        </div>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
        >
          + New Lever
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Lever list */}
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <h3 className="font-heading text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Your Levers</h3>
          {levers.length === 0 ? (
            <p className="text-muted text-xs text-center py-8">No levers yet. Create one!</p>
          ) : (
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
              {levers.map((lever) => (
                <button
                  key={lever.id}
                  onClick={() => handleEditLever(lever)}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                    currentLever.id === lever.id
                      ? 'bg-accent/10 border border-accent/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{lever.name}</span>
                    <span className="font-mono text-xs text-accent ml-2">{lever.effectiveLeverage}</span>
                  </div>
                  <span className="text-xs text-muted">{lever.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center + Right: Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name, Description, Category */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-4">
            <input
              type="text"
              placeholder="Lever name..."
              value={currentLever.name}
              onChange={(e) => setCurrentLever((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-transparent text-xl font-heading font-bold text-foreground placeholder:text-muted/30 outline-none border-b border-white/5 pb-2"
            />
            <textarea
              placeholder="What does this lever do? What outcome does it create?"
              value={currentLever.description}
              onChange={(e) => setCurrentLever((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-transparent text-sm text-foreground/80 placeholder:text-muted/30 outline-none resize-none h-16"
            />
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCurrentLever((prev) => ({ ...prev, category: cat }))}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    currentLever.category === cat
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-white/10 text-muted hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* R x L x Q Sliders */}
          <div className="bg-surface rounded-xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Properties — R &times; L &times; Q</h3>
              <motion.div
                key={score}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-right"
              >
                <span className="font-mono text-4xl font-bold text-accent">{score}</span>
                <p className="text-[10px] text-muted font-mono">Effective Leverage</p>
              </motion.div>
            </div>

            <div className="space-y-6">
              <PropertySlider
                label="Rigidity"
                subtitle="Resistance to breaking under pressure"
                tooltip="How shockproof is this lever? Can it survive market changes, competition, or personal crises without snapping? Rate 1 (fragile) to 10 (unbreakable)."
                value={currentLever.properties.r}
                onChange={(v) => updateProperty('r', v)}
                color="rigidity"
                chapter="Ch. 5"
              />
              <PropertySlider
                label="Length"
                subtitle="Reach and amplification"
                tooltip="How far does this lever reach? What's the time horizon and number of people it touches? Rate 1 (local/short-term) to 10 (global/permanent)."
                value={currentLever.properties.l}
                onChange={(v) => updateProperty('l', v)}
                color="length"
                chapter="Ch. 5"
              />
              <PropertySlider
                label="Quality"
                subtitle="Excellence of core substance"
                tooltip="How excellent is the underlying work? Is it genuinely best-in-class or held together with shortcuts? Rate 1 (minimal viable) to 10 (world-class)."
                value={currentLever.properties.q}
                onChange={(v) => updateProperty('q', v)}
                color="quality"
                chapter="Ch. 5"
              />
            </div>
          </div>

          {/* Fulcrum States */}
          <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-6">
            <h3 className="font-heading text-lg font-semibold">The Three Fulcrums</h3>

            <FulcrumEditor
              label="Material Fulcrum"
              subtitle="Can you survive while this lever operates?"
              tooltip="Financial runway, living costs, basic stability. If this lever threatens your survival, the fulcrum is absent. Verified = specific evidence (e.g., 'Bank statement shows 6 months runway')."
              color="material"
              chapter="Ch. 7"
              state={currentLever.fulcrums.material}
              onChange={(field, value) => updateFulcrum('material', field, value)}
            />

            <div className="border-t border-white/5" />

            <FulcrumEditor
              label="Epistemic Fulcrum"
              subtitle="Can you prove this lever's credibility?"
              tooltip="Evidence of credibility: published work, customer data, peer review, external validation. 'I think it's good' is not epistemic proof. Requires EVIDENCE, not belief."
              color="epistemic"
              chapter="Ch. 8"
              state={currentLever.fulcrums.epistemic}
              onChange={(field, value) => updateFulcrum('epistemic', field, value)}
            />

            <div className="border-t border-white/5" />

            <FulcrumEditor
              label="Relational Fulcrum"
              subtitle="Does the target audience trust this lever?"
              tooltip="Social proof, reputation, relationships with the people who matter. Do the right people know about this lever? Do they trust it? Testimonials, referrals, and public endorsements count."
              color="relational"
              chapter="Ch. 9"
              state={currentLever.fulcrums.relational}
              onChange={(field, value) => updateFulcrum('relational', field, value)}
            />
          </div>

          {/* Sequence Violations */}
          <AnimatePresence>
            {violations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-at-risk/5 border border-at-risk/20 rounded-xl p-4 space-y-2"
              >
                <h4 className="text-at-risk font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Sequence Violation Detected
                </h4>
                {violations.map((v, i) => (
                  <p key={i} className="text-sm text-foreground/70">{v}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Diagnosis */}
          {isEditing && <LeverDiagnosis lever={currentLever} />}

          {/* Save / Delete */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleSave}
              disabled={!currentLever.name.trim()}
              className="px-6 py-2.5 bg-accent text-background font-medium rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isEditing ? 'Update Lever' : 'Save Lever'}
            </motion.button>

            {isEditing && (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 text-at-risk/70 hover:text-at-risk text-sm transition-colors"
              >
                Delete
              </button>
            )}

            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-verified text-sm font-mono"
                >
                  Saved to localStorage
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertySlider({
  label,
  subtitle,
  tooltip,
  value,
  onChange,
  color,
  chapter,
}: {
  label: string;
  subtitle: string;
  tooltip?: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  chapter: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const colorClasses: Record<string, string> = {
    rigidity: 'accent-rigidity',
    length: 'accent-length',
    quality: 'accent-quality',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{label}</span>
          {tooltip && (
            <div className="relative">
              <button
                onClick={() => setShowTip(!showTip)}
                className="w-4 h-4 rounded-full bg-white/10 text-muted hover:text-foreground hover:bg-white/20 flex items-center justify-center text-[10px] font-bold transition-colors"
              >
                ?
              </button>
              {showTip && (
                <div className="absolute left-6 top-0 z-50 w-64 p-3 bg-surface border border-white/10 rounded-lg shadow-xl text-xs text-foreground/70 leading-relaxed">
                  {tooltip}
                  <button onClick={() => setShowTip(false)} className="block text-accent text-[10px] mt-1">Close</button>
                </div>
              )}
            </div>
          )}
          <span className="text-xs text-muted ml-1">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted/40 font-mono">{chapter}</span>
          <motion.span
            key={value}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-lg font-bold text-${color}`}
          >
            {value}
          </motion.span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full bg-white/10 ${colorClasses[color]}`}
      />
      <div className="flex justify-between text-[10px] text-muted/30 font-mono mt-1">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

interface DiagnosisData {
  diagnosis: string;
  propertyAnalysis: { rigidity: string; length: string; quality: string };
  fulcrumAnalysis: { material: string; epistemic: string; relational: string };
  nextAction: string;
  risk: string;
  potential: string;
}

function LeverDiagnosis({ lever }: { lever: Lever }) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    try {
      const lang = getLanguage();
      const res = await fetch('/api/diagnose-lever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lever, lang }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to diagnose');
      }
      setDiagnosis(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold">AI Diagnosis</h3>
        <motion.button
          onClick={handleDiagnose}
          disabled={loading}
          className="px-3 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Analyzing...' : 'Diagnose This Lever'}
        </motion.button>
      </div>

      {loading && (
        <div className="text-center py-6">
          <motion.div
            className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <p className="text-muted text-xs mt-2">Deep analysis in progress...</p>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-at-risk text-xs">{error}</p>
          <button onClick={handleDiagnose} className="text-accent text-xs underline">Retry</button>
        </div>
      )}

      {!loading && !error && !diagnosis && (
        <p className="text-muted text-xs text-center py-4">Click &quot;Diagnose This Lever&quot; for AI-powered deep analysis.</p>
      )}

      {diagnosis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-xs"
        >
          <div>
            <p className="text-muted font-mono uppercase tracking-wider text-[10px] mb-1">Diagnosis</p>
            <p className="text-foreground/90">{diagnosis.diagnosis}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-rigidity font-mono text-[10px] mb-1">Rigidity</p>
              <p className="text-foreground/70">{diagnosis.propertyAnalysis.rigidity}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-length font-mono text-[10px] mb-1">Length</p>
              <p className="text-foreground/70">{diagnosis.propertyAnalysis.length}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3">
              <p className="text-quality font-mono text-[10px] mb-1">Quality</p>
              <p className="text-foreground/70">{diagnosis.propertyAnalysis.quality}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-material/5 rounded-lg p-3 border border-material/10">
              <p className="text-material font-mono text-[10px] mb-1">Material</p>
              <p className="text-foreground/70">{diagnosis.fulcrumAnalysis.material}</p>
            </div>
            <div className="bg-epistemic/5 rounded-lg p-3 border border-epistemic/10">
              <p className="text-epistemic font-mono text-[10px] mb-1">Epistemic</p>
              <p className="text-foreground/70">{diagnosis.fulcrumAnalysis.epistemic}</p>
            </div>
            <div className="bg-relational/5 rounded-lg p-3 border border-relational/10">
              <p className="text-relational font-mono text-[10px] mb-1">Relational</p>
              <p className="text-foreground/70">{diagnosis.fulcrumAnalysis.relational}</p>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
            <p className="text-accent font-mono text-[10px] mb-1">Next Action</p>
            <p className="text-foreground/90">{diagnosis.nextAction}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-at-risk/5 border border-at-risk/10 rounded-lg p-3">
              <p className="text-at-risk font-mono text-[10px] mb-1">Risk</p>
              <p className="text-foreground/70">{diagnosis.risk}</p>
            </div>
            <div className="bg-verified/5 border border-verified/10 rounded-lg p-3">
              <p className="text-verified font-mono text-[10px] mb-1">Potential</p>
              <p className="text-foreground/70">{diagnosis.potential}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FulcrumEditor({
  label,
  subtitle,
  tooltip,
  color,
  chapter,
  state,
  onChange,
}: {
  label: string;
  subtitle: string;
  tooltip?: string;
  color: string;
  chapter: string;
  state: FulcrumState;
  onChange: (field: keyof FulcrumState, value: string) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h4 className={`font-medium text-${color}`}>{label}</h4>
          {tooltip && (
            <div className="relative">
              <button
                onClick={() => setShowTip(!showTip)}
                className="w-4 h-4 rounded-full bg-white/10 text-muted hover:text-foreground hover:bg-white/20 flex items-center justify-center text-[10px] font-bold transition-colors"
              >
                ?
              </button>
              {showTip && (
                <div className="absolute left-6 top-0 z-50 w-64 p-3 bg-surface border border-white/10 rounded-lg shadow-xl text-xs text-foreground/70 leading-relaxed">
                  {tooltip}
                  <button onClick={() => setShowTip(false)} className="block text-accent text-[10px] mt-1">Close</button>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted ml-1">{subtitle}</p>
        </div>
        <span className="text-[10px] text-muted/40 font-mono">{chapter}</span>
      </div>

      {/* Status selector */}
      <div className="flex gap-2 mb-3">
        {fulcrumStatusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange('status', opt.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              state.status === opt.value
                ? `${opt.color} bg-white/5`
                : 'border-white/10 text-muted hover:border-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Evidence field */}
      <textarea
        placeholder="What evidence supports this status? Be specific..."
        value={state.evidence}
        onChange={(e) => onChange('evidence', e.target.value)}
        className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3 text-sm text-foreground/80 placeholder:text-muted/30 outline-none resize-none h-20 focus:border-white/10 transition-colors"
      />

      {/* Verification event */}
      <input
        type="text"
        placeholder="Verification event (e.g., 'Bank statement reviewed')"
        value={state.verificationEvent}
        onChange={(e) => onChange('verificationEvent', e.target.value)}
        className="w-full bg-transparent border-b border-white/5 py-2 text-xs text-foreground/60 placeholder:text-muted/20 outline-none mt-2 focus:border-white/10 transition-colors"
      />
    </div>
  );
}
