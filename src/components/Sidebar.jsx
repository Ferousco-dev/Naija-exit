import React, { useEffect, useState } from "react";
import { getPreviousRates } from "../services/exchangerate.js";
import FXAlerts from "./FXAlerts.jsx";

const RELOCATION_COSTS = {
  Canada: { visa: 600000, flight: 1200000, threeMonths: 3100000 },
  UK: { visa: 700000, flight: 1400000, threeMonths: 3500000 },
  USA: { visa: 650000, flight: 1300000, threeMonths: 3550000 },
  Germany: { visa: 500000, flight: 1100000, threeMonths: 2600000 },
  Australia: { visa: 580000, flight: 1350000, threeMonths: 2870000 },
};

const FLAGS = {
  Canada: "🇨🇦",
  UK: "🇬🇧",
  USA: "🇺🇸",
  Germany: "🇩🇪",
  Australia: "🇦🇺",
};
const FX_PAIRS = ["USD", "GBP", "CAD", "EUR", "AUD"];

export default function Sidebar({ user, signals, fxRates, compact = false }) {
  const [previousRates, setPreviousRates] = useState(null);

  useEffect(() => {
    const prev = getPreviousRates();
    setPreviousRates(prev);
  }, [fxRates]);

  const getRateDirection = (currency) => {
    if (!previousRates || !fxRates) return null;

    const current = parseFloat(fxRates[currency]);
    const previous = parseFloat(previousRates[currency]);

    if (!current || !previous) return null;

    if (current > previous) {
      return { direction: "↑", color: "#22C55E", label: "Up" };
    } else if (current < previous) {
      return { direction: "↓", color: "#EF4444", label: "Down" };
    } else {
      return { direction: "→", color: "#6B7280", label: "Flat" };
    }
  };

  const costs = RELOCATION_COSTS[user?.country] || RELOCATION_COSTS.Canada;
  const savings = user?.savings || 0;
  const monthly = user?.monthlySavings || 0;
  const totalCost = costs.visa + costs.flight + costs.threeMonths;
  const remaining = Math.max(0, totalCost - savings);
  const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : "—";

  const progressItems = [
    {
      label: "Visa fees",
      saved: Math.min(savings * 0.12, costs.visa),
      total: costs.visa,
    },
    {
      label: "Flight",
      saved: Math.min(savings * 0.24, costs.flight),
      total: costs.flight,
    },
    {
      label: "First 3 months",
      saved: Math.min(savings * 0.64, costs.threeMonths),
      total: costs.threeMonths,
    },
  ];

  return (
    <div
      style={{
        padding: compact ? "14px" : "20px",
        background: "var(--color-background-secondary)",
        borderLeft: compact ? "none" : "0.5px solid var(--color-border-tertiary)",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "10px",
          }}
        >
          Target country
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            padding: "6px 12px",
            fontSize: "13px",
            color: "var(--color-text-primary)",
            marginBottom: "14px",
          }}
        >
          {FLAGS[user?.country]} {user?.country}
        </div>

        {progressItems.map((item) => {
          const pct = Math.min(
            100,
            Math.round((item.saved / item.total) * 100)
          );
          return (
            <div key={item.label} style={{ marginBottom: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "4px",
                }}
              >
                <span>{item.label}</span>
                <span>
                  ₦{Math.round(item.saved).toLocaleString()} / ₦
                  {item.total.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "var(--color-background-tertiary)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "3px",
                    width: `${pct}%`,
                    background:
                      pct >= 80 ? "#3B6D11" : pct >= 50 ? "#BA7517" : "#A32D2D",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "10px",
          }}
        >
          Japa runway
        </div>
        <div
          style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            padding: "14px",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "28px", fontWeight: "500", color: "#3B6D11" }}
          >
            ~{monthsLeft} {typeof monthsLeft === "number" ? "months" : ""}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              marginTop: "4px",
            }}
          >
            estimated at current savings rate
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "10px",
          }}
        >
          Live FX rates
        </div>
        {fxRates ? (
          FX_PAIRS.map((pair) => {
            const direction = getRateDirection(pair);
            return (
              <div
                key={pair}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "var(--color-text-primary)",
                  }}
                >
                  ₦ / {pair}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {parseFloat(fxRates[pair]).toLocaleString()}
                  </div>
                  {direction && (
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: direction.color,
                        minWidth: "16px",
                        textAlign: "center",
                        title: `${direction.label}`,
                      }}
                      title={direction.label}
                    >
                      {direction.direction}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Loading rates...
          </div>
        )}
        <FXAlerts
          fxRates={fxRates}
          onAlertTriggered={(alert) => {
            console.log("Alert triggered:", alert);
          }}
        />
      </div>
    </div>
  );
}
