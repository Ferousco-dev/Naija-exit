const BASE_URL = "https://v6.exchangerate-api.com/v6";
const API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY;
const CACHE_KEY = "fx_rates_cache";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

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

export const fetchFXRates = async () => {
  try {
    // Check cache first
    const cached = getCachedRates();
    if (cached) {
      console.log("Using cached FX rates");
      return cached;
    }

    const res = await fetch(`${BASE_URL}/${API_KEY}/latest/NGN`);
    if (!res.ok) {
      console.warn(`FX API returned ${res.status}, using fallback rates`);
      return FALLBACK_RATES;
    }
    const data = await res.json();
    if (!data.conversion_rates) {
      console.warn("FX API returned no conversion_rates, using fallback");
      return FALLBACK_RATES;
    }
    const rates = {
      USD: (1 / data.conversion_rates.USD).toFixed(2),
      GBP: (1 / data.conversion_rates.GBP).toFixed(2),
      CAD: (1 / data.conversion_rates.CAD).toFixed(2),
      EUR: (1 / data.conversion_rates.EUR).toFixed(2),
      AUD: (1 / data.conversion_rates.AUD).toFixed(2),
    };
    setCachedRates(rates);
    return rates;
  } catch (err) {
    console.error("FX fetch error:", err);
    return FALLBACK_RATES;
  }
};
