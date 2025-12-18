export const parseResumeText = (text) => {
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );

  const skillsKeywords = [
    "JavaScript",
    "React",
    "Node",
    "MongoDB",
    "Python",
    "Java",
    "SQL",
    "Git",
  ];

  const detectedSkills = skillsKeywords.filter((skill) =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return {
    header: {
      name: "",
      email: emailMatch ? emailMatch[0] : "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },

    summary: "",

    experience: [],

    projects: [],

    skills: {
      languages: detectedSkills.filter((s) =>
        ["JavaScript", "Python", "Java"].includes(s)
      ),
      frameworks: detectedSkills.filter((s) =>
        ["React", "Node"].includes(s)
      ),
      databases: detectedSkills.filter((s) =>
        ["MongoDB", "SQL"].includes(s)
      ),
      tools: detectedSkills.filter((s) => ["Git"].includes(s)),
    },

    education: [],

    certifications: [],
  };
};
