/**
 * Skill-Graph Matching Engine Controller
 * Based on Base Paper: "Skill-Based Recommender System for Internship and Industry Hiring using Knowledge Graphs"
 * IEEE ICMNWC 2025 (DOI: 10.1109/ICMNWC66779.2025.11354307)
 */

const SKILLS = [
  "Python", "Django", "Flask", "Pandas", "Data Analysis", "Statistics",
  "Machine Learning", "TensorFlow", "REST APIs", "Express", "Node.js",
  "JavaScript", "React", "HTML/CSS", "SQL", "PostgreSQL", "MongoDB",
  "Java", "Spring Boot", "Docker", "AWS", "Git"
];

const EDGES = [
  ["Python", "Django", 0.8], ["Python", "Flask", 0.8], ["Python", "Pandas", 0.7],
  ["Pandas", "Data Analysis", 0.8], ["Data Analysis", "Statistics", 0.7],
  ["Machine Learning", "Python", 0.7], ["Machine Learning", "TensorFlow", 0.8],
  ["Machine Learning", "Statistics", 0.6], ["JavaScript", "React", 0.8],
  ["JavaScript", "Node.js", 0.8], ["Node.js", "Express", 0.85],
  ["Express", "REST APIs", 0.7], ["Django", "REST APIs", 0.7],
  ["Flask", "REST APIs", 0.7], ["SQL", "PostgreSQL", 0.85],
  ["SQL", "MongoDB", 0.5], ["PostgreSQL", "MongoDB", 0.5],
  ["HTML/CSS", "React", 0.6], ["HTML/CSS", "JavaScript", 0.6],
  ["Docker", "AWS", 0.6], ["Git", "Docker", 0.4],
  ["Java", "Spring Boot", 0.8], ["Spring Boot", "REST APIs", 0.7],
  ["Node.js", "Python", 0.4], ["Python", "JavaScript", 0.3]
];

// Graph Transitive Closure Matrix
const GraphMatrix = {};
SKILLS.forEach(a => {
  GraphMatrix[a] = {};
  SKILLS.forEach(b => {
    GraphMatrix[a][b] = (a === b) ? 1.0 : 0.0;
  });
});

EDGES.forEach(([u, v, weight]) => {
  GraphMatrix[u][v] = weight;
  GraphMatrix[v][u] = weight;
});

// Semantic path propagation (Transitive closure)
SKILLS.forEach(k => {
  SKILLS.forEach(i => {
    SKILLS.forEach(j => {
      const pathWeight = GraphMatrix[i][k] * GraphMatrix[k][j];
      if (pathWeight > GraphMatrix[i][j]) {
        GraphMatrix[i][j] = pathWeight;
      }
    });
  });
});

/**
 * Calculates semantic score between candidate skills and role required skills
 */
function calculateSkillMatch(candidateSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, exactMatches: [], relatedMatches: [], gaps: [] };
  }

  const exactMatches = [];
  const relatedMatches = [];
  const gaps = [];
  let totalScore = 0;

  requiredSkills.forEach(req => {
    if (candidateSkills.includes(req)) {
      exactMatches.push(req);
      totalScore += 1.0;
    } else {
      let maxRelated = 0;
      let bestVia = null;

      candidateSkills.forEach(cand => {
        const weight = (GraphMatrix[cand] && GraphMatrix[cand][req]) || 0;
        if (weight > maxRelated) {
          maxRelated = weight;
          bestVia = cand;
        }
      });

      if (maxRelated >= 0.5) {
        relatedMatches.push({
          required: req,
          via: bestVia,
          affinity: Math.round(maxRelated * 100)
        });
        totalScore += maxRelated;
      } else {
        gaps.push(req);
      }
    }
  });

  const finalScore = Math.round((totalScore / requiredSkills.length) * 100);

  return {
    score: finalScore,
    exactMatches,
    relatedMatches,
    gaps
  };
}

// Controller Endpoints
exports.getSkillGraph = (req, res) => {
  res.json({
    nodes: SKILLS,
    edges: EDGES.map(([source, target, weight]) => ({ source, target, weight }))
  });
};

exports.matchSkills = (req, res) => {
  const { candidateSkills = [], requiredSkills = [] } = req.body;
  const result = calculateSkillMatch(candidateSkills, requiredSkills);
  res.json(result);
};

exports.calculateSkillMatch = calculateSkillMatch;

