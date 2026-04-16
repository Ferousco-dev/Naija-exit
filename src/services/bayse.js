const BASE_URL = "/api-bayse";
const API_KEY = import.meta.env.VITE_BAYSE_PUBLIC_KEY;

export const fetchPoliticalSignal = async () => {
  try {
    if (!API_KEY || API_KEY === "your_bayse_public_key_here") {
      console.warn("Bayse API key not set, using fallback political signal");
      return 0.45;
    }
    const res = await fetch(`${BASE_URL}/pm/events?search=Nigeria&limit=5`, {
      headers: { "X-Public-Key": API_KEY },
    });
    if (!res.ok) {
      console.warn(
        `Bayse political API returned ${res.status}, using fallback`
      );
      return 0.45;
    }
    const data = await res.json();
    const events = data.events || [];

    let totalInstability = 0;
    let count = 0;

    events.forEach((event) => {
      event.markets?.forEach((market) => {
        totalInstability += market.outcome1Price || 0;
        count++;
      });
    });

    return count > 0 ? totalInstability / count : 0.5;
  } catch (err) {
    console.error("Bayse political fetch error:", err);
    return 0.45;
  }
};

export const fetchCryptoSentiment = async () => {
  try {
    if (!API_KEY || API_KEY === "your_bayse_public_key_here") {
      console.warn("Bayse API key not set, using fallback crypto signal");
      return 0.55;
    }
    const res = await fetch(`${BASE_URL}/pm/events?search=Bitcoin&limit=5`, {
      headers: { "X-Public-Key": API_KEY },
    });
    if (!res.ok) {
      console.warn(`Bayse crypto API returned ${res.status}, using fallback`);
      return 0.55;
    }
    const data = await res.json();
    const events = data.events || [];

    let upOdds = 0;
    let count = 0;

    events.forEach((event) => {
      event.markets?.forEach((market) => {
        if (market.outcome1Label === "Up") {
          upOdds += market.outcome1Price || 0;
          count++;
        }
      });
    });

    return count > 0 ? upOdds / count : 0.5;
  } catch (err) {
    console.error("Bayse crypto fetch error:", err);
    return 0.55;
  }
};
