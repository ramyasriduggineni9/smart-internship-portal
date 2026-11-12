const { calculateSkillMatch } = require('./skillGraphController');

// In-memory data store with default internships
const internships = [
  {
    id: "j1",
    title: "Backend Engineer Intern",
    company: "Nimbus Labs",
    requiredSkills: ["Django", "REST APIs", "SQL", "Git"],
    minCgpa: 7.0,
    prerequisites: ["DBMS"],
    location: "Hyderabad · Hybrid",
    stipend: "₹20,000/mo"
  },
  {
    id: "j2",
    title: "Data Analyst Intern",
    company: "Nimbus Labs",
    requiredSkills: ["Pandas", "Data Analysis", "SQL", "Statistics"],
    minCgpa: 7.5,
    prerequisites: ["DBMS", "Python Programming"],
    location: "Hyderabad · On-site",
    stipend: "₹18,000/mo"
  },
  {
    id: "j3",
    title: "Full-Stack Web Intern",
    company: "Orbit Digital",
    requiredSkills: ["React", "Node.js", "SQL", "HTML/CSS"],
    minCgpa: 7.0,
    prerequisites: ["Web Technologies"],
    location: "Remote",
    stipend: "₹15,000/mo"
  },
  {
    id: "j4",
    title: "Machine Learning Intern",
    company: "Veda AI",
    requiredSkills: ["Machine Learning", "Python", "TensorFlow", "Statistics"],
    minCgpa: 8.5,
    prerequisites: ["Machine Learning Fundamentals"],
    location: "Bengaluru · Hybrid",
    stipend: "₹30,000/mo"
  }
];

// Get all internships with personalized recommendations for a student profile
exports.getAllInternships = (req, res) => {
  const { cgpa, skills, completedCourses } = req.query;

  const candidateSkills = skills ? skills.split(',') : [];
  const candidateCourses = completedCourses ? completedCourses.split(',') : [];
  const candidateCgpa = cgpa ? parseFloat(cgpa) : 0;

  const feed = internships.map(job => {
    const match = calculateSkillMatch(candidateSkills, job.requiredSkills);
    
    // Automated Eligibility Screener checks
    const cgpaEligible = candidateCgpa >= job.minCgpa;
    const missingCourses = job.prerequisites.filter(c => !candidateCourses.includes(c));
    const coursesEligible = missingCourses.length === 0;
    const isEligible = cgpaEligible && coursesEligible;

    return {
      ...job,
      matchScore: match.score,
      exactMatches: match.exactMatches,
      relatedMatches: match.relatedMatches,
      skillGaps: match.gaps,
      eligibility: {
        isEligible,
        cgpaEligible,
        coursesEligible,
        missingCourses
      }
    };
  });

  // Sort by highest semantic match score
  feed.sort((a, b) => b.matchScore - a.matchScore);

  res.json(feed);
};

// Post a new internship (Employer action)
exports.createInternship = (req, res) => {
  const { title, company, requiredSkills, minCgpa, prerequisites, location, stipend } = req.body;
  if (!title || !requiredSkills || requiredSkills.length < 2) {
    return res.status(400).json({ error: "Title and at least 2 required skills are required." });
  }

  const newJob = {
    id: "j" + (internships.length + 1),
    title,
    company: company || "Nimbus Labs",
    requiredSkills,
    minCgpa: parseFloat(minCgpa) || 6.5,
    prerequisites: prerequisites || [],
    location: location || "Hyderabad · Hybrid",
    stipend: stipend || "₹15,000/mo"
  };

  internships.push(newJob);
  res.status(201).json(newJob);
};

