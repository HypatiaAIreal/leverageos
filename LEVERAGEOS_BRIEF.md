# LEVERAGE OS - Your Life as a System of Conscious Leverage

## The App That Makes The Invisible Fulcrum Interactive

### What to build
A personal strategic dashboard that brings The Invisible Fulcrum to life. Users map their projects, career, and goals as LEVERS - each with three measurable properties (Rigidity, Length, Quality) and three fulcrums (Material, Epistemic, Relational) with verification states. The app detects sequence violations, identifies bottlenecks, finds quick wins, and generates AI-powered weekly reviews.

### Tech Stack
- Framework: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS
- Animations: Framer Motion
- Charts: D3.js for force/lever visualizations
- State: localStorage for MVP
- AI: Anthropic API (Claude Sonnet) for weekly analysis
- Deploy: Vercel

### Core Concepts

The Three Properties of a Lever (Chapter 5):
- Rigidity (R): Resistance to breaking under pressure. Scale 1-10.
- Length (L): Reach/amplification. Scale 1-10.
- Quality (Q): Excellence of core substance. Scale 1-10.

Effective Leverage = R x L x Q (multiplicative - zero in ANY = zero total)

The Three Fulcrums (Chapters 7-9):
- Material: Can you survive while this lever operates?
- Epistemic: Can you prove this lever credibility?
- Relational: Does the target audience trust this lever?

Fulcrum States: VERIFIED / ASSUMED / AT_RISK / ABSENT

The Non-Negotiable Sequence (Chapter 10):
Material then Epistemic then Relational. Always.

The Fulcrum Trap (new concept):
When the fulcrum is built on pain/resistance instead of genuine foundation.

### 5 Views

VIEW 1 DASHBOARD: Fulcrum Health bars, Lever Portfolio table sorted by RxLxQ, This Week AI panel, Alerts.

VIEW 2 LEVER WORKSHOP: Add/edit levers. Three sliders R/L/Q (1-10). Real-time score. Fulcrum state selectors with evidence fields. Sequence violation detection. Dependencies.

VIEW 3 FULCRUM MAP: D3 concentric rings (Material outer, Epistemic middle, Relational inner). Levers as nodes. Click for details. Pulse on alerts. Filters.

VIEW 4 SEQUENCE ANALYZER: Timeline per lever. Violation flags. Recommendations. Cascade effect visualization.

VIEW 5 EVOLUTION TRACKER: History charts. Lever growth. Milestones. Pattern detection.

### AI Integration
Weekly Review /api/review: quick win, bottleneck, sequence alerts, fulcrum trap warnings, celebrations.
On-Demand /api/diagnose-lever: deep analysis of any lever.
Model: claude-sonnet-4-6

### Design System
Colors: bg #0a0a0f, surface #12121a, text #e8e4df, muted #6a6570, accent #c4a35a
Fulcrum: material #1D9E75, epistemic #378ADD, relational #D85A30
Status: verified #22c55e, assumed #f59e0b, at-risk #ef4444, absent #374151
Property: rigidity #8b5cf6, length #06b6d4, quality #ec4899
Fonts: Cormorant Garamond (headings), DM Sans (body), JetBrains Mono (data)
Film grain texture. Dark cinematic theme.

### Data Model (localStorage)
Lever: id, name, description, category, created, properties{r,l,q}, effectiveLeverage, fulcrums{material,epistemic,relational}, dependencies[], history[]
FulcrumState: status, evidence, lastVerified, verificationEvent
HistoryEntry: date, properties, fulcrums
WeeklyReview: date, quickWin, bottleneck, sequenceAlerts[], fulcrumTraps[], celebration

### Build Phases
1. Next.js + Tailwind + dark theme + 5-view nav + Framer Motion
2. Dashboard: Fulcrum Health + Lever Portfolio + empty states + sample data
3. Lever Workshop: Add/edit with RxLxQ sliders + fulcrum selectors + real-time score
4. Fulcrum Map: D3 concentric rings with interactive nodes
5. Sequence Analyzer: Timeline + violations + recommendations
6. Evolution Tracker: History charts + milestones
7. AI: /api/review + /api/diagnose-lever with Claude Sonnet
8. Polish: responsive, onboarding, sample data, export/import

### Environment Variables
ANTHROPIC_API_KEY=sk-ant-...

### Book Connection
Every screen links to its chapter. Tooltips quote the book.
Fulcrum Health -> Ch 7-9. RxLxQ -> Ch 5. Sequence -> Ch 10. Fulcrum Trap -> Next edition.

The book is the theory. LeverageOS is the practice. Together, they are the fulcrum.