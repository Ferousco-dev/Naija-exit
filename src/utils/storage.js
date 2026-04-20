const STORAGE_KEY = "naija_exit_user";
const SAVINGS_HISTORY_KEY = "naija_exit_savings_history";
const FX_HISTORY_KEY = "naija_exit_fx_history";
const SCORE_HISTORY_KEY = "naija_exit_score_history";
const MAX_SAVINGS_ENTRIES = 90;
const MAX_FX_ENTRIES = 30;
const MAX_SCORE_ENTRIES = 30;

export const saveUser = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getUser = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Savings Velocity Signal Functions
export const saveSavingsSnapshot = (amount) => {
  try {
    const history = JSON.parse(
      localStorage.getItem(SAVINGS_HISTORY_KEY) || "[]"
    );
    history.push({
      date: new Date().toISOString(),
      amount: amount || 0,
    });

    // Keep only the last 90 entries
    while (history.length > MAX_SAVINGS_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(SAVINGS_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Error saving savings snapshot:", err);
  }
};

export const getSavingsHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVINGS_HISTORY_KEY) || "[]");
  } catch (err) {
    console.error("Error getting savings history:", err);
    return [];
  }
};

// FX Trend Signal Functions
export const saveFXSnapshot = (usd, gbp, cad) => {
  try {
    const history = JSON.parse(localStorage.getItem(FX_HISTORY_KEY) || "[]");
    history.push({
      date: new Date().toISOString(),
      usd: parseFloat(usd) || 0,
      gbp: parseFloat(gbp) || 0,
      cad: parseFloat(cad) || 0,
    });

    // Keep only the last 30 entries
    while (history.length > MAX_FX_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(FX_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Error saving FX snapshot:", err);
  }
};

export const getFXHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(FX_HISTORY_KEY) || "[]");
  } catch (err) {
    console.error("Error getting FX history:", err);
    return [];
  }
};

// Score History Functions
export const saveScoreSnapshot = (score) => {
  try {
    const history = JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || "[]");
    history.push({
      date: new Date().toISOString(),
      score: Math.min(100, Math.max(0, Math.round(score))),
    });

    // Keep only the last 30 entries
    while (history.length > MAX_SCORE_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Error saving score snapshot:", err);
  }
};

export const getScoreHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || "[]");
  } catch (err) {
    console.error("Error getting score history:", err);
    return [];
  }
};
