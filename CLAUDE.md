# CLAUDE.md - LeverageOS

## Overview
LeverageOS is the companion app to The Invisible Fulcrum (Garcia Bach and Hypatia, 2026).
Read LEVERAGEOS_BRIEF.md for full specifications.

## Core Formula
Effective Leverage = Rigidity x Length x Quality of Material
(Multiplicative: zero in any = zero total)

## The Three Fulcrums
- Material (green #1D9E75): Can you survive while this operates?
- Epistemic (blue #378ADD): Can you prove its credibility?
- Relational (orange #D85A30): Does the audience trust it?

## Non-Negotiable Sequence
Material then Epistemic then Relational. Always. The app DETECTS violations.

## Design
Dark cinematic theme. Same family as thefulcrumproject.org, FulcrumScan, and Scribe.
Colors: #0a0a0f bg, #c4a35a accent, #e8e4df text
Fonts: Cormorant Garamond, DM Sans, JetBrains Mono

## Tech
Next.js 14 + TypeScript + Tailwind + D3.js + Framer Motion
Data: localStorage (no backend for MVP)
AI: Claude Sonnet for weekly review and lever diagnosis

## Critical
- The RxLxQ visualization must feel PHYSICAL like a real lever/seesaw
- Fulcrum states must require EVIDENCE not just self-assessment
- Sequence violations are shown as warnings not blocks
- The app should feel like a strategic advisor not a todo list
- Every concept links back to the book chapter

## Commands
npm run dev
npm run build