const crypto = require('crypto');

const CHAIN = ["Faculty Mentor", "Head of Department (HOD)", "Placement Officer"];

let nocStatus = {
  isRequested: true,
  signatures: [
    {
      role: "Faculty Mentor",
      signee: "Dr. K. Srinivas (Mentor)",
      signedAt: "2026-11-08T10:30:00Z",
      hash: "e4f8a291bc7d"
    }
  ],
  isFullySigned: false
};

let academicCredits = {
  hoursLogged: 120,
  requiredHours: 160,
  evaluationScore: 88,
  grade: "A+",
  isPushedToGradebook: false
};

// NOC Endpoints
exports.getNocStatus = (req, res) => {
  res.json({
    ...nocStatus,
    nextRequiredSigner: CHAIN[nocStatus.signatures.length] || null
  });
};

exports.signNoc = (req, res) => {
  const { signee, role } = req.body;
  if (!signee || !role) {
    return res.status(400).json({ error: "Signee name and role are required." });
  }

  const expectedRole = CHAIN[nocStatus.signatures.length];
  if (!expectedRole) {
    return res.status(400).json({ error: "NOC has already been signed by all authorities." });
  }

  const timestamp = new Date().toISOString();
  const hash = crypto.createHash('sha256').update(signee + timestamp + role).digest('hex').substring(0, 12);

  nocStatus.signatures.push({
    role,
    signee,
    signedAt: timestamp,
    hash
  });

  if (nocStatus.signatures.length >= CHAIN.length) {
    nocStatus.isFullySigned = true;
  }

  res.json({
    message: `Signed successfully as ${role}`,
    nocStatus
  });
};

// Academic Credit & Gradebook Endpoints
exports.getCreditStatus = (req, res) => {
  res.json(academicCredits);
};

exports.logHours = (req, res) => {
  const { hours = 20 } = req.body;
  academicCredits.hoursLogged = Math.min(academicCredits.requiredHours, academicCredits.hoursLogged + parseInt(hours));
  res.json(academicCredits);
};

exports.pushToGradebook = (req, res) => {
  if (academicCredits.hoursLogged < academicCredits.requiredHours) {
    return res.status(400).json({ error: "Cannot push credits until required hours (160h) are completed." });
  }

  academicCredits.isPushedToGradebook = true;
  res.json({
    message: "Internship credits successfully synced with institutional gradebook.",
    academicCredits
  });
};
