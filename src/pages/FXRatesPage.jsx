import React, { useState, useEffect } from "react";
import FXRateHistory from "../components/FXRateHistory.jsx";
import {
  triggerFXRateFetch,
  fetchLatestFXRatesFromDB,
} from "../services/supabase.js";

export default function FXRatesPage() {
  const [latestRates, setLatestRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLatestRates();
    // Auto-refresh every hour
    const interval = setInterval(loadLatestRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadLatestRates = async () => {
    setLoading(true);
    const rates = await fetchLatestFXRatesFromDB();
    if (rates) {
      setLatestRates(rates);
      setLastUpdated(new Date(rates.timestamp));
    }
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    const result = await triggerFXRateFetch();
    if (result?.success) {
      await loadLatestRates();
    }
    setRefreshing(false);
  };

  const getTimeAgo = (date) => {
    if (!date) return "Unknown";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "var(--color-background-secondary)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: "0 0 10px 0",
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--color-text-primary)",
          }}
        >
          💱 FX Rate Dashboard
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Real-time exchange rates updated daily from ConvertAPI
        </p>
      </div>

      {/* Status Card */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Last Updated
          </div>
          <div
            style={{ fontSize: "16px", fontWeight: "600", color: "#3B6D11" }}
          >
            {lastUpdated ? getTimeAgo(lastUpdated) : "Loading..."}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-text-secondary)",
              marginTop: "2px",
            }}
          >
            {lastUpdated ? lastUpdated.toLocaleString() : ""}
          </div>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loading}
          style={{
            padding: "10px 20px",
            background: refreshing ? "#9CA3AF" : "#3B6D11",
            color: "white",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            fontSize: "14px",
            fontWeight: "600",
            cursor: refreshing ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: refreshing ? 0.6 : 1,
          }}
          title="Manually trigger FX rate fetch (runs at 2 AM UTC automatically)"
        >
          {refreshing ? "🔄 Fetching..." : "🔄 Refresh Now"}
        </button>
      </div>

      {/* Current Rates */}
      {latestRates && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "30px",
          }}
        >
          {["USD", "GBP", "CAD", "EUR", "AUD"].map((currency) => (
            <div
              key={currency}
              style={{
                background: "var(--color-background-primary)",
                border: "1px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                  marginBottom: "4px",
                }}
              >
                ₦ / {currency}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#3B6D11",
                }}
              >
                {parseFloat(latestRates[currency]).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FX Rate History Chart */}
      <FXRateHistory days={30} />

      {/* Info Box */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "16px",
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--color-text-secondary)",
          lineHeight: "1.6",
        }}
      >
        <strong style={{ color: "var(--color-text-primary)" }}>
          ℹ️ How it works:
        </strong>
        <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
          <li>
            Daily FX rates are fetched automatically at 2 AM UTC from ConvertAPI
          </li>
          <li>
            Rates are stored in Supabase database for 30-day history tracking
          </li>
          <li>
            Your app fetches from Supabase first (always fresh), then falls back
            to other sources
          </li>
          <li>
            You can manually trigger a refresh using the button above anytime
          </li>
          <li>See rates history and trends in the chart below</li>
        </ul>
      </div>
    </div>
  );
}
