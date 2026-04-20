import React, { useState, useEffect } from "react";
import {
  getFXAlerts,
  storeFXAlerts,
  checkFXAlerts,
  getAlertHistory,
} from "../services/exchangerate.js";
import {
  fetchAlertHistoryFromSupabase,
  storeAlertHistoryToSupabase,
} from "../services/supabase.js";

const FX_PAIRS = ["USD", "GBP", "CAD", "EUR", "AUD"];

// Generate unique ID for alerts
const generateAlertId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function FXAlerts({ fxRates, onAlertTriggered }) {
  const [alerts, setAlerts] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [targetRate, setTargetRate] = useState("");
  const [direction, setDirection] = useState("above");
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  const loadAlertHistory = async () => {
    const local = getAlertHistory();
    setAlertHistory(local || []);

    const remote = await fetchAlertHistoryFromSupabase(null, 30);
    if (remote && remote.length > 0) {
      const mapped = remote
        .map((row) => ({
          id: row.id,
          currency: row.currency,
          targetRate: parseFloat(row.target_rate),
          currentRate: parseFloat(row.current_rate),
          direction: row.direction,
          triggeredAt: row.triggered_at,
        }))
        .filter((row) => row.currency && !Number.isNaN(row.currentRate));

      setAlertHistory(mapped.reverse());
    }
  };

  // Initialize from storage
  useEffect(() => {
    const savedAlerts = getFXAlerts();
    setAlerts(savedAlerts || {});
    loadAlertHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for triggered alerts
  useEffect(() => {
    if (fxRates) {
      const triggered = checkFXAlerts(fxRates);
      setTriggeredAlerts(triggered);

      if (triggered.length > 0 && onAlertTriggered) {
        triggered.forEach((alert) => {
          onAlertTriggered(alert);
        });
      }

      if (triggered.length > 0) {
        triggered.forEach((alert) => {
          storeAlertHistoryToSupabase(alert, null);
        });
        setAlertHistory(getAlertHistory() || []);
      }
    }
  }, [fxRates, onAlertTriggered]);

  // Refresh history when the user opens the History tab
  useEffect(() => {
    if (isOpen && showHistory) {
      loadAlertHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showHistory]);

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!targetRate || isNaN(parseFloat(targetRate))) return;

    const newAlert = {
      id: generateAlertId(),
      target: parseFloat(targetRate),
      direction,
    };

    const newAlerts = { ...alerts };
    if (!newAlerts[selectedCurrency]) {
      newAlerts[selectedCurrency] = [];
    } else if (!Array.isArray(newAlerts[selectedCurrency])) {
      // Backward compat: convert old format to new
      newAlerts[selectedCurrency] = [
        {
          id: generateAlertId(),
          target: newAlerts[selectedCurrency],
          direction: "above",
        },
      ];
    }

    newAlerts[selectedCurrency].push(newAlert);
    setAlerts(newAlerts);
    storeFXAlerts(newAlerts);
    setTargetRate("");
    setDirection("above");
  };

  const handleRemoveAlert = (currency, alertId) => {
    const newAlerts = { ...alerts };
    if (Array.isArray(newAlerts[currency])) {
      newAlerts[currency] = newAlerts[currency].filter((a) => a.id !== alertId);
      if (newAlerts[currency].length === 0) {
        delete newAlerts[currency];
      }
    } else {
      delete newAlerts[currency];
    }
    setAlerts(newAlerts);
    storeFXAlerts(newAlerts);
  };

  const dismissAlert = (index) => {
    setTriggeredAlerts(triggeredAlerts.filter((_, i) => i !== index));
  };

  const totalAlertCount = Object.values(alerts).reduce(
    (sum, alerts) => sum + (Array.isArray(alerts) ? alerts.length : 1),
    0
  );

  return (
    <div>
      {/* Mobile-Friendly Toast Notifications */}
      {triggeredAlerts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "50vh",
            overflowY: "auto",
            // Mobile: center, Desktop: top-right
            alignItems: window.innerWidth < 768 ? "center" : "flex-end",
          }}
        >
          {triggeredAlerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white",
                padding: "16px 20px",
                borderRadius: "12px",
                maxWidth: window.innerWidth < 768 ? "90%" : "360px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
                animation: "slideInAlert 0.4s ease",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>
                  🔔 FX Alert Triggered!
                </div>
                <div
                  style={{
                    fontSize: window.innerWidth < 768 ? "13px" : "12px",
                    marginTop: "6px",
                    lineHeight: 1.5,
                  }}
                >
                  {alert.currency}{" "}
                  {alert.direction === "above" ? "reached" : "dropped to"} ₦
                  {alert.currentRate.toFixed(2)} ({alert.direction}: ₦
                  {alert.targetRate.toFixed(2)})
                </div>
              </div>
              <button
                onClick={() => dismissAlert(idx)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "20px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.2)";
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
        🔔 FX Rate Alerts {totalAlertCount > 0 && `(${totalAlertCount})`}
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
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: "var(--color-background-primary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              border: "1px solid var(--color-border-tertiary)",
              animation: "slideUpModal 0.3s ease",
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

            {/* Tab Switcher */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                borderBottom: "1px solid var(--color-border-tertiary)",
              }}
            >
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: !showHistory
                    ? "var(--color-background-secondary)"
                    : "transparent",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  borderBottom: !showHistory
                    ? "2px solid #3B6D11"
                    : "transparent",
                  transition: "all 0.2s",
                }}
              >
                Active Alerts
              </button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: showHistory
                    ? "var(--color-background-secondary)"
                    : "transparent",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  borderBottom: showHistory
                    ? "2px solid #3B6D11"
                    : "transparent",
                  transition: "all 0.2s",
                }}
              >
                History {alertHistory.length > 0 && `(${alertHistory.length})`}
              </button>
            </div>

            {!showHistory ? (
              <>
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
                      margin: "0 0 14px 0",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Set New Alert
                  </h3>
                  <form
                    onSubmit={handleAddAlert}
                    style={{
                      display: "flex",
                      gap: "10px",
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
                        step="0.01"
                        placeholder="Target rate"
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

                    {/* Direction Toggle */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        background: "var(--color-background-primary)",
                        padding: "4px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border-tertiary)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setDirection("above")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: "4px",
                          background:
                            direction === "above" ? "#3B6D11" : "transparent",
                          color:
                            direction === "above"
                              ? "white"
                              : "var(--color-text-secondary)",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                      >
                        ↑ Above
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection("below")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: "4px",
                          background:
                            direction === "below" ? "#3B6D11" : "transparent",
                          color:
                            direction === "below"
                              ? "white"
                              : "var(--color-text-secondary)",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                      >
                        ↓ Below
                      </button>
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: "10px 12px",
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
                  {totalAlertCount > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {FX_PAIRS.map((pair) => {
                        const currencyAlerts = alerts[pair];
                        if (!currencyAlerts) return null;

                        const alertsList = Array.isArray(currencyAlerts)
                          ? currencyAlerts
                          : [
                              {
                                id: "old",
                                target: currencyAlerts,
                                direction: "above",
                              },
                            ];
                        const current = parseFloat(fxRates?.[pair] || 0);

                        return (
                          <div key={pair}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "var(--color-text-primary)",
                                marginBottom: "8px",
                              }}
                            >
                              {pair} • Current: ₦{current.toLocaleString()}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              {alertsList.map((alert) => {
                                const isTriggered =
                                  alert.direction === "above"
                                    ? current >= alert.target
                                    : current <= alert.target;

                                return (
                                  <div
                                    key={alert.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      padding: "10px 12px",
                                      background: isTriggered
                                        ? "#D1FAE5"
                                        : "var(--color-background-secondary)",
                                      borderRadius: "var(--border-radius-md)",
                                      border: `1px solid ${
                                        isTriggered
                                          ? "#A7F3D0"
                                          : "var(--color-border-tertiary)"
                                      }`,
                                    }}
                                  >
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          color: "var(--color-text-primary)",
                                        }}
                                      >
                                        {alert.direction === "above"
                                          ? "↑"
                                          : "↓"}{" "}
                                        ₦{alert.target.toLocaleString()}
                                      </div>
                                      {isTriggered && (
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "#059669",
                                            marginTop: "2px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          ✓ Triggered!
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleRemoveAlert(pair, alert.id)
                                      }
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--color-text-secondary)",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        padding: "4px 8px",
                                      }}
                                      title="Remove alert"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
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
                      No alerts set yet. Create one above! 📍
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Alert History */
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Triggered Alerts
                </h3>
                {alertHistory.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    {[...alertHistory].reverse().map((alert, idx) => {
                      const date = new Date(alert.triggeredAt);
                      const timeStr = date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const dateStr = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "10px 12px",
                            background: "var(--color-background-secondary)",
                            borderRadius: "var(--border-radius-md)",
                            border: "0.5px solid var(--color-border-tertiary)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {alert.currency}{" "}
                            {alert.direction === "above" ? "↑" : "↓"} ₦
                            {alert.currentRate.toFixed(2)}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-secondary)",
                              marginTop: "4px",
                            }}
                          >
                            Target: ₦{alert.targetRate.toFixed(2)} • {timeStr} (
                            {dateStr})
                          </div>
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
                    No alert history yet. 📊
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInAlert {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUpModal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
