const HISTORY_KEY = "japa_history";

export const addMonthlyEntry = (user, score, savings, signals) => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    const currentMonth = new Date();
    const monthKey = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    // Check if entry already exists for this month
    const existingIndex = history.findIndex(
      (entry) => entry.monthKey === monthKey
    );

    const newEntry = {
      monthKey,
      date: currentMonth.toISOString(),
      displayMonth: currentMonth.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      savings,
      score,
      userName: user?.name,
      targetCountry: user?.country,
      fxRate: signals?.fx?.value,
      politicalRisk: signals?.political?.value,
      cryptoSignal: signals?.crypto?.value,
    };

    if (existingIndex >= 0) {
      history[existingIndex] = newEntry;
    } else {
      history.push(newEntry);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return {
      success: true,
      message: `${currentMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })} entry saved!`,
    };
  } catch (err) {
    console.error("History save error:", err);
    return { success: false, message: "Failed to save history" };
  }
};

export const getHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("History fetch error:", err);
    return [];
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return { success: true, message: "History cleared" };
  } catch (err) {
    console.error("History clear error:", err);
    return { success: false, message: "Failed to clear history" };
  }
};

export const deleteHistoryEntry = (monthKey) => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    const filtered = history.filter((entry) => entry.monthKey !== monthKey);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return { success: true, message: "Entry deleted" };
  } catch (err) {
    console.error("History delete error:", err);
    return { success: false, message: "Failed to delete entry" };
  }
};
