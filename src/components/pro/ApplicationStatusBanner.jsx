import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, AlertCircle, XCircle, RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
  SUBMITTED: {
    icon: <Clock size={15} />, color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)",
    label: "Application Submitted",
    desc: "Your application is awaiting admin review. We will notify you once a decision is made.",
  },
  UNDER_REVIEW: {
    icon: <RefreshCw size={15} />, color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.3)",
    label: "Under Review",
    desc: "An admin is currently reviewing your application.",
  },
  MORE_INFO_REQUIRED: {
    icon: <AlertCircle size={15} />, color: "#f97316",
    bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)",
    label: "Additional Info Required",
    desc: "The admin has requested more information from you.",
  },
  APPROVED: {
    icon: <ShieldCheck size={15} />, color: "#10b981",
    bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)",
    label: "Verified Professional Reviewer",
    desc: "Congratulations! You are now a Verified Professional Reviewer.",
  },
  REJECTED: {
    icon: <XCircle size={15} />, color: "#f87171",
    bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)",
    label: "Application Not Approved",
    desc: "Your application was not approved at this time. You may reapply.",
  },
  REVOKED: {
    icon: <XCircle size={15} />, color: "#f87171",
    bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)",
    label: "Verification Revoked",
    desc: "Your verified status has been revoked by an admin.",
  },
};

export default function ApplicationStatusBanner({ application }) {
  const navigate = useNavigate();

  if (!application) {
    return (
      <div style={{
        padding: "16px 20px", borderRadius: "var(--radius-sm)",
        background: "var(--gold-faint)", border: "1px solid var(--gold-dim)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)", marginBottom: 3 }}>
            Become a Verified Professional Reviewer
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Share your expert insights and get a special badge on all your reviews.
          </div>
        </div>
        <button
          onClick={() => navigate("/apply-professional")}
          className="btn btn-primary btn-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          Apply Now
        </button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.SUBMITTED;

  return (
    <div style={{
      padding: "16px 20px", borderRadius: "var(--radius-sm)",
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{cfg.desc}</div>
      {application.adminNote && (
        <div style={{ fontSize: 12, color: "var(--text-primary)", background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: 6, borderLeft: `2px solid ${cfg.color}`, marginTop: 4 }}>
          <strong>Admin note:</strong> {application.adminNote}
        </div>
      )}
      {(application.status === "REJECTED" || application.status === "REVOKED") && (
        <button
          onClick={() => navigate("/apply-professional")}
          style={{ alignSelf: "flex-start", fontSize: 12, color: cfg.color, background: "none", border: `1px solid ${cfg.border}`, borderRadius: 16, padding: "4px 12px", cursor: "pointer", marginTop: 4 }}
        >
          Reapply
        </button>
      )}
    </div>
  );
}
