import React from "react";
import { Users, ShieldCheck } from "lucide-react";

export default function ReviewTabs({ activeTab, onChange, userCount, proCount }) {
  const tabs = [
    { id: "all",          label: "All",              count: userCount + proCount },
    { id: "audience",     label: "Audience",          icon: <Users size={13} />,        count: userCount },
    { id: "professional", label: "Professional",      icon: <ShieldCheck size={13} />,  count: proCount },
  ];

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const isPro    = tab.id === "professional";
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
              background: isActive
                ? (isPro ? "rgba(16,185,129,0.15)" : "var(--gold-faint)")
                : "transparent",
              color: isActive
                ? (isPro ? "#10b981" : "var(--gold)")
                : "var(--text-muted)",
              border: isActive
                ? `1px solid ${isPro ? "rgba(16,185,129,0.4)" : "var(--gold-dim)"}`
                : "1px solid var(--border-subtle)",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 10, marginLeft: 2,
                background: isActive
                  ? (isPro ? "rgba(16,185,129,0.25)" : "var(--gold-dim)")
                  : "rgba(255,255,255,0.07)",
                color: isActive ? (isPro ? "#10b981" : "var(--gold)") : "var(--text-muted)",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
