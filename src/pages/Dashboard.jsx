import React, { useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getUser, clearUser } from "../utils/storage";
import { useJapaScore } from "../hooks/useJapaScore";
import { addMonthlyEntry, getHistory } from "../utils/historyManager";
import ScoreGauge from "../components/ScoreGauge";
import SignalCards from "../components/SignalCards";
import AIInsight from "../components/AIInsight";
import History from "../components/History";
import Sidebar from "../components/Sidebar";
import Ticker from "../components/Ticker";
import Topbar from "../components/Topbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  // Hook must be called unconditionally (before any return)
  const { score, status, signals, fxRates, loading } = useJapaScore(user);

  // Auto-save monthly entry
  useEffect(() => {
    if (!loading && user && score && signals) {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0")}`;

      // Check if current month already exists
      const history = getHistory();
      const monthExists = history.some((entry) => entry.monthKey === monthKey);

      // Only save if this month hasn't been saved yet
      if (!monthExists) {
        addMonthlyEntry(user, score, user?.savings, signals);
      }
    }
  }, [user, score, loading, signals]);

  // Now we can do the redirect check
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-sans)",
          gap: "16px",
          background: "var(--color-background-primary)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid #EAF3DE",
            borderTop: "3px solid #3B6D11",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Calculating your Japa Score...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        minHeight: "100vh",
        background: "var(--color-background-tertiary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Topbar user={user} onLogout={handleLogout} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          flex: 1,
        }}
      >
        <div
          style={{
            padding: "24px",
            borderRight: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-primary)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              marginBottom: "4px",
            }}
          >
            Good day, {user?.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: "500",
                color: "var(--color-text-primary)",
              }}
            >
              Your Japa Readiness
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                padding: "6px 12px",
                background: "var(--color-background-secondary)",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              Current Savings:{" "}
              <span
                style={{
                  color: "var(--color-text-primary)",
                  fontWeight: "500",
                }}
              >
                ₦{user?.savings?.toLocaleString()}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              padding: "24px",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-lg)",
              border: "0.5px solid var(--color-border-tertiary)",
              marginBottom: "24px",
            }}
          >
            <ScoreGauge score={score} status={status} />
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Japa Score
              </div>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "500",
                  color: status?.color,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {score}
              </div>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "12px",
                  padding: "4px 12px",
                  borderRadius: "var(--border-radius-md)",
                  background: status?.bg,
                  color: status?.color,
                  marginBottom: "12px",
                }}
              >
                {status?.label}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.7,
                  maxWidth: "320px",
                }}
              >
                Based on your savings progress, live FX rates, and Bayse market
                signals.
              </div>
            </div>
          </div>

          <SignalCards signals={signals} />
          <AIInsight
            score={score}
            signals={signals}
            user={user}
            status={status}
          />

          {/* History Section */}
          <div style={{ marginTop: "24px" }}>
            <History />
          </div>
        </div>

        <Sidebar user={user} signals={signals} fxRates={fxRates} />
      </div>

      <Ticker fxRates={fxRates} signals={signals} score={score} />
    </div>
  );
}
