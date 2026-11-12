const { supabase } = require('../config/db');

// In-memory student profile fallback
let currentStudentProfile = {
  name: "Duggineni Ramya",
  email: "ramya.d@student.matrusri.edu.in",
  college: "Matrusri Engineering College",
  department: "CSE",
  graduationYear: 2027,
  cgpa: 8.2,
  skills: ["Python", "SQL", "HTML/CSS", "Git", "Flask"],
  completedCourses: ["DBMS", "Operating Systems", "Data Structures", "Web Technologies", "Python Programming"],
  resume: `DUGGINENI RAMYA\nramya.d@student.matrusri.edu.in | Hyderabad\n\nEDUCATION\nB.E. Computer Science and Engineering, Matrusri Engineering College, CGPA 8.2\n\nPROJECTS\nCampus Notice Board: Flask web app with SQL storage, used by 340 students.\nExpense Tracker: Python CLI, Git versioned, 120 commits.\n\nSKILLS\nPython, Flask, SQL, HTML, CSS, Git`
};

exports.getProfile = async (req, res) => {
  res.json(currentStudentProfile);
};

exports.updateProfile = async (req, res) => {
  const { name, college, department, graduationYear, skills, cgpa } = req.body;

  if (name) currentStudentProfile.name = name;
  if (college) currentStudentProfile.college = college;
  if (department) currentStudentProfile.department = department;
  if (graduationYear) currentStudentProfile.graduationYear = parseInt(graduationYear);
  if (skills && Array.isArray(skills)) currentStudentProfile.skills = skills;
  if (cgpa) currentStudentProfile.cgpa = parseFloat(cgpa);

  res.json({
    message: "Profile updated successfully",
    profile: currentStudentProfile
  });
};
