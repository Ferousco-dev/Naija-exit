import React, { useState, useEffect } from "react";
import { fetchFXRateHistory } from "../services/supabase.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  USD: "#3B6D11",
  GBP: "#BA7517",
  CAD: "#2563EB",
  EUR: "#7C3AED",
  AUD: "#DC2626",
};

export default function FXRateHistory({ days = 30 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrencies, setSelectedCurrencies] = useState({
    USD: true,
    GBP: true,
    CAD: false,
    EUR: false,
    AUD: false,
  });

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await fetchFXRateHistory(days);

      // Transform data for recharts
      const chartData = data.map((record) => ({
        date: new Date(record.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        timestamp: record.timestamp,
        USD: parseFloat(record.usd),
        GBP: parseFloat(record.gbp),
        CAD: parseFloat(record.cad),
        EUR: parseFloat(record.eur),
        AUD: parseFloat(record.aud),
      }));

      setHistory(chartData);
      setLoading(false);
    };

    loadHistory();
  }, [days]);

  const toggleCurrency = (currency) => {
    setSelectedCurrencies((prev) => ({
      ...prev,
      [currency]: !prev[currency],
    }));
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading rate history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-md)",
          color: "var(--color-text-secondary)",
        }}
      >
        No FX rate history available yet. Historical data will appear here once
        rates are recorded daily.
      </div>
    );
  }

  const activeCurrencies = Object.keys(selectedCurrencies).filter(
    (c) => selectedCurrencies[c]
  );

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-md)",
        padding: "20px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "var(--color-text-primary)",
          }}
        >
          📈 FX Rate History ({days} days)
        </h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Object.keys(COLORS).map((currency) => (
            <button
              key={currency}
              onClick={() => toggleCurrency(currency)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--border-radius-md)",
                border: selectedCurrencies[currency]
                  ? `2px solid ${COLORS[currency]}`
                  : "1px solid var(--color-border-tertiary)",
                background: selectedCurrencies[currency]
                  ? COLORS[currency]
                  : "var(--color-background-secondary)",
                color: selectedCurrencies[currency]
                  ? "white"
                  : "var(--color-text-primary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
              title={`Toggle ${currency}`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      {activeCurrencies.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={history}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-tertiary)"
            />
            <XAxis
              dataKey="date"
              stroke="var(--color-text-secondary)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              style={{ fontSize: "12px" }}
              label={{ value: "₦", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-background-secondary)",
                border: "1px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                color: "var(--color-text-primary)",
              }}
              formatter={(value) => `₦${parseFloat(value).toLocaleString()}`}
              labelStyle={{ color: "var(--color-text-secondary)" }}
            />
            <Legend
              wrapperStyle={{ color: "var(--color-text-secondary)" }}
              iconType="line"
            />
            {selectedCurrencies.USD && (
              <Line
                type="monotone"
                dataKey="USD"
                stroke={COLORS.USD}
                dot={false}
                strokeWidth={2}
              />
            )}
            {selectedCurrencies.GBP && (
              <Line
                type="monotone"
                dataKey="GBP"
                stroke={COLORS.GBP}
                dot={false}
                strokeWidth={2}
              />
            )}
            {selectedCurrencies.CAD && (
              <Line
                type="monotone"
                dataKey="CAD"
                stroke={COLORS.CAD}
                dot={false}
                strokeWidth={2}
              />
            )}
            {selectedCurrencies.EUR && (
              <Line
                type="monotone"
                dataKey="EUR"
                stroke={COLORS.EUR}
                dot={false}
                strokeWidth={2}
              />
            )}
            {selectedCurrencies.AUD && (
              <Line
                type="monotone"
                dataKey="AUD"
                stroke={COLORS.AUD}
                dot={false}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          Select currencies to view trends
        </div>
      )}

      {/* Statistics */}
      {history.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-border-tertiary)",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
            }}
          >
            Statistics
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {Object.keys(COLORS).map((currency) => {
              if (!selectedCurrencies[currency]) return null;

              const rates = history
                .map((h) => h[currency])
                .filter((r) => r && !isNaN(r));

              if (rates.length === 0) return null;

              const min = Math.min(...rates);
              const max = Math.max(...rates);
              const current = rates[rates.length - 1];
              const change = ((current - rates[0]) / rates[0]) * 100;

              return (
                <div
                  key={currency}
                  style={{
                    padding: "10px",
                    background: "var(--color-background-secondary)",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: COLORS[currency],
                      marginBottom: "4px",
                    }}
                  >
                    {currency}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "11px",
                      lineHeight: "1.4",
                    }}
                  >
                    <div>Current: ₦{current.toLocaleString()}</div>
                    <div>
                      Range: ₦{min.toLocaleString()} - ₦{max.toLocaleString()}
                    </div>
                    <div
                      style={{
                        color: change >= 0 ? "#22C55E" : "#EF4444",
                        fontWeight: "500",
                      }}
                    >
                      Change: {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
