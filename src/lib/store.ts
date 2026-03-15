'use client';

import { Lever } from './types';

const STORAGE_KEY = 'leverageos_levers';

export function getLevers(): Lever[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLevers(levers: Lever[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levers));
}

export function saveLever(lever: Lever): void {
  const levers = getLevers();
  const idx = levers.findIndex((l) => l.id === lever.id);
  if (idx >= 0) {
    levers[idx] = lever;
  } else {
    levers.push(lever);
  }
  saveLevers(levers);
}

export function deleteLever(id: string): void {
  const levers = getLevers().filter((l) => l.id !== id);
  saveLevers(levers);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function detectSequenceViolations(lever: Lever): string[] {
  const violations: string[] = [];
  const { material, epistemic, relational } = lever.fulcrums;

  // Epistemic active without Material verified
  if (
    (epistemic.status === 'verified' || epistemic.status === 'assumed') &&
    (material.status === 'absent' || material.status === 'at_risk')
  ) {
    violations.push(
      'Sequence violation: Epistemic fulcrum is active but Material fulcrum is not secured. Material must come first (Ch. 10).'
    );
  }

  // Relational active without Epistemic verified
  if (
    (relational.status === 'verified' || relational.status === 'assumed') &&
    (epistemic.status === 'absent' || epistemic.status === 'at_risk')
  ) {
    violations.push(
      'Sequence violation: Relational fulcrum is active but Epistemic fulcrum is not secured. Epistemic must precede Relational (Ch. 10).'
    );
  }

  // Relational active without Material verified
  if (
    (relational.status === 'verified' || relational.status === 'assumed') &&
    (material.status === 'absent' || material.status === 'at_risk')
  ) {
    violations.push(
      'Sequence violation: Relational fulcrum is active but Material fulcrum is not secured. Material is the foundation (Ch. 10).'
    );
  }

  return violations;
}

export function loadSampleData(): Lever[] {
  const now = new Date().toISOString();
  const samples: Lever[] = [
    {
      id: generateId(),
      name: 'Technical Writing Portfolio',
      description: 'Building authority through published technical articles and documentation',
      category: 'Career',
      created: now,
      properties: { r: 8, l: 7, q: 9 },
      effectiveLeverage: 504,
      fulcrums: {
        material: { status: 'verified', evidence: '6 months savings + freelance income covers living costs', lastVerified: now, verificationEvent: 'Bank statement review' },
        epistemic: { status: 'verified', evidence: '12 published articles, 3 in top-tier publications', lastVerified: now, verificationEvent: 'Publication record' },
        relational: { status: 'assumed', evidence: 'Growing Twitter following, but no direct client testimonials yet', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'SaaS Side Project',
      description: 'Developer tool for API monitoring with freemium model',
      category: 'Business',
      created: now,
      properties: { r: 5, l: 9, q: 6 },
      effectiveLeverage: 270,
      fulcrums: {
        material: { status: 'at_risk', evidence: 'Only 2 months runway if main income stops', lastVerified: now, verificationEvent: 'Financial review' },
        epistemic: { status: 'assumed', evidence: 'Beta users positive but no formal validation', lastVerified: null, verificationEvent: '' },
        relational: { status: 'absent', evidence: '', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Public Speaking',
      description: 'Conference talks and workshop facilitation for industry visibility',
      category: 'Brand',
      created: now,
      properties: { r: 4, l: 8, q: 7 },
      effectiveLeverage: 224,
      fulcrums: {
        material: { status: 'verified', evidence: 'Day job covers all expenses, speaking is supplemental', lastVerified: now, verificationEvent: 'Employment contract active' },
        epistemic: { status: 'at_risk', evidence: 'Only 2 talks given, need more track record', lastVerified: now, verificationEvent: 'Conference feedback review' },
        relational: { status: 'verified', evidence: 'Strong recommendation from conference organizer', lastVerified: now, verificationEvent: 'Email from organizer' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Graduate Degree',
      description: 'Part-time masters in computational design',
      category: 'Education',
      created: now,
      properties: { r: 9, l: 6, q: 8 },
      effectiveLeverage: 432,
      fulcrums: {
        material: { status: 'verified', evidence: 'Employer tuition reimbursement approved', lastVerified: now, verificationEvent: 'HR approval letter' },
        epistemic: { status: 'verified', evidence: 'Accredited program, published curriculum', lastVerified: now, verificationEvent: 'University accreditation' },
        relational: { status: 'assumed', evidence: 'Degree generally respected but untested in target industry', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Open Source Library',
      description: 'React component library for accessible data visualization',
      category: 'Community',
      created: now,
      properties: { r: 6, l: 10, q: 5 },
      effectiveLeverage: 300,
      fulcrums: {
        material: { status: 'verified', evidence: 'Hobby project, no financial dependency', lastVerified: now, verificationEvent: 'N/A - zero cost' },
        epistemic: { status: 'assumed', evidence: '200 GitHub stars but no independent audits', lastVerified: null, verificationEvent: '' },
        relational: { status: 'absent', evidence: '', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
  ];

  saveLevers(samples);
  return samples;
}
