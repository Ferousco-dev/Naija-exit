import React, { useState, useEffect } from "react";
import {
  getFXAlerts,
  storeFXAlerts,
  checkFXAlerts,
} from "../services/exchangerate.js";

const FX_PAIRS = ["USD", "GBP", "CAD", "EUR", "AUD"];

export default function FXAlerts({ fxRates, onAlertTriggered }) {
  const [alerts, setAlerts] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [targetRate, setTargetRate] = useState("");
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  useEffect(() => {
    const savedAlerts = getFXAlerts();
    setAlerts(savedAlerts);
  }, []);

  useEffect(() => {
    if (fxRates) {
      const triggered = checkFXAlerts(fxRates);
      setTriggeredAlerts(triggered);

      if (triggered.length > 0 && onAlertTriggered) {
        triggered.forEach((alert) => {
          onAlertTriggered(alert);
        });
      }
    }
  }, [fxRates, onAlertTriggered]);

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!targetRate || isNaN(parseFloat(targetRate))) return;

    const newAlerts = {
      ...alerts,
      [selectedCurrency]: parseFloat(targetRate),
    };
    setAlerts(newAlerts);
    storeFXAlerts(newAlerts);
    setTargetRate("");
    setSelectedCurrency("USD");
  };

  const handleRemoveAlert = (currency) => {
    const newAlerts = { ...alerts };
    delete newAlerts[currency];
    setAlerts(newAlerts);
    storeFXAlerts(newAlerts);
  };

  const dismissAlert = (index) => {
    setTriggeredAlerts(triggeredAlerts.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* Alert Notifications */}
      {triggeredAlerts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            maxWidth: "350px",
          }}
        >
          {triggeredAlerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                background: "#10B981",
                color: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                animation: "slideIn 0.3s ease",
              }}
            >
              <div style={{ fontSize: "13px" }}>
                <strong>🔔 FX Alert</strong>: {alert.currency} reached ₦
                {alert.currentRate.toFixed(2)}
              </div>
              <button
                onClick={() => dismissAlert(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginLeft: "10px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Alert Modal Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px",
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          color: "var(--color-text-primary)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "500",
          marginTop: "12px",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "var(--color-background-tertiary)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "var(--color-background-primary)";
        }}
      >
        🔔 FX Rate Alerts{" "}
        {Object.keys(alerts).length > 0 && `(${Object.keys(alerts).length})`}
      </button>

      {/* Alert Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: "var(--color-background-primary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              border: "1px solid var(--color-border-tertiary)",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                FX Rate Alerts 🔔
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Add New Alert Form */}
            <div
              style={{
                background: "var(--color-background-secondary)",
                padding: "16px",
                borderRadius: "var(--border-radius-md)",
                marginBottom: "20px",
                border: "1px solid var(--color-border-tertiary)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                Set Alert
              </h3>
              <form
                onSubmit={handleAddAlert}
                style={{
                  display: "flex",
                  gap: "8px",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--border-radius-md)",
                      border: "1px solid var(--color-border-tertiary)",
                      background: "var(--color-background-primary)",
                      color: "var(--color-text-primary)",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {FX_PAIRS.map((pair) => (
                      <option key={pair} value={pair}>
                        {pair}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Target rate (₦)"
                    value={targetRate}
                    onChange={(e) => setTargetRate(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--border-radius-md)",
                      border: "1px solid var(--color-border-tertiary)",
                      background: "var(--color-background-primary)",
                      color: "var(--color-text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: "8px 12px",
                    background: "#3B6D11",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#2d5409";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#3B6D11";
                  }}
                >
                  Add Alert
                </button>
              </form>
            </div>

            {/* Current Alerts */}
            <div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                Active Alerts
              </h3>
              {Object.keys(alerts).length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {FX_PAIRS.map((pair) => {
                    if (!alerts[pair]) return null;
                    const current = parseFloat(fxRates?.[pair] || 0);
                    const target = alerts[pair];
                    const isReached = current >= target;

                    return (
                      <div
                        key={pair}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          background: isReached
                            ? "#D1FAE5"
                            : "var(--color-background-secondary)",
                          borderRadius: "var(--border-radius-md)",
                          border: `1px solid ${
                            isReached
                              ? "#A7F3D0"
                              : "var(--color-border-tertiary)"
                          }`,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {pair}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--color-text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            Current: ₦{current.toLocaleString()} / Target: ₦
                            {target.toLocaleString()}
                          </div>
                          {isReached && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#059669",
                                marginTop: "2px",
                                fontWeight: "500",
                              }}
                            >
                              ✓ Alert reached!
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveAlert(pair)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "4px",
                          }}
                          title="Remove alert"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    textAlign: "center",
                    padding: "20px",
                    background: "var(--color-background-secondary)",
                    borderRadius: "var(--border-radius-md)",
                  }}
                >
                  No alerts set yet. Create one above to monitor FX rates! 📍
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
