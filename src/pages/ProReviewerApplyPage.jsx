import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { submitApplication, getUserApplication, SPECIALIZATIONS, PROFESSIONS } from "../services/proReviewerService";
import { ShieldCheck, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal Info",        desc: "Tell us about yourself" },
  { id: 2, title: "Professional Info",    desc: "Your professional background" },
  { id: 3, title: "Cinema Experience",    desc: "Your film criticism background" },
  { id: 4, title: "Supporting Links",     desc: "Portfolio and published work" },
  { id: 5, title: "Review & Submit",      desc: "Confirm and submit" },
];

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13,
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
  color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, color: "var(--text-muted)", marginBottom: 5, display: "block", fontWeight: 500 };
const fieldWrap = { display: "flex", flexDirection: "column", gap: 5 };

export default function ProReviewerApplyPage() {
  const navigate = useNavigate();
  const { state, dispatch, getUserApplication: getAppCtx } = useApp();
  const currentUser = state.currentUser;
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    fullName: currentUser?.displayName || "",
    country: "",
    bio: "",
    profession: "",
    professionalTitle: "",
    organization: "",
    yearsExperience: "",
    professionalBio: "",
    specializations: [],
    criticismBackground: "",
    publishedReviewsUrls: "",
    portfolioUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    socialLinks: "",
    viewingProofUrl: "",
    viewingProofNote: "",
  });

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    const app = getUserApplication(currentUser.id);
    if (app && app.status === "APPROVED") { navigate("/profile"); return; }
    if (app) setExistingApp(app);
  }, [currentUser]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleSpec = (s) => {
    set("specializations", form.specializations.includes(s)
      ? form.specializations.filter(x => x !== s)
      : [...form.specializations, s]);
  };

  const handleSubmit = () => {
    if (!agreed) { alert("Please agree to the declaration."); return; }
    const app = submitApplication(currentUser.id, form);
    dispatch({ type: "SUBMIT_PRO_APPLICATION", payload: app });
    setSubmitted(true);
  };

  if (!currentUser) return null;

  if (submitted) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#10b981" }}>
            <Check size={28} />
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--gold)", marginBottom: 10 }}>Application Submitted!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Your application for Verified Professional Reviewer status has been submitted. The admin will review it and update you via your profile page.
          </p>
          <button onClick={() => navigate("/profile")} className="btn btn-primary">Go to Profile</button>
        </div>
      </div>
    );
  }

  if (existingApp && existingApp.status !== "REJECTED" && existingApp.status !== "REVOKED") {
    const statusLabel = { SUBMITTED: "Under Review", UNDER_REVIEW: "Under Review", MORE_INFO_REQUIRED: "More Information Required" };
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <AlertCircle size={48} color="#fbbf24" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--text-primary)", marginBottom: 8 }}>Application Already Submitted</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            Current status: <strong style={{ color: "#fbbf24" }}>{statusLabel[existingApp.status] || existingApp.status}</strong>
          </p>
          {existingApp.adminNote && (
            <p style={{ color: "var(--text-primary)", fontSize: 12, background: "rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, textAlign: "left" }}>
              <strong>Admin note:</strong> {existingApp.adminNote}
            </p>
          )}
          <button onClick={() => navigate("/profile")} className="btn btn-primary">Back to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: "40px 24px 80px" }}>
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
            <ShieldCheck size={28} color="#10b981" />
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--text-primary)" }}>Apply to Become a Verified Professional Reviewer</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
            Share your expertise with the CinemaScope community. Your reviews will appear in the dedicated Professional Reviews section with a verified badge.
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32, overflowX: "auto", paddingBottom: 8 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: step > s.id ? "#10b981" : step === s.id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${step >= s.id ? "#10b981" : "var(--border)"}`,
                  color: step > s.id ? "#fff" : step === s.id ? "#10b981" : "var(--text-muted)",
                }}>
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <div style={{ fontSize: 10, color: step === s.id ? "#10b981" : "var(--text-muted)", marginTop: 4, whiteSpace: "nowrap", fontWeight: step === s.id ? 600 : 400 }}>
                  {s.title}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.id ? "#10b981" : "var(--border)", minWidth: 20, margin: "0 4px", marginBottom: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{STEPS[step-1].title}</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{STEPS[step-1].desc}</p>
          </div>

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your full name" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Country *</label>
                <input style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)} placeholder="e.g., India" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Short Bio (about yourself) *</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="A brief intro about yourself..." />
              </div>
            </div>
          )}

          {/* STEP 2: Professional Info */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Profession *</label>
                <select style={inputStyle} value={form.profession} onChange={e => set("profession", e.target.value)}>
                  <option value="">Select profession...</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Professional Title</label>
                <input style={inputStyle} value={form.professionalTitle} onChange={e => set("professionalTitle", e.target.value)} placeholder="e.g., Senior Film Critic" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Organization / Publication</label>
                <input style={inputStyle} value={form.organization} onChange={e => set("organization", e.target.value)} placeholder="e.g., The Hindu, Film Companion" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Years of Experience</label>
                <select style={inputStyle} value={form.yearsExperience} onChange={e => set("yearsExperience", e.target.value)}>
                  <option value="">Select...</option>
                  {["1-2 years","3-5 years","5-10 years","10+ years"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Professional Bio</label>
                <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.professionalBio} onChange={e => set("professionalBio", e.target.value)} placeholder="Describe your professional experience and background in film..." />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Specializations (select all that apply)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpec(s)} style={{
                      fontSize: 11, padding: "4px 12px", borderRadius: 16, cursor: "pointer",
                      background: form.specializations.includes(s) ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.specializations.includes(s) ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
                      color: form.specializations.includes(s) ? "#10b981" : "var(--text-muted)",
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Cinema Experience */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Film Criticism Background *</label>
                <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={form.criticismBackground} onChange={e => set("criticismBackground", e.target.value)} placeholder="Describe your experience with film criticism, analysis, and reviewing..." />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Published Reviews / Article URLs</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.publishedReviewsUrls} onChange={e => set("publishedReviewsUrls", e.target.value)} placeholder="Paste URLs to your published reviews, articles, or critiques (one per line)..." />
              </div>
            </div>
          )}

          {/* STEP 4: Supporting Links */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Portfolio / Personal Website URL</label>
                <input style={inputStyle} value={form.portfolioUrl} onChange={e => set("portfolioUrl", e.target.value)} placeholder="https://yourwebsite.com" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>LinkedIn Profile URL</label>
                <input style={inputStyle} value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/yourname" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Other Social / Professional Links</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.socialLinks} onChange={e => set("socialLinks", e.target.value)} placeholder="Twitter, Instagram, YouTube channel URL, etc. (one per line)" />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Proof of Screenings / Advance Access (optional)</label>
                <input style={inputStyle} value={form.viewingProofUrl} onChange={e => set("viewingProofUrl", e.target.value)} placeholder="URL to any press pass, invite, or credential" />
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginTop: 6 }} value={form.viewingProofNote} onChange={e => set("viewingProofNote", e.target.value)} placeholder="Any additional notes about your viewing credentials..." />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Name", form.fullName],
                  ["Country", form.country],
                  ["Profession", form.profession],
                  ["Title", form.professionalTitle],
                  ["Organization", form.organization],
                  ["Experience", form.yearsExperience],
                  ["Specializations", form.specializations.join(", ")],
                  ["Portfolio", form.portfolioUrl],
                  ["LinkedIn", form.linkedinUrl],
                ].map(([k, v]) => v ? (
                  <div key={k} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)", minWidth: 110 }}>{k}:</span>
                    <span style={{ color: "var(--text-primary)", wordBreak: "break-all" }}>{v}</span>
                  </div>
                ) : null)}
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                I confirm that all information I have provided is truthful and accurate. I understand that providing false information may result in rejection or revocation of my Verified Professional status.
              </label>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => step === 1 ? navigate("/profile") : setStep(s => s - 1)}
              className="btn btn-ghost btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <ChevronLeft size={14} /> {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < 5 ? (
              <button
                onClick={() => {
                  if (step === 1 && (!form.fullName || !form.country || !form.bio)) { alert("Please fill in all required fields."); return; }
                  if (step === 2 && !form.profession) { alert("Please select your profession."); return; }
                  if (step === 3 && !form.criticismBackground) { alert("Please describe your film criticism background."); return; }
                  setStep(s => s + 1);
                }}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#10b981" }}
              >
                <ShieldCheck size={14} /> Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
