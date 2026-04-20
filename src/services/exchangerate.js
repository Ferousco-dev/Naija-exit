const FX_ALERTS_KEY = "fx_rate_alerts";
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

// Store FX rate alerts
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

// Check if any rate alerts should trigger
export const checkFXAlerts = (currentRates) => {
  try {
    const alerts = getFXAlerts();
    const triggeredAlerts = [];

    Object.keys(alerts).forEach((currency) => {
      const targetRate = alerts[currency];
      const currentRate = parseFloat(currentRates[currency]);

      if (!isNaN(currentRate) && targetRate) {
        // Alert if rate reached or exceeded target
        if (currentRate >= targetRate) {
          triggeredAlerts.push({
            currency,
            targetRate,
            currentRate,
            message: `FX Alert: ${currency} has reached ₦${currentRate.toFixed(
              2
            )} (target: ₦${targetRate.toFixed(2)})`,
          });
        }
      }
    });

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
