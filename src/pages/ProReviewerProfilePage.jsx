import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext";
import { getUserApplication } from "../services/proReviewerService";
import ProfessionalRatingBadge from "../components/reviews/ProfessionalRatingBadge";
import ProfessionalReviewCard from "../components/reviews/ProfessionalReviewCard";
import { ArrowLeft, Star } from "lucide-react";

export default function ProReviewerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { state, getMovieProfessionalReviews, dispatch } = useApp();

  const application = useMemo(() => getUserApplication(userId), [userId, state.professionalApplications]);
  const user = useMemo(() => state.users.find(u => u.id === userId), [state.users, userId]);

  const proReviews = useMemo(() => {
    return state.reviews.filter(r => r.userId === userId && r.reviewType === "PROFESSIONAL" && r.status === "PUBLISHED");
  }, [state.reviews, userId]);

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

  return (
    <div className="page-enter" style={{ padding: "40px 24px 80px" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 28, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Profile hero */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.02))",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: "var(--radius-sm)", padding: 28, marginBottom: 28,
          display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap",
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#10b981", fontWeight: 700, fontSize: 28,
          }}>
            {(application.fullName || user?.displayName || "P").charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
                {application.fullName || user?.displayName || "Professional Reviewer"}
              </h1>
              <ProfessionalRatingBadge size="md" />
            </div>

            {(application.professionalTitle || application.organization) && (
              <div style={{ fontSize: 13, color: "#10b981", marginBottom: 4 }}>
                {[application.professionalTitle, application.organization].filter(Boolean).join(" · ")}
              </div>
            )}

            {application.country && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>📍 {application.country}</div>
            )}

            {application.professionalBio && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                {application.professionalBio}
              </p>
            )}

            {/* Specializations */}
            {application.specializations?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {application.specializations.map(s => (
                  <span key={s} style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 12,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                    color: "#10b981",
                  }}>{s}</span>
                ))}
              </div>
            )}

            {/* Links */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              {application.portfolioUrl && <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#10b981" }}>🌐 Website</a>}
              {application.linkedinUrl && <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#10b981" }}>🔗 LinkedIn</a>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{proReviews.length}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Reviews</div>
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
