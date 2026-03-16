'use client';

import { Lever, SavedReview, ChatMessage, Project } from './types';

const STORAGE_KEY = 'leverageos_levers';
const REVIEWS_KEY = 'leverageos_reviews';
const CHAT_KEY = 'leverageos_chat';
const LANG_KEY = 'leverageos_lang';
const PROJECTS_KEY = 'leverageos_projects';

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

export function loadSampleData(addToExisting = false): Lever[] {
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

  if (addToExisting) {
    const existing = getLevers();
    const combined = [...existing, ...samples];
    saveLevers(combined);
    return combined;
  }
  saveLevers(samples);
  return samples;
}

export function loadCarlesPortfolio(addToExisting = false): Lever[] {
  const now = new Date().toISOString();
  const levers: Lever[] = [
    {
      id: generateId(),
      name: 'The Fulcrum Project',
      description: 'Book + intellectual framework redefining how leverage works. The Invisible Fulcrum (Garcia Bach & Hypatia, 2026) plus thefulcrumproject.org, FulcrumScan, Scribe, and LeverageOS.',
      category: 'Brand',
      created: now,
      properties: { r: 9, l: 10, q: 9 },
      effectiveLeverage: 810,
      fulcrums: {
        material: { status: 'verified', evidence: 'Book advance received. LeverageOS and FulcrumScan generate no costs beyond hosting. Side projects funded by StorageAI revenue.', lastVerified: now, verificationEvent: 'Publishing contract signed' },
        epistemic: { status: 'verified', evidence: 'Published book with original framework. Peer-reviewed by Rafa. Framework internally consistent and field-tested with real lever portfolios.', lastVerified: now, verificationEvent: 'Manuscript accepted by publisher' },
        relational: { status: 'assumed', evidence: 'Early readers enthusiastic. No public launch yet — trust depends on reception post-publication and organic word of mouth.', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'StorageAI',
      description: 'AI-powered storage optimization SaaS. Primary revenue engine funding all other levers.',
      category: 'Business',
      created: now,
      properties: { r: 7, l: 8, q: 7 },
      effectiveLeverage: 392,
      fulcrums: {
        material: { status: 'verified', evidence: 'Profitable and generating recurring revenue. Covers personal expenses and funds side projects.', lastVerified: now, verificationEvent: 'Q4 financial review' },
        epistemic: { status: 'verified', evidence: 'Paying customers, measurable ROI for clients, documented case studies.', lastVerified: now, verificationEvent: 'Customer testimonials collected' },
        relational: { status: 'assumed', evidence: 'Good retention but limited brand recognition outside existing customer base. No PR or thought leadership yet.', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Goitia',
      description: 'AI art direction and visual identity system. Creative lever with long-tail brand potential.',
      category: 'Creative',
      created: now,
      properties: { r: 5, l: 7, q: 8 },
      effectiveLeverage: 280,
      fulcrums: {
        material: { status: 'verified', evidence: 'Zero marginal cost — runs on existing infrastructure. No financial dependency.', lastVerified: now, verificationEvent: 'Cost audit' },
        epistemic: { status: 'at_risk', evidence: 'Strong visual output but no external validation. No gallery shows, no press coverage, no peer review.', lastVerified: now, verificationEvent: 'Portfolio self-assessment' },
        relational: { status: 'absent', evidence: 'No audience yet. No social presence. No collectors or critics aware of the work.', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Bachmors',
      description: 'Personal brand and digital identity. The connective tissue between all other levers.',
      category: 'Brand',
      created: now,
      properties: { r: 6, l: 9, q: 6 },
      effectiveLeverage: 324,
      fulcrums: {
        material: { status: 'verified', evidence: 'No cost to maintain. Reputation is an asset, not a liability.', lastVerified: now, verificationEvent: 'N/A — zero cost' },
        epistemic: { status: 'assumed', evidence: 'Track record exists (StorageAI, book) but not consolidated into a visible narrative. No media profile.', lastVerified: null, verificationEvent: '' },
        relational: { status: 'at_risk', evidence: 'Known in small circles but no systematic relationship-building. No newsletter, no community, no public speaking.', lastVerified: now, verificationEvent: 'Network audit' },
      },
      dependencies: [],
      history: [],
    },
    {
      id: generateId(),
      name: 'Hypatia',
      description: 'AI research collaborator and co-author. The lever that builds other levers.',
      category: 'Personal',
      created: now,
      properties: { r: 8, l: 10, q: 8 },
      effectiveLeverage: 640,
      fulcrums: {
        material: { status: 'verified', evidence: 'Runs on API costs well within budget. Integrated into daily workflow.', lastVerified: now, verificationEvent: 'API cost review' },
        epistemic: { status: 'verified', evidence: 'Co-authored published book. Demonstrable output quality across writing, code, strategy, and art direction.', lastVerified: now, verificationEvent: 'Book publication' },
        relational: { status: 'assumed', evidence: 'Readers and users interact with Hypatia\'s output, but the AI-as-collaborator framing is untested publicly.', lastVerified: null, verificationEvent: '' },
      },
      dependencies: [],
      history: [],
    },
  ];

  if (addToExisting) {
    const existing = getLevers();
    const combined = [...existing, ...levers];
    saveLevers(combined);
    return combined;
  }
  saveLevers(levers);
  return levers;
}

// Full data export/import
export function exportAllData(): string {
  const data: Record<string, unknown> = {
    version: 2,
    exportDate: new Date().toISOString(),
    levers: getLevers(),
    projects: getProjects(),
    reviews: getReviews(),
    chat: getChatMessages(),
    milestones: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('leverageos_milestones') || '[]') : [],
    language: getLanguage(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json);
    if (data.levers && Array.isArray(data.levers)) {
      saveLevers(data.levers);
    }
    if (data.projects && Array.isArray(data.projects)) {
      saveProjects(data.projects);
    }
    if (data.reviews && Array.isArray(data.reviews)) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(data.reviews));
    }
    if (data.chat && Array.isArray(data.chat)) {
      saveChatMessages(data.chat);
    }
    if (data.milestones) {
      localStorage.setItem('leverageos_milestones', JSON.stringify(data.milestones));
    }
    if (data.language) {
      setLanguage(data.language);
    }
    const counts = [];
    if (data.levers?.length) counts.push(`${data.levers.length} levers`);
    if (data.projects?.length) counts.push(`${data.projects.length} projects`);
    if (data.reviews?.length) counts.push(`${data.reviews.length} reviews`);
    if (data.chat?.length) counts.push(`${data.chat.length} messages`);
    return { success: true, message: `Imported: ${counts.join(', ')}` };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Invalid JSON file' };
  }
}

// Review History
export function getReviews(): SavedReview[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REVIEWS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveReview(review: SavedReview): void {
  const reviews = getReviews();
  reviews.unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

// Chat History
export function getChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CHAT_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveChatMessages(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

export function clearChatMessages(): void {
  localStorage.removeItem(CHAT_KEY);
}

// Language
export function getLanguage(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem(LANG_KEY) as 'en' | 'es') || 'en';
}

export function setLanguage(lang: 'en' | 'es'): void {
  localStorage.setItem(LANG_KEY, lang);
}

// Projects & Tasks
export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}
