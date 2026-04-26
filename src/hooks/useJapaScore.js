import { useState, useEffect, useRef } from "react";
import { fetchFXRates } from "../services/exchangerate";
import { fetchMarketSentimentScore } from "../services/bayse";
import { estimateRelocationCost } from "../services/costEstimator";
import {
  calculateJapaScore,
  getScoreStatus,
  calculateSavingsVelocity,
  calculateFXTrend,
} from "../utils/scoreEngine";
import {
  saveSavingsSnapshot,
  getSavingsHistory,
  saveFXSnapshot,
  getFXHistory,
  saveScoreSnapshot,
  saveBayseSnapshot,
} from "../utils/storage";

// Fallback costs if AI estimation fails (in NGN)
const FALLBACK_COSTS = {
  Canada: 4900000,
  UK: 5200000,
  USA: 5500000,
  Germany: 4200000,
  Australia: 4800000,
};

// Fallback FX rates
const FALLBACK_FX_RATES = {
  USD: "1580.00",
  GBP: "2010.00",
  CAD: "1120.00",
  EUR: "1780.00",
  AUD: "1020.00",
};

// Fallback Bayse score
const FALLBACK_BAYSE_SCORE = {
  politicalTension: 0.45,
  cryptoBullishness: 0.55,
  marketActivity: 0.5,
  totalMarketsAnalyzed: 0,
  topSignal: "Market data unavailable",
  sentimentScore: 0.5,
  signal: "neutral",
  confidenceScore: 0.25,
  confidenceLabel: "low",
  categoryBreakdown: [],
  sampleEvents: [],
  lastUpdated: new Date().toISOString(),
};

export const useJapaScore = (user) => {
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState(null);
  const [signals, setSignals] = useState(null);
  const [fxRates, setFxRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const load = async () => {
      setLoading(true);

      // Set 8 second timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn("Japa score calculation timeout - using fallback values");
        completeScore(
          FALLBACK_FX_RATES,
          FALLBACK_BAYSE_SCORE,
          FALLBACK_COSTS[user.country] || 4900000
        );
      }, 8000);
      timeoutRef.current = timeout;

      try {
        // Save snapshots for velocity tracking
        saveSavingsSnapshot(user.savings);

        // Fetch APIs in parallel with fallback handling
        const [fx, bayseScore, estimatedCost] = await Promise.all([
          fetchFXRates().catch((err) => {
            console.error("FX fetch failed:", err);
            return FALLBACK_FX_RATES;
          }),
          fetchMarketSentimentScore().catch((err) => {
            console.error("Bayse fetch failed:", err);
            return FALLBACK_BAYSE_SCORE;
          }),
          estimateRelocationCost(user.country).catch((err) => {
            console.error("Cost estimation failed:", err);
            return null;
          }),
        ]);

        clearTimeout(timeout);

        // Ensure we have valid objects
        const finalFx = fx || FALLBACK_FX_RATES;
        const finalBayse = bayseScore || FALLBACK_BAYSE_SCORE;
        const finalCost =
          estimatedCost || FALLBACK_COSTS[user.country] || 4900000;

        completeScore(finalFx, finalBayse, finalCost);
      } catch (err) {
        console.error("Error in useJapaScore:", err);
        clearTimeout(timeout);
        completeScore(
          FALLBACK_FX_RATES,
          FALLBACK_BAYSE_SCORE,
          FALLBACK_COSTS[user.country] || 4900000
        );
      }
    };

    const completeScore = (fx, bayseScore, targetCost) => {
      try {
        // Save FX snapshot
        if (fx) {
          saveFXSnapshot(fx.USD, fx.GBP, fx.CAD);
        }

        // Get stored histories for calculations
        const savingsHistory = getSavingsHistory();
        const fxHistory = getFXHistory();

        // Calculate velocity and FX trend
        const velocityData = calculateSavingsVelocity(savingsHistory);
        const fxTrendData = calculateFXTrend(fxHistory, fx || {});

        const finalSavingsProgress = Math.min(user.savings / targetCost, 1);
        const bayseScoreValue = bayseScore?.sentimentScore || 0.5;

        // Calculate final score
        const calculated = calculateJapaScore({
          savingsProgress: finalSavingsProgress,
          fxTrendScore: fxTrendData.score,
          velocityScore: velocityData.score,
          bayseScore: bayseScoreValue,
        });

        // Save score history
        saveScoreSnapshot(calculated);
        saveBayseSnapshot(bayseScore);

        setScore(calculated);
        setStatus(getScoreStatus(calculated));
        setFxRates(fx);

        // Build signals object with all fallbacks
        setSignals({
          savings: {
            value: Math.round(finalSavingsProgress * 100),
            target: targetCost,
          },
          velocity: velocityData,
          fx: {
            ...fxTrendData,
            currentRate: fx?.USD || FALLBACK_FX_RATES.USD,
          },
          bayse: bayseScore,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error completing score:", err);
        setLoading(false);
      }
    };

    load();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user?.name]);

  return { score, status, signals, fxRates, loading };
};
