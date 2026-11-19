export interface ATSResult {
  total: number;
  graphMatch: number;
  hasEmail: boolean;
  hasEducation: boolean;
  hasProjects: boolean;
  hasQuantified: boolean;
  gaps: string[];
}

export function calcATS(
  resumeText: string,
  requiredSkills: string[],
  studentSkills: string[],
  graphMatchScore: number
): ATSResult {
  const text = resumeText.toLowerCase();
  const hasEmail = /@/.test(text);
  const hasEducation = /b\.?tech|bachelor|university|college|cgpa|gpa|degree/.test(text);
  const hasProjects = /project|built|developed|created|implemented/.test(text);
  const hasQuantified = /\d+%|\d+ (users|clients|records|api|ms|seconds|hours|days|weeks|\$)/.test(text);
  const graphPart = Math.round(graphMatchScore * 70);
  const total =
    graphPart +
    (hasEmail ? 8 : 0) +
    (hasEducation ? 7 : 0) +
    (hasProjects ? 8 : 0) +
    (hasQuantified ? 7 : 0);
  const gaps = requiredSkills.filter(
    r => !studentSkills.some(s => s.toLowerCase() === r.toLowerCase())
  );
  return {
    total: Math.min(total, 100),
    graphMatch: graphPart,
    hasEmail,
    hasEducation,
    hasProjects,
    hasQuantified,
    gaps,
  };
}
