'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

interface Section {
  id: string;
  title: string;
  content: string;
}

const sections: Section[] = [
  {
    id: 'lever',
    title: 'What is a Lever?',
    content: `A lever is any asset, project, skill, or capability you're actively building to create future value.

Examples:
• A SaaS product you're developing (Business lever)
• A technical writing portfolio (Career lever)
• A graduate degree (Education lever)
• An open-source library (Community lever)
• A personal brand presence (Brand lever)

Not everything is a lever. A lever must have intention behind it — you're investing time, energy, or resources with the expectation of compounding returns. A lever that nobody is actively building is just an idea.`,
  },
  {
    id: 'formula',
    title: 'The R×L×Q Formula',
    content: `Effective Leverage = Rigidity × Length × Quality of Material

This is MULTIPLICATIVE, not additive. Zero in any dimension means zero total leverage, no matter how strong the other two are.

Rigidity (R, 1-10): How resistant to external shocks. Can this lever survive market changes, competition, personal crises? A rigid lever doesn't snap under pressure.

Length (L, 1-10): How far does it reach? What's the time horizon and amplification potential? A long lever touches more people, lasts longer, and compounds further.

Quality (Q, 1-10): How excellent is the underlying material? Is the work genuinely good, or is it held together with duct tape? Quality is the foundation everything else rests on.

Why multiplicative? Because a beautifully crafted, far-reaching project that shatters at the first sign of trouble (R=0) creates zero leverage. Each property is a necessary condition.`,
  },
  {
    id: 'fulcrums',
    title: 'The Three Fulcrums',
    content: `Every lever rests on three fulcrums. Without all three, the lever can't do real work.

Material Fulcrum (Green): Can you survive while this operates?
This is about financial runway, living costs, and basic stability. If building this lever threatens your survival, the fulcrum is absent. Material comes first because you can't think clearly when you're desperate.

Epistemic Fulcrum (Blue): Can you prove its credibility?
This is about evidence, not feelings. Published work, paying customers, third-party validation, peer review. "I think it's good" is not epistemic credibility. "12 published articles and 3 client testimonials" is.

Relational Fulcrum (Orange): Does the audience trust it?
This is about social proof, reputation, and relationships. Do the people who matter know about this lever? Do they trust it? A brilliant product nobody knows about has no relational fulcrum.`,
  },
  {
    id: 'states',
    title: 'Fulcrum States',
    content: `Each fulcrum has one of four states:

Verified (Green): Proven with specific evidence. "Bank statement shows 6 months runway" or "12 published articles in top-tier outlets." This is the only fully reliable state.

Assumed (Amber): You believe it's true but haven't proven it. "I think my savings are enough" or "People seem to like the product." Assumptions are the most dangerous state because they feel like verification.

At Risk (Red): Showing visible cracks. "Only 2 months runway left" or "Lost a major client." At Risk is actually more honest than Assumed — at least you're seeing reality.

Absent (Gray): Not present at all. No evidence, no assumption, nothing. An absent fulcrum means this dimension hasn't been addressed yet.

The app requires EVIDENCE for each state change. "How do you know?" is the question that separates real leverage from wishful thinking.`,
  },
  {
    id: 'sequence',
    title: 'The Sequence',
    content: `Material → Epistemic → Relational. Always. Non-negotiable.

Why this order?

1. Material first: If you can't survive while building, nothing else matters. Secure your runway before proving credibility.

2. Epistemic second: Once you can survive, prove your work is real. Gather evidence, get external validation, build a track record. Don't ask people to trust something you can't prove.

3. Relational last: Only after you have survival secured AND evidence in hand should you build relationships and seek trust. Trust built on unproven claims is a house of cards.

The app DETECTS sequence violations — like building Relational trust before Epistemic credibility is verified. These show as warnings, not blocks. You can proceed, but you should know you're taking a structural risk.`,
  },
  {
    id: 'dashboard',
    title: 'Reading Your Dashboard',
    content: `The Dashboard shows your leverage system at a glance:

Fulcrum Health Bars: Three vertical bars showing Material, Epistemic, and Relational health as percentages. Calculated as a weighted average: Verified (100%) > Assumed (60%) > At Risk (25%) > Absent (0%).

System Interpretation: Auto-generated analysis below the health bars. Color-coded green/amber/red to show what needs attention.

Lever Portfolio: All your levers sorted by R×L×Q score. The three dots next to each lever show fulcrum status at a glance (green/amber/red/gray).

This Week: AI-powered strategic review using Claude Sonnet. Identifies quick wins, bottlenecks, sequence alerts, fulcrum traps, and celebrations.

Alerts: Real-time notifications for sequence violations and zero-leverage warnings.`,
  },
  {
    id: 'patterns',
    title: 'Common Patterns',
    content: `Relational Bottleneck: Material and Epistemic are solid, but nobody knows about your work. This is the most common pattern for builders — great work, invisible to the world. Fix: systematic relationship-building, not more building.

Epistemic Inflation: Rating yourself higher than evidence supports. "My product is great" without customer data. The most dangerous pattern because it feels like progress. Fix: seek external validation ruthlessly.

Material Neglect: Jumping to Relational (networking, marketing) before Material is secure. Common in startup culture. Fix: check your runway before your social media.

Assumed Everything: All fulcrums are "Assumed" with no verified evidence anywhere. This is running on vibes. Fix: pick ONE fulcrum on ONE lever and verify it with real evidence this week.

Length Without Quality: High reach, low substance. Viral content that doesn't convert, a broad network with shallow relationships. Fix: narrow your reach and deepen quality first.`,
  },
  {
    id: 'trap',
    title: 'The Fulcrum Trap',
    content: `The Fulcrum Trap occurs when pain becomes your fulcrum — when the stress of maintaining a lever becomes the thing holding it in place.

Signs of a Fulcrum Trap:
• You can't stop working on a lever even though it's destroying your Material fulcrum
• You keep "assuming" things are fine because admitting the truth would require action
• Your evidence for a fulcrum status is "I've been doing this for years" rather than current data
• Fixing one lever would require admitting another lever has failed

The trap is that the pain feels like commitment. "I'm suffering for this, so it must be important." But suffering is not evidence of leverage. The formula doesn't care how hard you worked — only whether R, L, and Q are real.

To escape: force yourself to re-assess fulcrum states with fresh evidence. Ignore sunk costs. Ask: "If I were starting today, would I build this lever?"`,
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  return (
    <PageTransition>
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Help &amp; Reference</h1>
        <p className="text-muted text-sm mt-1">Concepts from The Invisible Fulcrum — Garcia Bach &amp; Hypatia, 2026</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <h3 className="font-heading text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Topics</h3>
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-white/5'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-surface rounded-xl border border-white/5 p-6">
          <AnimatePresence mode="wait">
            {sections.filter((s) => s.id === activeSection).map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{section.title}</h2>
                <div className="text-foreground/80 text-sm whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
