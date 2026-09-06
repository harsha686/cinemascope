import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { getUserApplication } from "../services/proReviewerService";
import ProfessionalRatingBadge from "../components/reviews/ProfessionalRatingBadge";
import ProfessionalReviewCard from "../components/reviews/ProfessionalReviewCard";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Briefcase,
  Calendar,
  MapPin,
  Award,
  FileText,
  Layers,
  Globe,
  Link2,
  ExternalLink,
  Tv,
  CheckCircle2,
} from "lucide-react";

export default function ProReviewerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, getUserApplication: getAppCtx, isVerifiedPro } = useApp();

  const application = useMemo(() => {
    return (getAppCtx ? getAppCtx(userId) : null) || getUserApplication(userId);
  }, [userId, state.professionalApplications, getAppCtx]);

  const user = useMemo(() => state.users.find(u => u.id === userId), [state.users, userId]);

  const proReviews = useMemo(() => {
    return state.reviews.filter(r =>
      r.userId === userId &&
      r.status === "PUBLISHED" &&
      (r.reviewType === "PROFESSIONAL" || (isVerifiedPro && isVerifiedPro(userId) && r.reviewType !== "USER"))
    );
  }, [state.reviews, userId, isVerifiedPro]);

  const avgRating = useMemo(() => {
    if (!proReviews.length) return 0;
    const sum = proReviews.reduce((a, r) => a + (r.rating || 0), 0);
    return Math.round((sum / proReviews.length) * 10) / 10;
  }, [proReviews]);

  const getMovieTitle = (review) => {
    if (!review.movieId) return "Unknown Movie";
    const m = state.movies.find(m => m.id === review.movieId || m.id === review.movieId?.replace("tmdb-", ""));
    return m ? m.title : review.movieId;
  };

  const parseUrls = (text) => {
    if (!text) return [];
    return text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  };

  const publishedReviews = application ? parseUrls(application.publishedReviewsUrls) : [];
  const socialLinks = application ? parseUrls(application.socialLinks) : [];

  if (!application || application.status !== "APPROVED") {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "var(--text-primary)", marginBottom: 8 }}>Reviewer Not Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>This profile does not exist or is not a verified reviewer.</p>
          <button onClick={() => navigate(-1)} className="btn btn-ghost">Go Back</button>
        </div>
      </div>
    );
  }

  const displayName = application.fullName || user?.displayName || "Professional Reviewer";

  return (
    <div className="page-enter" style={{ padding: "40px 24px 80px" }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 28, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Profile hero */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(5,150,105,0.02))",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 12, padding: 28, marginBottom: 28,
          display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap",
        }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.12))",
            border: "2px solid #10b981",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#10b981", fontWeight: 800, fontSize: 32,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", margin: 0 }}>
                {displayName}
              </h1>
              <ProfessionalRatingBadge size="md" />
            </div>

            {(application.professionalTitle || application.organization) && (
              <div style={{ fontSize: 14, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>
                {[application.professionalTitle, application.organization].filter(Boolean).join(" · ")}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              {application.profession && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Briefcase size={13} color="#10b981" /> {application.profession}
                </span>
              )}
              {application.yearsExperience && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={13} color="#10b981" /> {application.yearsExperience} experience
                </span>
              )}
              {application.country && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={13} color="#10b981" /> {application.country}
                </span>
              )}
            </div>

            {application.bio && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                {application.bio}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", flexShrink: 0, background: "rgba(0,0,0,0.25)", padding: "12px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{proReviews.length}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pro Reviews</div>
            </div>
            {avgRating > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={16} fill="#10b981" color="#10b981" />{avgRating}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Avg Rating</div>
              </div>
            )}
          </div>
        </div>

        {/* Verified Application Data & Credentials Details */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 24,
          marginBottom: 36,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} color="#10b981" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Verified Professional Details &amp; Credentials
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", background: "rgba(16, 185, 129, 0.08)", padding: "4px 10px", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <CheckCircle2 size={13} /> Verified by CinemaScope
            </div>
          </div>

          {/* Professional Bio */}
          {application.professionalBio && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={13} /> Professional Background &amp; Bio
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                {application.professionalBio}
              </p>
            </div>
          )}

          {/* Criticism Background */}
          {application.criticismBackground && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} /> Film Criticism Background &amp; Analysis Experience
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                {application.criticismBackground}
              </p>
            </div>
          )}

          {/* Specializations */}
          {application.specializations?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={13} color="#10b981" /> Areas of Specialization
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {application.specializations.map(s => (
                  <span key={s} style={{
                    fontSize: 11, padding: "3px 11px", borderRadius: 12,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                    color: "#10b981", fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Published Reviews */}
          {publishedReviews.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} color="#10b981" /> Published Reviews &amp; Articles
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {publishedReviews.map((url, idx) => (
                  <a
                    key={idx}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 12,
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 6,
                      color: "#60a5fa",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                    <ExternalLink size={13} style={{ flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(application.portfolioUrl || application.linkedinUrl || socialLinks.length > 0) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={13} color="#10b981" /> Portfolio &amp; Professional Links
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {application.portfolioUrl && (
                  <a href={application.portfolioUrl.startsWith("http") ? application.portfolioUrl : `https://${application.portfolioUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "5px 12px", borderRadius: 6, textDecoration: "none" }}>
                    <Globe size={13} /> Portfolio <ExternalLink size={11} />
                  </a>
                )}
                {application.linkedinUrl && (
                  <a href={application.linkedinUrl.startsWith("http") ? application.linkedinUrl : `https://${application.linkedinUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#60a5fa", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "5px 12px", borderRadius: 6, textDecoration: "none" }}>
                    <Link2 size={13} /> LinkedIn <ExternalLink size={11} />
                  </a>
                )}
                {socialLinks.map((s, idx) => (
                  <a key={idx} href={s.startsWith("http") ? s : `https://${s}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "5px 12px", borderRadius: 6, textDecoration: "none" }}>
                    <ExternalLink size={12} /> {s.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Press / Screening Proof */}
          {(application.viewingProofNote || application.viewingProofUrl) && (
            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Tv size={13} /> Screening &amp; Press Credentials
              </div>
              {application.viewingProofNote && (
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0, marginBottom: application.viewingProofUrl ? 6 : 0 }}>
                  {application.viewingProofNote}
                </p>
              )}
              {application.viewingProofUrl && (
                <a href={application.viewingProofUrl.startsWith("http") ? application.viewingProofUrl : `https://${application.viewingProofUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                  View Press / Credential Verification <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Reviews */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#10b981" }}>🎬</span> Professional Reviews
        </h2>

        {proReviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", fontSize: 13 }}>
            No professional reviews yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {proReviews.map(r => (
              <div key={r.id}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  Re: <span style={{ color: "var(--text-secondary)" }}>{getMovieTitle(r)}</span>
                </div>
                <ProfessionalReviewCard review={r} onDelete={(id) => dispatch({ type: "DELETE_REVIEW", payload: id })} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
