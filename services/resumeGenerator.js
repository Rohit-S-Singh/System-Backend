export const generateIndustryResume = (user) => {

  const skillsArray =
    user.studentDetails?.skills ||
    user.professionalDetails?.skills ||
    [];

  const categorizedSkills = {
    languages: skillsArray.filter(s => ["JavaScript", "Python", "Java"].includes(s)),
    frameworks: skillsArray.filter(s => ["React", "Node.js", "Express"].includes(s)),
    databases: skillsArray.filter(s => ["MongoDB", "MySQL"].includes(s)),
    tools: skillsArray.filter(s => ["Git", "Docker"].includes(s))
  };

  const isStudent = user.userType === "student";

  return {
    header: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      location: "",
      linkedin: user.professionalDetails?.linkedin || "",
      github: user.studentDetails?.github || ""
    },

    summary: isStudent
      ? `Computer Science student with hands-on experience in ${categorizedSkills.frameworks.slice(0,2).join(", ")}.`
      : `${user.professionalDetails?.jobTitle || "Professional"} with experience in ${categorizedSkills.frameworks.slice(0,2).join(", ")}.`,

    experience: isStudent ? [] : [{
      company: user.professionalDetails?.company || "",
      role: user.professionalDetails?.jobTitle || "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [
        "Worked on feature development and maintenance",
        "Collaborated with cross-functional teams"
      ]
    }],

    projects: isStudent ? [{
      title: "Academic / Personal Project",
      techStack: categorizedSkills.frameworks,
      bullets: [
        "Developed a web application using modern technologies",
        "Implemented authentication and REST APIs"
      ]
    }] : [],

    skills: categorizedSkills,

    education: [{
      degree: user.studentDetails?.degree || "",
      branch: user.studentDetails?.branch || "",
      college: user.studentDetails?.college || "",
      year: user.studentDetails?.graduationYear || ""
    }],

    certifications: []
  };
};
