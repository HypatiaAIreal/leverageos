'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { Lever, FulcrumStatus } from '@/lib/types';
import { getLevers, detectSequenceViolations } from '@/lib/store';
import Link from 'next/link';

const statusColors: Record<FulcrumStatus, string> = {
  verified: '#22c55e',
  assumed: '#f59e0b',
  at_risk: '#ef4444',
  absent: '#374151',
};

const fulcrumColors = {
  material: '#1D9E75',
  epistemic: '#378ADD',
  relational: '#D85A30',
};

type FilterType = 'all' | 'material' | 'epistemic' | 'relational';

export default function FulcrumMapPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [levers, setLevers] = useState<Lever[]>([]);
  const [selectedLever, setSelectedLever] = useState<Lever | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setLevers(getLevers());
  }, []);

  const drawMap = useCallback(() => {
    if (!svgRef.current || levers.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 40;

    const g = svg.append('g');

    // Three concentric rings
    const rings = [
      { label: 'Material', radius: maxRadius, color: fulcrumColors.material, type: 'material' as const },
      { label: 'Epistemic', radius: maxRadius * 0.66, color: fulcrumColors.epistemic, type: 'epistemic' as const },
      { label: 'Relational', radius: maxRadius * 0.33, color: fulcrumColors.relational, type: 'relational' as const },
    ];

    // Draw rings
    rings.forEach((ring) => {
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', ring.radius)
        .attr('fill', 'none')
        .attr('stroke', ring.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.15)
        .attr('stroke-dasharray', '4,4');

      g.append('text')
        .attr('x', cx + ring.radius + 8)
        .attr('y', cy - 4)
        .attr('fill', ring.color)
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('opacity', 0.5)
        .text(ring.label);
    });

    // Center dot
    g.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 3)
      .attr('fill', '#c4a35a')
      .attr('opacity', 0.5);

    // Position levers based on fulcrum health
    const filteredLevers = filter === 'all' ? levers : levers;

    filteredLevers.forEach((lever, i) => {
      // Determine which ring the lever sits in based on its weakest fulcrum
      const statusScore = (s: FulcrumStatus) =>
        s === 'verified' ? 3 : s === 'assumed' ? 2 : s === 'at_risk' ? 1 : 0;

      const matScore = statusScore(lever.fulcrums.material.status);
      const epiScore = statusScore(lever.fulcrums.epistemic.status);
      const relScore = statusScore(lever.fulcrums.relational.status);

      // Position: angle based on index, radius based on fulcrum health
      const angle = (i / filteredLevers.length) * Math.PI * 2 - Math.PI / 2;
      const overallHealth = (matScore + epiScore + relScore) / 9; // 0 to 1
      const r = maxRadius * (1 - overallHealth * 0.8) + 20; // healthier = closer to center

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      const hasViolations = detectSequenceViolations(lever).length > 0;
      const nodeSize = Math.max(8, Math.min(20, lever.effectiveLeverage / 50));

      // Determine primary color based on filter or weakest fulcrum
      let nodeColor = '#c4a35a';
      if (filter !== 'all') {
        nodeColor = fulcrumColors[filter];
      } else {
        const weakest = Math.min(matScore, epiScore, relScore);
        if (weakest === matScore && matScore < 3) nodeColor = fulcrumColors.material;
        else if (weakest === epiScore && epiScore < 3) nodeColor = fulcrumColors.epistemic;
        else if (weakest === relScore && relScore < 3) nodeColor = fulcrumColors.relational;
      }

      const nodeGroup = g.append('g').attr('class', 'lever-node').style('cursor', 'pointer');

      // Pulse animation for alerts
      if (hasViolations) {
        nodeGroup
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', nodeSize + 6)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0)
          .append('animate')
          .attr('attributeName', 'opacity')
          .attr('values', '0;0.6;0')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');

        nodeGroup
          .append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', nodeSize + 6)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1)
          .attr('opacity', 0)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', `${nodeSize + 4};${nodeSize + 14}`)
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }

      // Three small fulcrum indicators
      const indicatorRadius = nodeSize + 4;
      const fulcrumTypes = ['material', 'epistemic', 'relational'] as const;
      fulcrumTypes.forEach((ft, fi) => {
        const iAngle = angle + ((fi - 1) * 0.3);
        const ix = x + Math.cos(iAngle) * indicatorRadius;
        const iy = y + Math.sin(iAngle) * indicatorRadius;

        if (filter === 'all' || filter === ft) {
          nodeGroup
            .append('circle')
            .attr('cx', ix)
            .attr('cy', iy)
            .attr('r', 2.5)
            .attr('fill', statusColors[lever.fulcrums[ft].status])
            .attr('opacity', 0.8);
        }
      });

      // Main node
      nodeGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', nodeSize)
        .attr('fill', nodeColor)
        .attr('fill-opacity', 0.15)
        .attr('stroke', nodeColor)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6);

      // Score label
      nodeGroup
        .append('text')
        .attr('x', x)
        .attr('y', y + 3)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e8e4df')
        .attr('font-size', Math.max(8, nodeSize * 0.7) + 'px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', 'bold')
        .text(lever.effectiveLeverage);

      // Name label
      nodeGroup
        .append('text')
        .attr('x', x)
        .attr('y', y + nodeSize + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6a6570')
        .attr('font-size', '9px')
        .attr('font-family', 'DM Sans, sans-serif')
        .text(lever.name.length > 18 ? lever.name.slice(0, 16) + '...' : lever.name);

      // Click handler
      nodeGroup.on('click', () => {
        setSelectedLever(lever);
      });

      // Hover effects
      nodeGroup
        .on('mouseenter', function () {
          d3.select(this).select('circle:nth-child(' + (hasViolations ? '3' : '1') + ')')
            .transition()
            .duration(200);
          d3.select(this).selectAll('circle').attr('stroke-opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).selectAll('circle').attr('stroke-opacity', 0.6);
        });
    });
  }, [levers, filter]);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawMap]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Fulcrum Map</h1>
          <p className="text-muted text-sm mt-1">Your levers in fulcrum space — Ch. 7-9</p>
        </div>
        {/* Filter controls */}
        <div className="flex gap-2">
          {(['all', 'material', 'epistemic', 'relational'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
                filter === f
                  ? f === 'all'
                    ? 'border-accent text-accent bg-accent/10'
                    : `border-${f} text-${f} bg-white/5`
                  : 'border-white/10 text-muted hover:border-white/20'
              }`}
              style={
                filter === f && f !== 'all'
                  ? { borderColor: fulcrumColors[f], color: fulcrumColors[f] }
                  : {}
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {levers.length === 0 ? (
          <div className="bg-surface rounded-xl border border-white/5 p-6 text-center py-24">
            <p className="text-muted text-lg mb-2">No levers to map</p>
            <p className="text-muted/50 text-sm mb-4">Create levers in the Workshop or load sample data from the Dashboard.</p>
            <Link href="/dashboard" className="text-accent text-sm hover:underline">Go to Dashboard</Link>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-white/5 relative" style={{ height: '70vh' }}>
            <svg ref={svgRef} width="100%" height="100%" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-muted font-mono mb-2">FULCRUM STATUS</p>
              <div className="flex gap-3">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-muted capitalize">{status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted font-mono mt-2 mb-1">RINGS</p>
              <div className="flex gap-3">
                <span className="text-[10px]" style={{ color: fulcrumColors.material }}>Outer: Material</span>
                <span className="text-[10px]" style={{ color: fulcrumColors.epistemic }}>Middle: Epistemic</span>
                <span className="text-[10px]" style={{ color: fulcrumColors.relational }}>Inner: Relational</span>
              </div>
            </div>
          </div>
        )}

        {/* Detail panel */}
        <AnimatePresence>
          {selectedLever && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur-sm rounded-xl border border-white/10 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold">{selectedLever.name}</h3>
                  <p className="text-xs text-muted">{selectedLever.category}</p>
                </div>
                <button
                  onClick={() => setSelectedLever(null)}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-foreground/70 mb-4">{selectedLever.description}</p>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="text-center">
                  <span className="font-mono text-lg font-bold text-rigidity">{selectedLever.properties.r}</span>
                  <p className="text-[10px] text-muted">Rigidity</p>
                </div>
                <span className="text-muted">&times;</span>
                <div className="text-center">
                  <span className="font-mono text-lg font-bold text-length">{selectedLever.properties.l}</span>
                  <p className="text-[10px] text-muted">Length</p>
                </div>
                <span className="text-muted">&times;</span>
                <div className="text-center">
                  <span className="font-mono text-lg font-bold text-quality">{selectedLever.properties.q}</span>
                  <p className="text-[10px] text-muted">Quality</p>
                </div>
                <span className="text-muted">=</span>
                <div className="text-center">
                  <span className="font-mono text-2xl font-bold text-accent">{selectedLever.effectiveLeverage}</span>
                  <p className="text-[10px] text-muted">Score</p>
                </div>
              </div>

              {(['material', 'epistemic', 'relational'] as const).map((ft) => (
                <div key={ft} className="mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize" style={{ color: fulcrumColors[ft] }}>
                      {ft}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{
                        color: statusColors[selectedLever.fulcrums[ft].status],
                        backgroundColor: statusColors[selectedLever.fulcrums[ft].status] + '15',
                      }}
                    >
                      {selectedLever.fulcrums[ft].status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedLever.fulcrums[ft].evidence && (
                    <p className="text-[11px] text-foreground/50 mt-1">{selectedLever.fulcrums[ft].evidence}</p>
                  )}
                </div>
              ))}

              {detectSequenceViolations(selectedLever).length > 0 && (
                <div className="mt-3 p-2 bg-at-risk/5 border border-at-risk/20 rounded-lg">
                  <p className="text-[10px] text-at-risk font-mono">SEQUENCE VIOLATION</p>
                  {detectSequenceViolations(selectedLever).map((v, i) => (
                    <p key={i} className="text-[11px] text-foreground/60 mt-1">{v}</p>
                  ))}
                </div>
              )}

              <Link
                href={`/workshop?edit=${selectedLever.id}`}
                className="block mt-4 text-center text-sm text-accent hover:underline"
              >
                Edit in Workshop
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
