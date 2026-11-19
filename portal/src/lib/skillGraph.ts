export const SKILLS = ['Python','Django','Flask','Pandas','Data Analysis','Statistics',
  'Machine Learning','TensorFlow','REST APIs','Express','Node.js','JavaScript','React',
  'HTML/CSS','SQL','PostgreSQL','MongoDB','Java','Spring Boot','Docker','AWS','Git'] as const;

export type Skill = typeof SKILLS[number];

// Adjacency list of weighted undirected edges
const RAW_EDGES: [Skill, Skill, number][] = [
  ['Python','Django',.80],['Python','Flask',.80],['Python','Pandas',.75],
  ['Flask','REST APIs',.70],['Pandas','Data Analysis',.80],
  ['Data Analysis','Statistics',.70],['Machine Learning','TensorFlow',.75],
  ['Machine Learning','Statistics',.65],['Machine Learning','Python',.60],
  ['SQL','PostgreSQL',.85],['JavaScript','React',.80],['HTML/CSS','React',.60],
  ['Node.js','Express',.85],['Node.js','JavaScript',.75],['Node.js','REST APIs',.65],
  ['Java','Spring Boot',.80],['Docker','AWS',.60],
  ...SKILLS.map(s => ['Git', s, .30] as [Skill, Skill, number])
];

// Build adjacency map
const adj = new Map<string, [string, number][]>();
for (const [a, b, w] of RAW_EDGES) {
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  adj.get(a)!.push([b, w]);
  adj.get(b)!.push([a, w]);
}

// Best-path similarity between two skills (product of edge weights along best path)
export function similarity(from: string, to: string): number {
  if (from === to) return 1;
  const dist = new Map<string, number>();
  dist.set(from, 1);
  const pq: [number, string][] = [[1, from]];
  while (pq.length) {
    pq.sort((a, b) => b[0] - a[0]);
    const [score, node] = pq.shift()!;
    if (node === to) return score;
    if ((dist.get(node) ?? 0) > score) continue;
    for (const [nb, w] of (adj.get(node) ?? [])) {
      const ns = score * w;
      if (ns > (dist.get(nb) ?? 0)) {
        dist.set(nb, ns);
        pq.push([ns, nb]);
      }
    }
  }
  return 0;
}

export type ChipKind = 'exact' | 'related' | 'gap';
export interface SkillMatch { skill: string; score: number; from?: string; kind: ChipKind; }

export function matchScore(studentSkills: string[], requiredSkills: string[]): {
  score: number; matches: SkillMatch[];
} {
  const matches: SkillMatch[] = requiredSkills.map(req => {
    let best = 0, bestFrom = '';
    for (const ss of studentSkills) {
      const s = similarity(ss, req);
      if (s > best) { best = s; bestFrom = ss; }
    }
    const kind: ChipKind = best === 1 ? 'exact' : best >= 0.4 ? 'related' : 'gap';
    return { skill: req, score: best, from: bestFrom || undefined, kind };
  });
  const score = requiredSkills.length
    ? matches.reduce((s, m) => s + m.score, 0) / requiredSkills.length
    : 0;
  return { score, matches };
}
