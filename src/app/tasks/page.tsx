'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Subtask, ProjectStatus, Lever } from '@/lib/types';
import { getLevers, getProjects, saveProject, deleteProject, generateId, getLanguage } from '@/lib/store';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

function generateStarterProjects(levers: Lever[]): Project[] {
  const starters: Project[] = [];
  const now = new Date().toISOString();

  levers.forEach((lever) => {
    // Find weakest fulcrum
    const fulcrumScores = {
      material: { verified: 3, assumed: 2, at_risk: 1, absent: 0 }[lever.fulcrums.material.status],
      epistemic: { verified: 3, assumed: 2, at_risk: 1, absent: 0 }[lever.fulcrums.epistemic.status],
      relational: { verified: 3, assumed: 2, at_risk: 1, absent: 0 }[lever.fulcrums.relational.status],
    };

    const weakest = Object.entries(fulcrumScores).sort(([,a], [,b]) => a - b)[0][0] as 'material' | 'epistemic' | 'relational';

    const subtaskSuggestions: Record<string, { name: string; notes: string }[]> = {
      material: [
        { name: 'Review financial runway for this lever', notes: 'Check bank statements, calculate monthly costs' },
        { name: 'Identify revenue/funding sources', notes: 'List all income streams that support this lever' },
        { name: 'Create 6-month sustainability plan', notes: 'What needs to be true financially for this to survive?' },
      ],
      epistemic: [
        { name: 'Gather external validation evidence', notes: 'Testimonials, reviews, metrics, third-party mentions' },
        { name: 'Publish or share proof of work', notes: 'Blog post, case study, portfolio piece, or demo' },
        { name: 'Request peer feedback or review', notes: 'Ask 2-3 people in the field for honest assessment' },
      ],
      relational: [
        { name: 'Identify key audience or stakeholders', notes: 'Who needs to know about and trust this lever?' },
        { name: 'Reach out to 3 potential advocates', notes: 'Email, DM, or meet people who can amplify this' },
        { name: 'Create a public-facing artifact', notes: 'Blog post, social thread, talk, or newsletter about this work' },
      ],
    };

    const subs = subtaskSuggestions[weakest].slice(0, 3).map((s) => ({
      id: generateId(),
      name: s.name,
      done: false,
      notes: s.notes,
      dueDate: null,
    }));

    const fulcrumLabel = weakest.charAt(0).toUpperCase() + weakest.slice(1);
    starters.push({
      id: generateId(),
      name: `Strengthen ${fulcrumLabel} Fulcrum`,
      description: `The ${fulcrumLabel} fulcrum for "${lever.name}" is the weakest (${lever.fulcrums[weakest].status}). Focus here first.`,
      leverId: lever.id,
      leverName: lever.name,
      dueDate: null,
      status: 'not_started',
      subtasks: subs,
      created: now,
    });
  });

  return starters;
}


