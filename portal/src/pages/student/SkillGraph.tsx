import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SKILLS, Skill, similarity } from '../../lib/skillGraph';

// 22 node coordinates arranged in an aesthetic circular/clustered layout
const NODE_COORDS: Record<string, { x: number; y: number; group: string }> = {
  // Web / Fullstack cluster
  'HTML/CSS': { x: 180, y: 140, group: 'frontend' },
  'JavaScript': { x: 260, y: 120, group: 'frontend' },
  'React': { x: 240, y: 220, group: 'frontend' },
  'Node.js': { x: 360, y: 150, group: 'backend' },
  'Express': { x: 440, y: 180, group: 'backend' },
  'REST APIs': { x: 380, y: 260, group: 'backend' },

  // Python / Data Science cluster
  'Python': { x: 520, y: 250, group: 'python' },
  'Django': { x: 620, y: 180, group: 'python' },
  'Flask': { x: 500, y: 150, group: 'python' },
  'Pandas': { x: 620, y: 290, group: 'data' },
  'Data Analysis': { x: 720, y: 280, group: 'data' },
  'Statistics': { x: 720, y: 380, group: 'data' },
  'Machine Learning': { x: 620, y: 400, group: 'ai' },
  'TensorFlow': { x: 720, y: 480, group: 'ai' },

  // Java / Enterprise cluster
  'Java': { x: 260, y: 360, group: 'java' },
  'Spring Boot': { x: 340, y: 420, group: 'java' },

  // Database cluster
  'SQL': { x: 420, y: 380, group: 'db' },
  'PostgreSQL': { x: 480, y: 460, group: 'db' },
  'MongoDB': { x: 340, y: 320, group: 'db' },

  // Cloud & DevOps cluster
  'Docker': { x: 180, y: 440, group: 'devops' },
  'AWS': { x: 140, y: 320, group: 'devops' },
  'Git': { x: 450, y: 80, group: 'tools' },
};

const EDGES: [string, string, number][] = [
  ['Python', 'Django', 0.80],
  ['Python', 'Flask', 0.80],
  ['Python', 'Pandas', 0.75],
  ['Flask', 'REST APIs', 0.70],
  ['Pandas', 'Data Analysis', 0.80],
  ['Data Analysis', 'Statistics', 0.70],
  ['Machine Learning', 'TensorFlow', 0.75],
  ['Machine Learning', 'Statistics', 0.65],
  ['Machine Learning', 'Python', 0.60],
  ['SQL', 'PostgreSQL', 0.85],
  ['JavaScript', 'React', 0.80],
  ['HTML/CSS', 'React', 0.60],
  ['Node.js', 'Express', 0.85],
  ['Node.js', 'JavaScript', 0.75],
  ['Node.js', 'REST APIs', 0.65],
  ['Java', 'Spring Boot', 0.80],
  ['Docker', 'AWS', 0.60],
  ['MongoDB', 'Node.js', 0.70],
  ['SQL', 'Django', 0.65],
  ['REST APIs', 'React', 0.65],
];

export default function StudentSkillGraph() {
  const { profile } = useAuth();
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    const { data: skRows } = await supabase
      .from('student_skills')
      .select('skill_name')
      .eq('student_id', profile!.id);
    setStudentSkills((skRows || []).map(r => r.skill_name));

    const { data: intRows } = await supabase
      .from('internships')
      .select('id, title, required_skills')
      .eq('status', 'open');
    setInternships(intRows || []);
  }

  const selectedJob = internships.find(i => i.id === selectedInternshipId);
  const targetRequiredSkills: string[] = selectedJob?.required_skills || [];

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Skill Graph Explorer</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Interactive 22-node network showing your current proficiencies and weighted paths to internship roles.
            </p>
          </div>

          {/* Internship overlay dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Compare with Role:</span>
            <select
              value={selectedInternshipId}
              onChange={e => setSelectedInternshipId(e.target.value)}
              style={{ maxWidth: 260 }}
            >
              <option value="">-- No Overlay (Overview) --</option>
              {internships.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: 'var(--good)' }} />
            <span>Your Skills ({studentSkills.length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: 'transparent', border: '3px solid var(--accent)' }} />
            <span>Target Role Requirements ({targetRequiredSkills.length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--line)' }} />
            <span>Available Network Nodes</span>
          </div>
          {selectedNode && (
            <div style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--accent)' }}>
              Selected: {selectedNode}
            </div>
          )}
        </div>

        {/* Graph SVG canvas */}
        <div className="card" style={{ padding: 10, overflowX: 'auto', background: 'var(--surface)' }}>
          <svg viewBox="0 0 860 560" style={{ width: '100%', minWidth: 600, height: 'auto', maxHeight: 560 }}>
            {/* Edges */}
            {EDGES.map(([u, v, w], idx) => {
              const from = NODE_COORDS[u];
              const to = NODE_COORDS[v];
              if (!from || !to) return null;
              const isRelevant = selectedNode === u || selectedNode === v;
              return (
                <g key={idx}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isRelevant ? 'var(--accent)' : 'var(--line)'}
                    strokeWidth={isRelevant ? 2.5 : 1 + w * 1.5}
                    strokeDasharray={w < 0.65 ? '4 4' : undefined}
                    opacity={isRelevant ? 1 : 0.65}
                  />
                  {isRelevant && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 4}
                      fill="var(--accent)"
                      fontSize="10"
                      fontFamily="var(--f-mono)"
                      textAnchor="middle"
                    >
                      {w}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {Object.entries(NODE_COORDS).map(([name, coords]) => {
              const isStudentSkill = studentSkills.includes(name);
              const isTargetRequired = targetRequiredSkills.includes(name);
              const isSelected = selectedNode === name;

              let fill = 'var(--surface)';
              let stroke = 'var(--line)';
              let textColor = 'var(--ink)';

              if (isStudentSkill) {
                fill = 'var(--good)';
                textColor = '#ffffff';
                stroke = 'var(--good)';
              } else if (isTargetRequired) {
                fill = 'var(--accent-soft)';
                stroke = 'var(--accent)';
                textColor = 'var(--accent)';
              }

              return (
                <g
                  key={name}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(name === selectedNode ? null : name)}
                >
                  {/* Target role outer ring indicator */}
                  {isTargetRequired && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Main node circle */}
                  <circle
                    r="20"
                    fill={fill}
                    stroke={isSelected ? 'var(--ink)' : stroke}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />

                  {/* Node label */}
                  <text
                    y="32"
                    textAnchor="middle"
                    fill="var(--ink)"
                    fontSize="11"
                    fontWeight={isStudentSkill || isTargetRequired ? 700 : 500}
                    fontFamily="var(--f-body)"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Box */}
        {selectedNode && (
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 16, marginBottom: 8 }}>
              Skill Proximity: <strong>{selectedNode}</strong>
            </h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
              {SKILLS.filter(s => s !== selectedNode).map(target => {
                const sim = similarity(selectedNode, target);
                if (sim < 0.4) return null;
                return (
                  <div key={target} style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg)',
                    border: '1px solid var(--line)'
                  }}>
                    <span>{target}: </span>
                    <strong className="mono" style={{ color: sim >= 0.75 ? 'var(--good)' : 'var(--accent)' }}>
                      {Math.round(sim * 100)}%
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
