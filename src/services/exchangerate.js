const FX_ALERTS_KEY = "fx_rate_alerts";
const FX_ALERT_HISTORY_KEY = "fx_alert_history";
const PREVIOUS_RATES_KEY = "fx_previous_rates";

// Store previous rates for direction tracking
export const storePreviousRates = (rates) => {
  try {
    localStorage.setItem(PREVIOUS_RATES_KEY, JSON.stringify(rates));
  } catch (err) {
    console.warn("Failed to store previous rates:", err);
  }
};

// Get previous rates
export const getPreviousRates = () => {
  try {
    const prev = localStorage.getItem(PREVIOUS_RATES_KEY);
    return prev ? JSON.parse(prev) : null;
  } catch (err) {
    console.warn("Failed to retrieve previous rates:", err);
    return null;
  }
};

// Store FX rate alerts (now supports multiple per currency with direction)
// Format: { "USD": [{id, target, direction: "above"|"below"}, ...], ... }
export const storeFXAlerts = (alerts) => {
  try {
    localStorage.setItem(FX_ALERTS_KEY, JSON.stringify(alerts));
  } catch (err) {
    console.warn("Failed to store FX alerts:", err);
  }
};

// Get FX rate alerts
export const getFXAlerts = () => {
  try {
    const alerts = localStorage.getItem(FX_ALERTS_KEY);
    return alerts ? JSON.parse(alerts) : {};
  } catch (err) {
    console.warn("Failed to retrieve FX alerts:", err);
    return {};
  }
};

// Store alert history (for Supabase sync or display)
export const storeAlertHistory = (alerts) => {
  try {
    localStorage.setItem(FX_ALERT_HISTORY_KEY, JSON.stringify(alerts));
  } catch (err) {
    console.warn("Failed to store alert history:", err);
  }
};

// Get alert history
export const getAlertHistory = () => {
  try {
    const history = localStorage.getItem(FX_ALERT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (err) {
    console.warn("Failed to retrieve alert history:", err);
    return [];
  }
};

// Add triggered alert to history with timestamp
export const logAlertTriggered = (alert) => {
  const history = getAlertHistory();
  history.push({
    ...alert,
    triggeredAt: new Date().toISOString(),
  });
  // Keep only last 100 alerts
  if (history.length > 100) {
    history.shift();
  }
  storeAlertHistory(history);
};

// Check if any rate alerts should trigger
export const checkFXAlerts = (currentRates) => {
  try {
    const alerts = getFXAlerts();
    const triggeredAlerts = [];
    const previousRates = getPreviousRates() || {};

    Object.keys(alerts).forEach((currency) => {
      const currencyAlerts = alerts[currency] || [];
      const currentRate = parseFloat(currentRates[currency]);
      const previousRateRaw = previousRates?.[currency];
      const previousRate = previousRateRaw == null ? NaN : parseFloat(previousRateRaw);

      if (!isNaN(currentRate)) {
        currencyAlerts.forEach((alert) => {
          const targetRate = alert.target || alert; // backward compat
          const direction = alert.direction || "above";
          let isTriggered = false;

          // Only trigger on a crossing event to avoid repeated alerts
          if (!isNaN(previousRate)) {
            if (direction === "above") {
              isTriggered = previousRate < targetRate && currentRate >= targetRate;
            } else if (direction === "below") {
              isTriggered = previousRate > targetRate && currentRate <= targetRate;
            }
          }

          if (isTriggered) {
            const triggeredAt = new Date().toISOString();
            const triggeredAlert = {
              id: alert.id,
              currency,
              targetRate,
              currentRate,
              direction,
              triggeredAt,
              message: `FX Alert: ${currency} ${
                direction === "above" ? "reached" : "dropped to"
              } ₦${currentRate.toFixed(2)} (${direction}: ₦${targetRate.toFixed(
                2
              )})`,
            };
            triggeredAlerts.push(triggeredAlert);
            logAlertTriggered(triggeredAlert);
          }
        });
      }
    });

    // Update previous rates for next check
    const nextPrevious = {};
    Object.keys(currentRates || {}).forEach((key) => {
      const value = parseFloat(currentRates[key]);
      if (!isNaN(value)) nextPrevious[key] = value;
    });
    storePreviousRates(nextPrevious);

    return triggeredAlerts;
  } catch (err) {
    console.warn("Error checking FX alerts:", err);
    return [];
  }
};

export const fetchFXRates = async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN");
    const data = await res.json();

    if (data.result !== "success") throw new Error("API failed");

    const r = data.rates;

    return {
      USD: (1 / r.USD).toFixed(2),
      GBP: (1 / r.GBP).toFixed(2),
      CAD: (1 / r.CAD).toFixed(2),
      EUR: (1 / r.EUR).toFixed(2),
      AUD: (1 / r.AUD).toFixed(2),
      lastUpdated: data.time_last_update_utc,
    };
  } catch (err) {
    console.error("FX fetch failed, using fallback:", err);
    return {
      USD: "1621.40",
      GBP: "2104.60",
      CAD: "1184.20",
      EUR: "1751.30",
      AUD: "1054.90",
      lastUpdated: "offline",
    };
  }
};