const statusLabels: Record<ProjectStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
};
const statusColors: Record<ProjectStatus, string> = {
  not_started: 'text-muted border-white/10',
  in_progress: 'text-assumed border-assumed/30',
  done: 'text-verified border-verified/30',
};

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [levers, setLevers] = useState<Lever[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'due' | 'lever'>('due');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const stored = getProjects();
    const storedLevers = getLevers();
    setLevers(storedLevers);

    // Auto-generate starter projects if none exist and levers do
    if (stored.length === 0 && storedLevers.length > 0) {
      const starters = generateStarterProjects(storedLevers);
      starters.forEach((p) => saveProject(p));
      setProjects(getProjects());
    } else {
      setProjects(stored);
    }
  }, []);

  const refresh = () => {
    setProjects(getProjects());
    setLevers(getLevers());
  };

  const handleGenerateTasks = async () => {
    if (levers.length === 0 || generating) return;
    setGenerating(true);
    try {
      const lang = getLanguage();
      const res = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levers, existingProjects: projects, lang }),
      });
      if (!res.ok) throw new Error('Failed to generate tasks');
      const data = await res.json();
      if (data.projects && Array.isArray(data.projects)) {
        data.projects.forEach((p: { leverIndex: number; name: string; description: string; subtasks: { name: string; notes: string }[] }) => {
          const lever = levers[p.leverIndex];
          if (!lever) return;
          const project: Project = {
            id: generateId(),
            name: p.name,
            description: p.description || '',
            leverId: lever.id,
            leverName: lever.name,
            dueDate: null,
            status: 'not_started',
            subtasks: (p.subtasks || []).map((s: { name: string; notes: string }) => ({
              id: generateId(),
              name: s.name,
              done: false,
              notes: s.notes || '',
              dueDate: null,
            })),
            created: new Date().toISOString(),
          };
          saveProject(project);
        });
        refresh();
      }
    } catch {
      // silent fail
    } finally {
      setGenerating(false);
    }
  };

  const handleNewProject = () => {
    setEditing({
      id: generateId(),
      name: '',
      description: '',
      leverId: levers[0]?.id || '',
      leverName: levers[0]?.name || '',
      dueDate: null,
      status: 'not_started',
      subtasks: [],
      created: new Date().toISOString(),
    });
    setShowForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditing({ ...project, subtasks: project.subtasks.map((s) => ({ ...s })) });
    setShowForm(true);
  };

  const handleSaveProject = () => {
    if (!editing || !editing.name.trim()) return;
    const lever = levers.find((l) => l.id === editing.leverId);
    const project = { ...editing, leverName: lever?.name || editing.leverName };
    saveProject(project);
    setShowForm(false);
    setEditing(null);
    refresh();
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setShowForm(false);
    setEditing(null);
    refresh();
  };

  const handleAddSubtask = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      subtasks: [
        ...editing.subtasks,
        { id: generateId(), name: '', done: false, notes: '', dueDate: null },
      ],
    });
  };

  const handleUpdateSubtask = (idx: number, field: keyof Subtask, value: string | boolean) => {
    if (!editing) return;
    const subtasks = [...editing.subtasks];
    subtasks[idx] = { ...subtasks[idx], [field]: value };
    setEditing({ ...editing, subtasks });
  };

  const handleRemoveSubtask = (idx: number) => {
    if (!editing) return;
    const subtasks = editing.subtasks.filter((_, i) => i !== idx);
    setEditing({ ...editing, subtasks });
  };

  const toggleSubtaskDone = (projectId: string, subtaskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const updated = {
      ...project,
      subtasks: project.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      ),
    };
    const allDone = updated.subtasks.length > 0 && updated.subtasks.every((s) => s.done);
    if (allDone) updated.status = 'done';
    else if (updated.subtasks.some((s) => s.done)) updated.status = 'in_progress';
    saveProject(updated);
    refresh();
  };

  const projectProgress = (project: Project) => {
    if (project.subtasks.length === 0) return 0;
    return Math.round((project.subtasks.filter((s) => s.done).length / project.subtasks.length) * 100);
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'lever') return a.leverName.localeCompare(b.leverName);
    const aDate = a.dueDate || '9999';
    const bDate = b.dueDate || '9999';
    return aDate.localeCompare(bDate);
  });

  // Group by lever
  const grouped = sortBy === 'lever'
    ? sortedProjects.reduce<Record<string, Project[]>>((acc, p) => {
        const key = p.leverName || 'Unlinked';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
      }, {})
    : null;

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Tasks &amp; Projects</h1>
            <p className="text-muted text-sm mt-1">Track work linked to your levers</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setSortBy('due')}
                className={`px-3 py-1.5 rounded-l-lg transition-colors ${sortBy === 'due' ? 'bg-accent/20 text-accent' : 'text-muted'}`}
              >
                By Date
              </button>
              <button
                onClick={() => setSortBy('lever')}
                className={`px-3 py-1.5 rounded-r-lg transition-colors ${sortBy === 'lever' ? 'bg-accent/20 text-accent' : 'text-muted'}`}
              >
                By Lever
              </button>
            </div>
            <motion.button
              onClick={handleGenerateTasks}
              disabled={levers.length === 0 || generating}
              className="px-3 py-2 bg-white/5 text-muted border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-foreground transition-colors disabled:opacity-30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {generating ? 'Generating...' : 'AI Generate Tasks'}
            </motion.button>
            <motion.button
              onClick={handleNewProject}
              disabled={levers.length === 0}
              className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + New Project
            </motion.button>
          </div>
        </div>

        {levers.length === 0 && (
          <div className="text-center py-12 text-muted bg-surface rounded-xl border border-white/5">
            <p className="text-lg mb-2">No levers yet</p>
            <p className="text-sm">Create levers in the <Link href="/workshop" className="text-accent hover:underline">Workshop</Link> first, then link projects to them.</p>
          </div>
        )}

        {projects.length === 0 && levers.length > 0 && !showForm && (
          <div className="text-center py-12 text-muted bg-surface rounded-xl border border-white/5">
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm">Create a project to start tracking tasks for your levers.</p>
          </div>
        )}

        {/* Project Form Modal */}
        <AnimatePresence>
          {showForm && editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => { setShowForm(false); setEditing(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface border border-white/10 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
                  {projects.find((p) => p.id === editing.id) ? 'Edit Project' : 'New Project'}
                </h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Project name..."
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full bg-transparent text-foreground placeholder:text-muted/30 outline-none border-b border-white/10 pb-2 text-sm"
                  />
                  <textarea
                    placeholder="Description..."
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3 text-sm text-foreground/80 placeholder:text-muted/30 outline-none resize-none h-16"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted block mb-1">Linked Lever</label>
                      <select
                        value={editing.leverId}
                        onChange={(e) => {
                          const lever = levers.find((l) => l.id === e.target.value);
                          setEditing({ ...editing, leverId: e.target.value, leverName: lever?.name || '' });
                        }}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none"
                      >
                        {levers.map((l) => (
                          <option key={l.id} value={l.id} className="bg-surface">{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={editing.dueDate || ''}
                        onChange={(e) => setEditing({ ...editing, dueDate: e.target.value || null })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted block mb-1">Status</label>
                    <div className="flex gap-2">
                      {(['not_started', 'in_progress', 'done'] as ProjectStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setEditing({ ...editing, status: s })}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            editing.status === s ? statusColors[s] + ' bg-white/5' : 'border-white/10 text-muted'
                          }`}
                        >
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted">Subtasks</label>
                      <button onClick={handleAddSubtask} className="text-accent text-xs hover:underline">+ Add</button>
                    </div>
                    <div className="space-y-2">
                      {editing.subtasks.map((sub, i) => (
                        <div key={sub.id} className="bg-white/[0.02] rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Subtask name..."
                              value={sub.name}
                              onChange={(e) => handleUpdateSubtask(i, 'name', e.target.value)}
                              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/30 outline-none"
                            />
                            <input
                              type="date"
                              value={sub.dueDate || ''}
                              onChange={(e) => handleUpdateSubtask(i, 'dueDate', e.target.value || '')}
                              className="bg-transparent border border-white/10 rounded px-2 py-1 text-[10px] text-muted outline-none w-28"
                            />
                            <button onClick={() => handleRemoveSubtask(i)} className="text-at-risk/50 hover:text-at-risk text-xs">
                              &times;
                            </button>
                          </div>
                          <textarea
                            placeholder="Notes..."
                            value={sub.notes}
                            onChange={(e) => handleUpdateSubtask(i, 'notes', e.target.value)}
                            className="w-full bg-transparent text-[11px] text-muted placeholder:text-muted/20 outline-none resize-none h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <motion.button
                    onClick={handleSaveProject}
                    disabled={!editing.name.trim()}
                    className="px-4 py-2 bg-accent text-background font-medium rounded-lg text-sm disabled:opacity-30 hover:bg-accent/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save Project
                  </motion.button>
                  {projects.find((p) => p.id === editing.id) && (
                    <button
                      onClick={() => handleDeleteProject(editing.id)}
                      className="text-at-risk/70 hover:text-at-risk text-sm"
                    >
                      Delete
                    </button>
                  )}
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-muted text-sm ml-auto">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project List */}
        {grouped ? (
          // Grouped by lever
          Object.entries(grouped).map(([leverName, group]) => (
            <div key={leverName}>
              <h3 className="font-heading text-sm font-semibold text-accent mb-3 uppercase tracking-wider">{leverName}</h3>
              <div className="space-y-3">
                {group.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    expanded={expandedId === project.id}
                    onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
                    onEdit={() => handleEditProject(project)}
                    onToggleSubtask={(subtaskId) => toggleSubtaskDone(project.id, subtaskId)}
                    progress={projectProgress(project)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Sorted list
          <div className="space-y-3">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                expanded={expandedId === project.id}
                onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
                onEdit={() => handleEditProject(project)}
                onToggleSubtask={(subtaskId) => toggleSubtaskDone(project.id, subtaskId)}
                progress={projectProgress(project)}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function ProjectCard({
  project,
  expanded,
  onToggle,
  onEdit,
  onToggleSubtask,
  progress,
}: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  progress: number;
}) {
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'done';
  const hasOverdueSubs = project.subtasks.some(
    (s) => !s.done && s.dueDate && new Date(s.dueDate) < new Date()
  );

  return (
    <motion.div
      className={`bg-surface rounded-xl border overflow-hidden ${
        isOverdue || hasOverdueSubs ? 'border-at-risk/30' : 'border-white/5'
      }`}
    >
      <button onClick={onToggle} className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
            <span className="text-sm font-medium text-foreground">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {project.dueDate && (
              <span className={`text-[10px] font-mono ${isOverdue ? 'text-at-risk' : 'text-muted/50'}`}>
                {isOverdue ? 'OVERDUE ' : ''}Due {project.dueDate}
              </span>
            )}
            <svg className={`w-4 h-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/workshop?edit=${project.leverId}`} onClick={(e) => e.stopPropagation()} className="text-xs text-accent/60 hover:text-accent">
            {project.leverName}
          </Link>
          {project.subtasks.length > 0 && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${progress === 100 ? 'bg-verified' : 'bg-accent'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted">{progress}%</span>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-4 space-y-3">
              {project.description && (
                <p className="text-xs text-muted">{project.description}</p>
              )}

              {project.subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {project.subtasks.map((sub) => {
                    const subOverdue = !sub.done && sub.dueDate && new Date(sub.dueDate) < new Date();
                    return (
                      <div
                        key={sub.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg ${subOverdue ? 'bg-at-risk/5' : 'bg-white/[0.02]'}`}
                      >
                        <button
                          onClick={() => onToggleSubtask(sub.id)}
                          className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                            sub.done ? 'bg-verified border-verified' : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          {sub.done && (
                            <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${sub.done ? 'text-muted line-through' : 'text-foreground/80'}`}>{sub.name}</p>
                          {sub.notes && <p className="text-[10px] text-muted/60 mt-0.5">{sub.notes}</p>}
                        </div>
                        {sub.dueDate && (
                          <span className={`text-[10px] font-mono shrink-0 ${subOverdue ? 'text-at-risk' : 'text-muted/40'}`}>
                            {sub.dueDate}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={onEdit}
                className="text-accent text-xs hover:underline"
              >
                Edit Project
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
