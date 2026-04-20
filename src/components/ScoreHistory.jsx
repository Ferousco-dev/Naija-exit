import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getScoreHistory } from "../utils/storage";
import { getHistory, deleteHistoryEntry } from "../utils/historyManager";

export default function ScoreHistory({ currentScore }) {
  const [data, setData] = useState([]);
  const [monthHistory, setMonthHistory] = useState([]);
  const [showAllMonths, setShowAllMonths] = useState(false);

  useEffect(() => {
    const history = getScoreHistory();
    if (history && history.length > 0) {
      // Format data for recharts
      const formattedData = history.map((entry) => {
        const date = new Date(entry.date);
        const month = date.toLocaleString("en-US", { month: "short" });
        const day = date.getDate();
        return {
          date: `${month} ${day}`,
          score: entry.score,
          fullDate: entry.date,
        };
      });
      setData(formattedData);
    }

    const monthlyHistory = getHistory();
    setMonthHistory(monthlyHistory);
  }, [currentScore]);

  const handleDelete = (monthKey) => {
    deleteHistoryEntry(monthKey);
    setMonthHistory(
      monthHistory.filter((entry) => entry.monthKey !== monthKey)
    );
  };

  const displayedMonths = showAllMonths
    ? monthHistory
    : monthHistory.slice(0, 3);

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
          }}
        >
          Score History
        </div>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#3B6D11",
          }}
        />
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-secondary)",
          }}
        >
          {currentScore}/100
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            stroke="var(--color-border-tertiary)"
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            stroke="var(--color-border-tertiary)"
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "6px",
              fontSize: "11px",
              padding: "6px 8px",
              color: "var(--color-text-primary)",
            }}
            formatter={(value) => [`${value}/100`, "Score"]}
            labelStyle={{ color: "var(--color-text-secondary)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3B6D11"
            dot={false}
            isAnimationActive={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Monthly Progress Breakdown */}
      {monthHistory.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            paddingTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "500",
                color: "var(--color-text-secondary)",
              }}
            >
              Monthly Snapshots ({monthHistory.length})
            </div>
            {monthHistory.length > 3 && (
              <button
                onClick={() => setShowAllMonths(!showAllMonths)}
                style={{
                  fontSize: "10px",
                  color: "#3B6D11",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  padding: "2px 6px",
                }}
              >
                {showAllMonths
                  ? "Show Less"
                  : `+${monthHistory.length - 3} more`}
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {displayedMonths.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  background: "var(--color-background-primary)",
                  borderRadius: "6px",
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
                      marginBottom: "2px",
                    }}
                  >
                    {entry.displayMonth}
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
                    </span>{" "}
                    • Savings:{" "}
                    <span style={{ color: "#3B6D11", fontWeight: "500" }}>
                      ₦{entry.savings?.toLocaleString()}
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
                    fontSize: "9px",
                    cursor: "pointer",
                    marginLeft: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background =
                      "var(--color-background-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
