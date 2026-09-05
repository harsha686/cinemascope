const PRO_APPLICATIONS_KEY = "cinemascope_pro_applications";

export function getApplications() {
  try {
    return JSON.parse(localStorage.getItem(PRO_APPLICATIONS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

export function saveApplications(apps) {
  localStorage.setItem(PRO_APPLICATIONS_KEY, JSON.stringify(apps));
}

export function getUserApplication(userId) {
  const apps = getApplications();
  return apps.find(a => a.userId === userId) || null;
}

export function isUserVerifiedPro(userId) {
  const app = getUserApplication(userId);
  return !!(app && app.status === "APPROVED");
}

export function submitApplication(userId, formData) {
  const apps = getApplications();
  const existing = apps.findIndex(a => a.userId === userId);
  const newApp = {
    id: "pra-" + Date.now(),
    userId,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: "",
    rejectionReason: "",
    fullName: formData.fullName || "",
    country: formData.country || "",
    bio: formData.bio || "",
    profession: formData.profession || "",
    professionalTitle: formData.professionalTitle || "",
    organization: formData.organization || "",
    yearsExperience: formData.yearsExperience || "",
    professionalBio: formData.professionalBio || "",
    specializations: formData.specializations || [],
    criticismBackground: formData.criticismBackground || "",
    publishedReviewsUrls: formData.publishedReviewsUrls || "",
    portfolioUrl: formData.portfolioUrl || "",
    linkedinUrl: formData.linkedinUrl || "",
    websiteUrl: formData.websiteUrl || "",
    socialLinks: formData.socialLinks || "",
    viewingProofUrl: formData.viewingProofUrl || "",
    viewingProofNote: formData.viewingProofNote || "",
  };
  if (existing >= 0) {
    apps[existing] = { ...apps[existing], ...newApp, id: apps[existing].id };
  } else {
    apps.push(newApp);
  }
  saveApplications(apps);
  return newApp;
}

export function updateApplicationStatus(appId, status, adminNote = "", rejectionReason = "", reviewedBy = "") {
  const apps = getApplications();
  const idx = apps.findIndex(a => a.id === appId);
  if (idx >= 0) {
    apps[idx] = {
      ...apps[idx],
      status,
      adminNote,
      rejectionReason,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    };
    saveApplications(apps);
    return apps[idx];
  }
  return null;
}

export function revokeVerification(userId, reason = "") {
  const apps = getApplications();
  const idx = apps.findIndex(a => a.userId === userId && a.status === "APPROVED");
  if (idx >= 0) {
    apps[idx] = {
      ...apps[idx],
      status: "REVOKED",
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    };
    saveApplications(apps);
    return apps[idx];
  }
  return null;
}

export const APPLICATION_STATUSES = {
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  MORE_INFO_REQUIRED: "MORE_INFO_REQUIRED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVOKED: "REVOKED",
};

export const SPECIALIZATIONS = [
  "Film Criticism","Film Journalism","Film Studies","Screenwriting",
  "Cinematography","Direction","Animation","Documentary",
  "Regional Cinema","International Cinema","Horror","Action",
  "Drama","Independent Cinema","World Cinema",
];

export const PROFESSIONS = [
  "Film Critic","Film Journalist","Director","Screenwriter",
  "Film Studies Academic","Media Professional","Entertainment Journalist",
  "Cinematographer","Film Producer","Other",
];
