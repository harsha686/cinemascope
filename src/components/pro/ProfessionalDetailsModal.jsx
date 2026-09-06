import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  X,
  ExternalLink,
  Briefcase,
  Award,
  Globe,
  Link2,
  FileText,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Tv,
} from "lucide-react";
import ProfessionalRatingBadge from "../reviews/ProfessionalRatingBadge";

export default function ProfessionalDetailsModal({
  isOpen,
  onClose,
  application,
  reviewerName,
  userId,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !application) return null;

  const displayName = application.fullName || reviewerName || "Verified Reviewer";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Parse URLs helper
  const parseUrls = (text) => {
    if (!text) return [];
    return text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  };

  const publishedReviews = parseUrls(application.publishedReviewsUrls);
  const socialLinks = parseUrls(application.socialLinks);

  const handleNavigateProfile = () => {
    onClose();
    if (userId || application.userId) {
      navigate(`/reviewer/${userId || application.userId}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#121417",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.15)",
          borderRadius: 14,
          maxWidth: 680,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--text-primary)",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#10b981" }}>
              Verified Professional Credentials
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div
          style={{
            padding: "22px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Identity Card */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: 10,
              padding: "16px 18px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.1))",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontWeight: 800,
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {avatarLetter}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {displayName}
                </h3>
                <ProfessionalRatingBadge size="sm" />
              </div>

              {(application.professionalTitle || application.organization) && (
                <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 6 }}>
                  {[application.professionalTitle, application.organization].filter(Boolean).join(" · ")}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
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
            </div>
          </div>

          {/* Verification Assurance Banner */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 8,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(255, 255, 255, 0.85)",
            }}
          >
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: "#10b981" }}>Verified Industry Professional:</strong> The background details, published reviews, and cinema credentials displayed below were supplied during the professional verification process and authenticated by CinemaScope.
            </div>
          </div>

          {/* Bios & Statements */}
          {(application.bio || application.professionalBio) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {application.professionalBio && (
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={13} /> Professional Background &amp; Bio
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                    {application.professionalBio}
                  </p>
                </div>
              )}

              {application.bio && (
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>
                    Personal Statement
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                    {application.bio}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Film Criticism Background */}
          {application.criticismBackground && (
            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} /> Film Criticism Experience &amp; Analysis
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                {application.criticismBackground}
              </p>
            </div>
          )}

          {/* Specializations */}
          {application.specializations && application.specializations.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={13} color="#10b981" /> Areas of Specialization
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {application.specializations.map((spec) => (
                  <span
                    key={spec}
                    style={{
                      fontSize: 11,
                      padding: "4px 11px",
                      borderRadius: 14,
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#10b981",
                      fontWeight: 500,
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Published Reviews & Articles */}
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
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#60a5fa")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)")}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {url}
                    </span>
                    <ExternalLink size={13} style={{ flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Links & Portfolios */}
          {(application.portfolioUrl || application.linkedinUrl || socialLinks.length > 0) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={13} color="#10b981" /> Portfolio &amp; Professional Links
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {application.portfolioUrl && (
                  <a
                    href={application.portfolioUrl.startsWith("http") ? application.portfolioUrl : `https://${application.portfolioUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#10b981",
                      textDecoration: "none",
                    }}
                  >
                    <Globe size={13} /> Portfolio Website <ExternalLink size={11} />
                  </a>
                )}

                {application.linkedinUrl && (
                  <a
                    href={application.linkedinUrl.startsWith("http") ? application.linkedinUrl : `https://${application.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.25)",
                      color: "#60a5fa",
                      textDecoration: "none",
                    }}
                  >
                    <Link2 size={13} /> LinkedIn Profile <ExternalLink size={11} />
                  </a>
                )}

                {socialLinks.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.startsWith("http") ? s : `https://${s}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={12} /> {s.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Viewing Credentials / Screenings Proof */}
          {(application.viewingProofNote || application.viewingProofUrl) && (
            <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Tv size={13} /> Screening &amp; Press Access
              </div>
              {application.viewingProofNote && (
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0, marginBottom: application.viewingProofUrl ? 6 : 0 }}>
                  {application.viewingProofNote}
                </p>
              )}
              {application.viewingProofUrl && (
                <a
                  href={application.viewingProofUrl.startsWith("http") ? application.viewingProofUrl : `https://${application.viewingProofUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                >
                  View Press / Credential Verification <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.3)",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleNavigateProfile}
            className="btn btn-outline btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "rgba(16, 185, 129, 0.4)", color: "#10b981" }}
          >
            <ShieldCheck size={14} />
            View Full Reviewer Profile &amp; Reviews
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
