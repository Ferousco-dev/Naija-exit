import React, { useState, useEffect } from "react";
import { getHistory, deleteHistoryEntry } from "../utils/historyManager";

export default function History() {
  const [history, setHistory] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const hist = getHistory();
    setHistory(hist);
  }, []);

  const displayedHistory = showAll ? history : history.slice(0, 3);

  const handleDelete = (monthKey) => {
    deleteHistoryEntry(monthKey);
    setHistory(history.filter((entry) => entry.monthKey !== monthKey));
  };

  if (history.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          background: "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          textAlign: "center",
          color: "var(--color-text-secondary)",
          fontSize: "12px",
        }}
      >
        No history yet. Log your first month to start tracking!
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Progress History
        </div>
        <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
          {history.length} months
        </div>
      </div>

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {displayedHistory.map((entry, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px 16px",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "var(--color-text-primary)",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                {entry.displayMonth}
              </div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "10px",
                  marginBottom: "2px",
                }}
              >
                Savings:{" "}
                <span style={{ color: "#3B6D11", fontWeight: "500" }}>
                  ₦{entry.savings?.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "10px",
                }}
              >
                Score:{" "}
                <span style={{ color: "#3B6D11", fontWeight: "500" }}>
                  {entry.score}/100
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(entry.monthKey)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "0.5px solid var(--color-border-tertiary)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontSize: "10px",
                cursor: "pointer",
                marginLeft: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "var(--color-background-primary)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {history.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            background: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: "11px",
            cursor: "pointer",
            borderTop: "0.5px solid var(--color-border-tertiary)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "var(--color-background-primary)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          {showAll ? "Show Less" : `Show All (${history.length})`}
        </button>
      )}
    </div>
  );
}
