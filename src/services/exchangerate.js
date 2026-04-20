const BASE_URL = "https://v6.exchangerate-api.com/v6";
const API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CACHE_KEY = "fx_rates_cache";
const PREVIOUS_RATES_KEY = "fx_previous_rates";
const FX_ALERTS_KEY = "fx_rate_alerts";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

// Import Supabase service
import { fetchLatestFXRatesFromDB, triggerFXRateFetch } from "./supabase.js";

// Fallback rates if the API is unavailable or rate-limited
const FALLBACK_RATES = {
  USD: "1580.00",
  GBP: "2010.00",
  CAD: "1120.00",
  EUR: "1780.00",
  AUD: "1020.00",
};

const getCachedRates = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
};

const fetchRatesFromGroq = async () => {
  try {
    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      console.warn("Groq API key not set, skipping Groq fallback");
      return null;
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "user",
              content:
                "Please provide current exchange rates for NGN to USD, GBP, CAD, EUR, and AUD. Format your response as a JSON object with keys USD, GBP, CAD, EUR, AUD and values as strings with two decimal places. Only return the JSON object, no other text.",
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `Groq API returned ${response.status}, skipping Groq fallback`
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rates = JSON.parse(jsonMatch[0]);
        // Validate that all required rates are present
        if (rates.USD && rates.GBP && rates.CAD && rates.EUR && rates.AUD) {
          console.log("Successfully fetched rates from Groq fallback");
          return {
            USD: Number(rates.USD).toFixed(2),
            GBP: Number(rates.GBP).toFixed(2),
            CAD: Number(rates.CAD).toFixed(2),
            EUR: Number(rates.EUR).toFixed(2),
            AUD: Number(rates.AUD).toFixed(2),
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Groq fallback fetch error:", err);
    return null;
  }
};

const setCachedRates = (rates) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: rates,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn("Failed to cache FX rates:", err);
  }
};

// Fetch from free API (exchangerate.host - no key required)
const fetchRatesFromFreeAPI = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      "https://api.exchangerate.host/latest?base=NGN&symbols=USD,GBP,CAD,EUR,AUD",
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Free FX API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.rates) {
      console.warn("Free FX API returned no rates");
      return null;
    }

    const rates = {
      USD: (1 / data.rates.USD).toFixed(2),
      GBP: (1 / data.rates.GBP).toFixed(2),
      CAD: (1 / data.rates.CAD).toFixed(2),
      EUR: (1 / data.rates.EUR).toFixed(2),
      AUD: (1 / data.rates.AUD).toFixed(2),
    };

    console.log("Successfully fetched rates from free API");
    return rates;
  } catch (err) {
    console.warn("Free API fetch error:", err);
    return null;
  }
};

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
    // Priority 1: Fetch from Supabase database (daily updated rates)
    console.log("Attempting to fetch from Supabase...");
    const dbRates = await fetchLatestFXRatesFromDB();
    if (dbRates) {
      console.log("✅ Using fresh rates from Supabase DB:", dbRates);
      setCachedRates(dbRates);
      storePreviousRates(dbRates);
      return dbRates;
    }

    // Priority 2: Check browser cache
    const cached = getCachedRates();
    if (cached) {
      console.log("Using cached FX rates");
      return cached;
    }

    // Priority 3: Try primary API (exchangerate-api.com with API key)
    if (API_KEY && API_KEY !== "your_exchange_api_key_here") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}/${API_KEY}/latest/NGN`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.conversion_rates) {
            const rates = {
              USD: (1 / data.conversion_rates.USD).toFixed(2),
              GBP: (1 / data.conversion_rates.GBP).toFixed(2),
              CAD: (1 / data.conversion_rates.CAD).toFixed(2),
              EUR: (1 / data.conversion_rates.EUR).toFixed(2),
              AUD: (1 / data.conversion_rates.AUD).toFixed(2),
            };
            setCachedRates(rates);
            storePreviousRates(rates);
            return rates;
          }
        }
      } catch (err) {
        console.warn("Primary API fetch failed:", err);
      }
    }

    // Priority 4: Try free API (exchangerate.host)
    const freeRates = await fetchRatesFromFreeAPI();
    if (freeRates) {
      setCachedRates(freeRates);
      storePreviousRates(freeRates);
      return freeRates;
    }

    // Priority 5: Try Groq fallback
    const groqRates = await fetchRatesFromGroq();
    if (groqRates) {
      setCachedRates(groqRates);
      storePreviousRates(groqRates);
      return groqRates;
    }

    // Priority 6: Use hardcoded fallback
    console.log("⚠️ Using fallback FX rates (all APIs failed)");
    setCachedRates(FALLBACK_RATES);
    return FALLBACK_RATES;
  } catch (err) {
    console.error("FX fetch error:", err);
    console.log("Using fallback FX rates");
    return FALLBACK_RATES;
  }
};

// Manually refresh FX rates from Edge Function
export const manuallyRefreshFXRates = async () => {
  try {
    console.log("🔄 Manually triggering FX rate refresh...");
    const result = await triggerFXRateFetch();
    if (result && result.success) {
      console.log("✅ FX rates refreshed successfully");
      // Fetch again to get the new rates
      return await fetchFXRates();
    }
    return null;
  } catch (err) {
    console.error("Failed to refresh FX rates:", err);
    return null;
  }
};
