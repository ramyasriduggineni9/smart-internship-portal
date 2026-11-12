const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const employerRoutes = require('./routes/employerRoutes');
const skillGraphRoutes = require('./routes/skillGraphRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/skills', skillGraphRoutes);

// Health Check & Root
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Smart Internship Portal API',
    institution: 'Matrusri Engineering College - CSE',
    team: 'Team D07',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Smart Internship Portal Backend API</h1><p>Visit <code>/api/health</code> for status.</p>');
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Internship Portal API Server running on port ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}`);
  console.log(`🎓 Team D07 - Matrusri Engineering College`);
  console.log(`=======================================================`);
});

module.exports = app;

