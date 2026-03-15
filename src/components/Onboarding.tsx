'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const ONBOARDING_KEY = 'leverageos_onboarded';

const steps = [
  {
    title: 'Welcome to LeverageOS',
    subtitle: 'Your Life as a System of Conscious Leverage',
    body: 'Companion app to The Invisible Fulcrum (Garcia Bach & Hypatia, 2026). Every action you take is a lever. This system helps you see, calibrate, and strengthen them.',
    color: '#c4a35a',
  },
  {
    title: 'The Formula',
    subtitle: 'Effective Leverage = R × L × Q',
    body: 'Rigidity — how shockproof is it?\nLength — how far does it reach?\nQuality — how excellent is the material?\n\nMultiplicative: zero in any = zero total.',
    color: '#c4a35a',
  },
  {
    title: 'The Three Fulcrums',
    subtitle: 'Material → Epistemic → Relational',
    body: 'Material: Can you survive while this operates?\nEpistemic: Can you prove its credibility?\nRelational: Does the audience trust it?\n\nThis sequence is non-negotiable.',
    color: '#1D9E75',
  },
  {
    title: 'Your Toolkit',
    subtitle: 'Five views, one system',
    body: 'Dashboard — system health at a glance\nWorkshop — create and calibrate levers\nFulcrum Map — visual mapping in fulcrum space\nSequence Analyzer — violation detection\nEvolution Tracker — growth over time',
    color: '#378ADD',
  },
];

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(ONBOARDING_KEY);
  });

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { showOnboarding: show, completeOnboarding: complete };
}

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-surface border border-white/10 rounded-2xl max-w-lg w-full p-8 relative overflow-hidden"
      >
        {/* Accent glow */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: current.color }}
        />

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-colors ${
                i <= step ? 'bg-accent' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">{current.title}</h2>
        <p className="text-accent text-sm font-mono mb-4">{current.subtitle}</p>
        <div className="text-foreground/70 text-sm whitespace-pre-line leading-relaxed mb-8">
          {current.body}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`text-sm text-muted hover:text-foreground transition-colors ${step === 0 ? 'invisible' : ''}`}
          >
            Back
          </button>
          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={onComplete}
                className="text-xs text-muted/50 hover:text-muted transition-colors"
              >
                Skip
              </button>
            )}
            <motion.button
              onClick={isLast ? onComplete : () => setStep(step + 1)}
              className="px-5 py-2 bg-accent text-background font-medium rounded-lg text-sm hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLast ? 'Get Started' : 'Next'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
