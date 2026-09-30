import { supabaseService, isSupabaseConfigured } from "./supabase";

const PRO_APPLICATIONS_KEY = "cinemascope_pro_applications";

export const DEFAULT_PRO_APPLICATIONS = [
  {
    id: "pra-default-1",
    userId: "admin-1",
    status: "APPROVED",
    submittedAt: "2024-06-01T10:00:00.000Z",
    reviewedAt: "2024-06-02T12:00:00.000Z",
    reviewedBy: "CinemaScope Editorial Board",
    adminNote: "Verified film critic credential for The Hindu newspaper.",
    fullName: "Harshavardhan",
    country: "India",
    bio: "Passionate cinephile and dedicated film critic with deep roots in Indian regional and world cinema.",
    profession: "Film Critic",
    professionalTitle: "film critic",
    organization: "the Hindu",
    yearsExperience: "5-10 years",
    professionalBio: "Senior film critic writing in-depth reviews, cinema essays, and technical film analysis for The Hindu. Focused on direction craft, cinematography, screenwriting, and theatrical audio-visual presentation.",
    specializations: ["Film Criticism", "Direction", "Cinematography", "Screenwriting", "Regional Cinema"],
    criticismBackground: "Over 8 years of professional film criticism across print and digital media, analyzing visual storytelling, directorial style, screenplay structure, sound engineering, and technical theatrical standards.",
    publishedReviewsUrls: "https://www.thehindu.com/entertainment/movies/\nhttps://www.thehindu.com/reviews/cinema-analysis",
    portfolioUrl: "https://thehindu.com/authors/harshavardhan",
    linkedinUrl: "https://linkedin.com/in/harshavardhan-cinema",
    websiteUrl: "https://thehindu.com",
    socialLinks: "https://twitter.com/harshavardhan_film\nhttps://letterboxd.com/harshavardhan",
    viewingProofUrl: "https://thehindu.com/press-credentials/harsha",
    viewingProofNote: "Accredited press credentials for theatrical press screenings and national film festivals.",
  }
];

export function getApplications() {
  try {
    const raw = localStorage.getItem(PRO_APPLICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(PRO_APPLICATIONS_KEY, JSON.stringify(DEFAULT_PRO_APPLICATIONS));
      return DEFAULT_PRO_APPLICATIONS;
    }
    const apps = JSON.parse(raw);
    if (Array.isArray(apps)) {
      // If admin-1 is not in storage, ensure the default seed is included
      if (!apps.some(a => a.userId === "admin-1")) {
        return [...apps, ...DEFAULT_PRO_APPLICATIONS];
      }
      return apps;
    }
    return DEFAULT_PRO_APPLICATIONS;
  } catch (e) {
    return DEFAULT_PRO_APPLICATIONS;
  }
}

export function saveApplications(apps) {
  localStorage.setItem(PRO_APPLICATIONS_KEY, JSON.stringify(apps));
}

export async function syncProApplicationsFromCloud() {
  if (!isSupabaseConfigured()) return getApplications();
  try {
    const remoteApps = await supabaseService.getProApplicationsData();
    const localApps = getApplications();
    if (Array.isArray(remoteApps) && remoteApps.length > 0) {
      const remoteMap = new Map(remoteApps.map(a => [a.userId, a]));
      let hasLocalChanges = false;
      const merged = [...remoteApps];

      // Preserve local-only applications that might not be in cloud yet
      localApps.forEach(loc => {
        if (!remoteMap.has(loc.userId)) {
          merged.push(loc);
          hasLocalChanges = true;
        }
      });

      // Save merged to localStorage
      saveApplications(merged);

      if (hasLocalChanges) {
        supabaseService.saveProApplicationsData(merged).catch(console.warn);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cinemascope_pro_applications_updated', { detail: merged }));
      }
      return merged;
    } else if (localApps.length > 0) {
      // Cloud is empty, seed with local applications
      await supabaseService.saveProApplicationsData(localApps).catch(console.warn);
    }
    return localApps;
  } catch (e) {
    console.warn('syncProApplicationsFromCloud error:', e);
    return getApplications();
  }
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
  let resultingApp;
  if (existing >= 0) {
    resultingApp = { ...apps[existing], ...newApp, id: apps[existing].id };
    apps[existing] = resultingApp;
  } else {
    resultingApp = newApp;
    apps.push(resultingApp);
  }
  saveApplications(apps);

  // Sync to cloud immediately
  if (isSupabaseConfigured()) {
    supabaseService.appendProApplicationToCloud(resultingApp).catch(console.warn);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cinemascope_pro_applications_updated', { detail: apps }));
  }

  return resultingApp;
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

    // Sync to cloud immediately
    if (isSupabaseConfigured()) {
      supabaseService.saveProApplicationsData(apps).catch(console.warn);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinemascope_pro_applications_updated', { detail: apps }));
    }

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

    if (isSupabaseConfigured()) {
      supabaseService.saveProApplicationsData(apps).catch(console.warn);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinemascope_pro_applications_updated', { detail: apps }));
    }

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
