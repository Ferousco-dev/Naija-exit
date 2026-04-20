import React from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/storage";

export default function Landing() {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-background-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#3B6D11",
          }}
        />
        <span
          style={{
            fontSize: "20px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
          }}
        >
          Naija Exit
        </span>
      </div>

      <h1
        style={{
          fontSize: "42px",
          fontWeight: "500",
          color: "var(--color-text-primary)",
          textAlign: "center",
          maxWidth: "600px",
          lineHeight: "1.2",
          marginBottom: "1rem",
        }}
      >
        Know exactly when to Japa
      </h1>

      <p
        style={{
          fontSize: "16px",
          color: "var(--color-text-secondary)",
          textAlign: "center",
          maxWidth: "480px",
          lineHeight: "1.7",
          marginBottom: "2.5rem",
        }}
      >
        Your personalized Japa Score — powered by live FX rates, Bayse market
        signals, and AI — tells you if you're ready to relocate and when to
        convert your Naira.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => navigate("/onboarding")}
          style={{
            background: "#3B6D11",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            padding: "12px 28px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Get my Japa Score
        </button>

        {user && (
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "transparent",
              color: "var(--color-text-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "12px 28px",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Back to dashboard
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "32px",
          marginTop: "4rem",
          padding: "1.5rem 2rem",
          background: "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        {[
          { label: "Live Japa Score", sub: "Updates in real time" },
          { label: "Bayse Signals", sub: "Political & crypto risk" },
          { label: "FX Timing", sub: "Best time to convert ₦" },
          { label: "AI Insight", sub: "Plain English advice" },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--color-text-primary)",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                marginTop: "4px",
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
