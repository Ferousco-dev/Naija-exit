import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getUser, clearUser } from "../utils/storage";
import { useJapaScore } from "../hooks/useJapaScore";
import { addMonthlyEntry, getHistory } from "../utils/historyManager";
import ScoreGauge from "../components/ScoreGauge";
import SignalCards from "../components/SignalCards";
import ScoreHistory from "../components/ScoreHistory";
import AIInsight from "../components/AIInsight";
import Sidebar from "../components/Sidebar";
import Ticker from "../components/Ticker";
import Topbar from "../components/Topbar";
import AILoader from "../components/AILoader";
import FloatingChatBot from "../components/FloatingChatBot";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [toast, setToast] = useState("");

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

  const handleShareScore = () => {
    const shareText = `My Japa Score is ${score}/100 — ${
      status?.label
    } 🇳🇬\nI'm planning to relocate to ${
      user?.country || "a new country"
    }.\nTracking my Japa journey with Naija Exit.\n#NaijaExit #Japa #Nigeria`;

    navigator.clipboard.writeText(shareText).then(() => {
      setToast("Copied to clipboard!");
      setTimeout(() => setToast(""), 2500);
    });
  };

  if (loading) {
    return <AILoader />;
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
      <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <Topbar user={user} onLogout={handleLogout} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px",
            paddingBottom: "80px",
            borderRight: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-primary)",
            overflowY: "auto",
            height: "calc(100vh - 60px)",
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
              <button
                onClick={handleShareScore}
                style={{
                  marginTop: "12px",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: "0.5px solid #3B6D11",
                  background: "transparent",
                  color: "#3B6D11",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#3B6D11";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#3B6D11";
                }}
              >
                Share Score
              </button>
            </div>
          </div>

          <SignalCards signals={signals} />
          <ScoreHistory currentScore={score} />
          <AIInsight
            score={score}
            signals={signals}
            user={user}
            status={status}
          />
        </div>

        <div
          style={{
            position: "sticky",
            top: 0,
            height: "calc(100vh - 60px)",
            overflow: "hidden",
          }}
        >
          <Sidebar user={user} signals={signals} fxRates={fxRates} />
        </div>
      </div>

      <div
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <Ticker fxRates={fxRates} signals={signals} score={score} />
      </div>

      <FloatingChatBot
        user={user}
        score={score}
        signals={signals}
        status={status}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#3B6D11",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "500",
            zIndex: 1000,
            animation: "fadeInOut 2.5s ease-in-out",
          }}
        >
          {toast}
          <style>{`
            @keyframes fadeInOut {
              0%, 100% { opacity: 0; }
              10%, 90% { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
