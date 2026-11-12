// In-memory applications store
const applications = [
  {
    id: 1,
    jobId: "j1",
    studentName: "Duggineni Ramya",
    stage: 0,
    appliedAt: new Date().toISOString(),
    logs: [[0, "Applied"]]
  },
  {
    id: 2,
    jobId: "j2",
    studentName: "Jyothsna Kanugula",
    stage: 1,
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
    logs: [[0, "Applied"], [1, "Under Review"]]
  },
  {
    id: 3,
    jobId: "j3",
    studentName: "R. Kalyan",
    stage: 2,
    appliedAt: new Date(Date.now() - 172800000).toISOString(),
    logs: [[0, "Applied"], [1, "Under Review"], [2, "Interview Scheduled"]]
  }
];

const STAGES = ["Applied", "Under Review", "Interview Scheduled", "Selected", "Not Selected"];

exports.getApplications = (req, res) => {
  res.json(applications);
};

exports.applyToJob = (req, res) => {
  const { jobId, studentName } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: "Job ID is required." });
  }

  const newApp = {
    id: Date.now(),
    jobId,
    studentName: studentName || "Duggineni Ramya",
    stage: 0,
    appliedAt: new Date().toISOString(),
    logs: [[0, "Applied"]]
  };

  applications.push(newApp);
  res.status(201).json(newApp);
};

exports.updateStage = (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  const app = applications.find(a => a.id == id);
  if (!app) {
    return res.status(404).json({ error: "Application not found." });
  }

  const nextStage = parseInt(stage);
  if (nextStage < 0 || nextStage > 4) {
    return res.status(400).json({ error: "Invalid stage." });
  }

  app.stage = nextStage;
  app.logs.push([nextStage, STAGES[nextStage]]);
  res.json(app);
};

