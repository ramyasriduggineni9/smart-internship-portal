// List of registered employers
const employers = [
  { name: "Nimbus Labs", isVerified: true, cin: "U72900TG2018PTC123456", gstin: "36AABCN1234F1Z5", website: "nimbuslabs.in" },
  { name: "Orbit Digital", isVerified: true, cin: "U72900TG2020PTC234567", gstin: "36AABCO2345F1Z2", website: "orbitdigital.io" },
  { name: "Veda AI", isVerified: true, cin: "U72900KA2021PTC345678", gstin: "29AABCV3456F1Z1", website: "vedaal.ai" },
  { name: "Stratus Cloud", isVerified: true, cin: "U72900TG2019PTC456789", gstin: "36AABCS4567F1Z8", website: "stratuscloud.com" },
  { name: "QuickHire Solutions", isVerified: false, cin: "INVALID_CIN", notes: "CIN not found in MCA registry. Posted unverified unpaid roles." }
];

exports.getEmployers = (req, res) => {
  res.json(employers);
};

exports.verifyEmployer = (req, res) => {
  const { name, cin, gstin, website, hrEmail } = req.body;

  if (!name || !cin || !gstin || !website || !hrEmail) {
    return res.status(400).json({ error: "All corporate registration fields are required." });
  }

  const cinRegex = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
  const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  const emailDomain = (hrEmail.split('@')[1] || "").toLowerCase();
  const isFreeDomain = /^(gmail|yahoo|outlook|hotmail|rediffmail)\./i.test(emailDomain);

  const cleanWebsite = website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  const domainMatchesWebsite = emailDomain.includes(cleanWebsite) || cleanWebsite.includes(emailDomain);

  const checks = [
    { check: "CIN format (21 chars MCA structure)", passed: cinRegex.test(cin) },
    { check: "GSTIN format (15 chars tax structure)", passed: gstinRegex.test(gstin) },
    { check: "Corporate domain email (not free mail provider)", passed: !isFreeDomain && emailDomain.length > 0 },
    { check: "HR email domain matches company website", passed: domainMatchesWebsite }
  ];

  const isVerified = checks.every(c => c.passed);

  const employerRecord = {
    name,
    cin,
    gstin,
    website,
    hrEmail,
    isVerified,
    checks,
    verifiedAt: isVerified ? new Date().toISOString() : null,
    notes: isVerified ? "Passed MCA and domain verification." : "Failed corporate verification criteria."
  };

  const existingIndex = employers.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    employers[existingIndex] = employerRecord;
  } else {
    employers.push(employerRecord);
  }

  res.json(employerRecord);
};
