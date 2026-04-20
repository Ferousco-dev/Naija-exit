// Target monthly savings rate (in NGN)
const TARGET_MONTHLY_SAVINGS = 250000;

// Clamp value between 0 and 1
const clamp = (value) => Math.min(1, Math.max(0, value));

// Savings Velocity Calculation (optimized for speed)
export const calculateSavingsVelocity = (history) => {
  if (!history || history.length === 0) {
    return {
      monthlyRate: 0,
      previousMonthlyRate: 0,
      trend: "flat",
      trendPercent: 0,
      projectedReadyDate: "N/A",
      signal: "weak",
      score: 0.1,
    };
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoTime = now - thirtyDaysMs;
  const sixtyDaysAgoTime = now - sixtyDaysMs;

  // Single pass to calculate both periods
  let last30Sum = 0,
    last30Count = 0;
  let prev30Sum = 0,
    prev30Count = 0;

  for (let i = 0; i < history.length; i++) {
    const entryTime = new Date(history[i].date).getTime();
    const amount = history[i].amount || 0;

    if (entryTime >= thirtyDaysAgoTime) {
      last30Sum += amount;
      last30Count++;
    } else if (entryTime >= sixtyDaysAgoTime) {
      prev30Sum += amount;
      prev30Count++;
    }
  }

  const monthlyRate =
    last30Count > 0 ? (last30Sum / last30Count) * (30 / last30Count) : 0;
  const previousMonthlyRate =
    prev30Count > 0 ? (prev30Sum / prev30Count) * (30 / prev30Count) : 0;

  // Calculate trend
  let trend = "flat";
  let trendPercent = 0;
  if (previousMonthlyRate > 0) {
    trendPercent = Math.round(
      ((monthlyRate - previousMonthlyRate) / previousMonthlyRate) * 100
    );
    if (trendPercent > 5) trend = "up";
    else if (trendPercent < -5) trend = "down";
  }

  // Fast projected date calculation (no toLocaleDateString)
  const targetSavings = 5000000;
  const lastEntry = history[history.length - 1];
  const currentSavings = lastEntry ? lastEntry.amount : 0;
  const remaining = Math.max(0, targetSavings - currentSavings);

  let projectedReadyDate = "N/A";
  if (monthlyRate > 0) {
    const monthsNeeded = Math.ceil(remaining / monthlyRate);
    const futureDate = new Date(now + monthsNeeded * 30 * 24 * 60 * 60 * 1000);
    const month = futureDate.toLocaleString("en-US", { month: "long" });
    const year = futureDate.getFullYear();
    projectedReadyDate = `${month} ${year}`;
  }

  // Calculate signal and score
  let signal = "weak";
  let score = 0.1;

  if (monthlyRate >= TARGET_MONTHLY_SAVINGS * 1.2) {
    signal = "strong";
    score = clamp(0.9);
  } else if (monthlyRate >= TARGET_MONTHLY_SAVINGS) {
    signal = "strong";
    score = clamp(0.8);
  } else if (monthlyRate >= TARGET_MONTHLY_SAVINGS * 0.8) {
    signal = "caution";
    score = clamp(0.6);
  } else if (monthlyRate >= TARGET_MONTHLY_SAVINGS * 0.5) {
    signal = "caution";
    score = clamp(0.4);
  } else if (monthlyRate > 0) {
    signal = "weak";
    score = clamp(0.3);
  } else {
    signal = "weak";
    score = clamp(0.1);
  }

  return {
    monthlyRate: Math.round(monthlyRate),
    previousMonthlyRate: Math.round(previousMonthlyRate),
    trend,
    trendPercent,
    projectedReadyDate,
    signal,
    score,
  };
};

// FX Trend Calculation (optimized for speed)
export const calculateFXTrend = (history, currentRates) => {
  if (!history || history.length === 0 || !currentRates) {
    return {
      sevenDayChange: 0,
      direction: "stable",
      volatility: "low",
      bestTimeToConvert: false,
      signal: "caution",
      score: 0.5,
    };
  }

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgoTime = now - sevenDaysMs;

  // Single pass to get 7-day rates
  const last7Days = [];
  for (let i = 0; i < history.length; i++) {
    const entryTime = new Date(history[i].date).getTime();
    if (entryTime >= sevenDaysAgoTime) {
      last7Days.push(history[i].usd);
    }
  }

  if (last7Days.length === 0) {
    return {
      sevenDayChange: 0,
      direction: "stable",
      volatility: "low",
      bestTimeToConvert: false,
      signal: "caution",
      score: 0.5,
    };
  }

  const oldestRate = last7Days[0];
  const newestRate =
    parseFloat(currentRates.USD) || last7Days[last7Days.length - 1];

  // Calculate 7-day change
  const sevenDayChange = ((newestRate - oldestRate) / oldestRate) * 100;

  // Fast volatility calculation (single pass)
  let sum = 0,
    sumSq = 0;
  for (let i = 0; i < last7Days.length; i++) {
    sum += last7Days[i];
    sumSq += last7Days[i] * last7Days[i];
  }
  const avgRate = sum / last7Days.length;
  const variance = sumSq / last7Days.length - avgRate * avgRate;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const volatilityPercent = (stdDev / avgRate) * 100;

  let volatility = "low";
  let volatilityPenalty = 0;
  if (volatilityPercent > 2) {
    volatility = "high";
    volatilityPenalty = 0.1;
  } else if (volatilityPercent > 1) {
    volatility = "moderate";
    volatilityPenalty = 0.05;
  }

  // Determine direction
  let direction = "stable";
  if (sevenDayChange < -1) direction = "strengthening";
  else if (sevenDayChange > 1) direction = "weakening";

  // Determine signal and score
  let signal = "caution";
  let score = 0.5;

  if (direction === "strengthening") {
    signal = "good";
    score = clamp(0.9 - volatilityPenalty);
  } else if (direction === "stable") {
    signal = "caution";
    score = clamp(0.55 - volatilityPenalty);
  } else if (direction === "weakening") {
    signal = "bad";
    score = clamp(0.2 - volatilityPenalty);
  }

  const bestTimeToConvert = signal === "good" && Math.abs(sevenDayChange) > 0.5;

  return {
    sevenDayChange: Math.round(sevenDayChange * 100) / 100,
    direction,
    volatility,
    bestTimeToConvert,
    signal,
    score,
  };
};

export const calculateJapaScore = ({
  savingsProgress,
  fxTrendScore,
  velocityScore,
  bayseScore,
}) => {
  const savingsScoreComponent = savingsProgress * 30;
  const velocityScoreComponent = Math.min(1, velocityScore || 0) * 20;
  const fxScoreComponent = Math.min(1, fxTrendScore || 0) * 20;
  const bayseScoreComponent = Math.min(1, bayseScore || 0) * 30;

  const total = Math.round(
    savingsScoreComponent +
      velocityScoreComponent +
      fxScoreComponent +
      bayseScoreComponent
  );

  return Math.min(100, Math.max(0, total));
};

export const getScoreStatus = (score) => {
  if (score >= 80)
    return { label: "Ready to Japa", color: "#3B6D11", bg: "#EAF3DE" };
  if (score >= 60)
    return { label: "Almost Ready", color: "#3B6D11", bg: "#EAF3DE" };
  if (score >= 40)
    return { label: "Keep Saving", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Not Yet", color: "#A32D2D", bg: "#FCEBEB" };
};
