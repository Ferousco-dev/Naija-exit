import { useState, useEffect, useRef } from "react";
import { fetchFXRates } from "../services/exchangerate";
import { fetchPoliticalSignal, fetchCryptoSentiment } from "../services/bayse";
import { estimateRelocationCost } from "../services/costEstimator";
import { calculateJapaScore, getScoreStatus } from "../utils/scoreEngine";

// Fallback costs if AI estimation fails (in NGN)
const FALLBACK_COSTS = {
  Canada: 4900000,
  UK: 5200000,
  USA: 5500000,
  Germany: 4200000,
  Australia: 4800000,
};

export const useJapaScore = (user) => {
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState(null);
  const [signals, setSignals] = useState(null);
  const [fxRates, setFxRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const load = async () => {
      setLoading(true);

      const [fx, political, crypto, estimatedCost] = await Promise.all([
        fetchFXRates(),
        fetchPoliticalSignal(),
        fetchCryptoSentiment(),
        estimateRelocationCost(user.country),
      ]);

      const targetCost =
        estimatedCost || FALLBACK_COSTS[user.country] || 4900000;
      const savingsProgress = Math.min(user.savings / targetCost, 1);

      const fxSignal = fx ? Math.min(1, 1600 / parseFloat(fx.USD)) : 0.5;

      const calculated = calculateJapaScore({
        savingsProgress,
        fxSignal,
        politicalRisk: political,
        cryptoSentiment: crypto,
      });

      setScore(calculated);
      setStatus(getScoreStatus(calculated));
      setFxRates(fx);
      setSignals({
        savings: {
          value: Math.round(savingsProgress * 100),
          target: targetCost,
        },
        fx: { value: fx?.USD, signal: fxSignal },
        political: { value: Math.round(political * 100) },
        crypto: { value: Math.round(crypto * 100) },
      });

      setLoading(false);
    };

    load();
  }, [user?.name]);

  return { score, status, signals, fxRates, loading };
};
