const BASE_URL = "/api-bayse";
const API_KEY = import.meta.env.VITE_BAYSE_PUBLIC_KEY;

const clamp = (value) => Math.min(1, Math.max(0, value));

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

export const fetchMarketSentimentScore = async () => {
  try {
    if (!API_KEY || API_KEY === "your_bayse_public_key_here") {
      console.warn("Bayse API key not set, using fallback sentiment score");
      return {
        politicalTension: 0.45,
        cryptoBullishness: 0.55,
        marketActivity: 0.5,
        totalMarketsAnalyzed: 0,
        topSignal: "Data unavailable — set Bayse API key",
        sentimentScore: 0.5,
        signal: "neutral",
      };
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${BASE_URL}/pm/events?limit=100`, {
      headers: { "X-Public-Key": API_KEY },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(
        `Bayse sentiment API returned ${res.status}, using fallback`
      );
      return {
        politicalTension: 0.45,
        cryptoBullishness: 0.55,
        marketActivity: 0.5,
        totalMarketsAnalyzed: 0,
        topSignal: "API error — using fallback signals",
        sentimentScore: 0.5,
        signal: "neutral",
      };
    }

    const data = await res.json();
    const events = data.events || [];

    let politicalWeightedSum = 0;
    let politicalWeightSum = 0;
    let cryptoWeightedSum = 0;
    let cryptoWeightSum = 0;
    let totalOrders = 0;
    let marketsAnalyzed = 0;

    events.forEach((event) => {
      const category = event.category || "";
      event.markets?.forEach((market) => {
        const weight = market.totalOrders || 1;
        totalOrders += weight;
        marketsAnalyzed++;

        // Politics markets
        if (category.toLowerCase().includes("politics")) {
          const tension = market.outcome1Price || 0;
          politicalWeightedSum += tension * weight;
          politicalWeightSum += weight;
        }

        // Crypto markets
        if (category.toLowerCase().includes("crypto")) {
          if (market.outcome1Label?.toLowerCase().includes("up")) {
            const bullish = market.outcome1Price || 0;
            cryptoWeightedSum += bullish * weight;
            cryptoWeightSum += weight;
          }
        }
      });
    });

    // Calculate weighted averages
    const politicalTension =
      politicalWeightSum > 0
        ? clamp(politicalWeightedSum / politicalWeightSum)
        : 0.45;

    const cryptoBullishness =
      cryptoWeightSum > 0 ? clamp(cryptoWeightedSum / cryptoWeightSum) : 0.55;

    // Market activity score: normalize total orders to 0-1
    // Assume 1000+ orders = high activity (1.0), 0 = low activity (0)
    const marketActivity = Math.min(1, totalOrders / 1000);

    // Combined sentiment:
    // High political tension (bad), low crypto bullishness (bad), high activity = low score
    // Low political tension (good), high crypto bullishness (good), any activity = high score
    const sentimentScore = clamp(
      (1 - politicalTension) * 0.4 +
        cryptoBullishness * 0.4 +
        marketActivity * 0.2
    );

    // Determine signal
    let signal = "neutral";
    if (sentimentScore >= 0.65) signal = "bullish";
    else if (sentimentScore < 0.35) signal = "bearish";

    // Generate top signal text
    let topSignal = "Markets show neutral sentiment";
    if (politicalTension > 0.6 && cryptoBullishness < 0.5) {
      topSignal = "Political uncertainty dominates Bayse markets";
    } else if (politicalTension > 0.6) {
      topSignal = "High political tensing despite crypto optimism";
    } else if (cryptoBullishness < 0.4) {
      topSignal = "Crypto bearishness signals caution";
    } else if (cryptoBullishness > 0.65 && politicalTension < 0.4) {
      topSignal =
        "Crypto bullishness + stable politics suggests positive outlook";
    } else if (marketActivity < 0.3) {
      topSignal = "Low market activity — limited signal confidence";
    }

    return {
      politicalTension: clamp(politicalTension),
      cryptoBullishness: clamp(cryptoBullishness),
      marketActivity: clamp(marketActivity),
      totalMarketsAnalyzed: marketsAnalyzed,
      topSignal,
      sentimentScore: clamp(sentimentScore),
      signal,
    };
  } catch (err) {
    console.error("Bayse sentiment fetch error:", err);
    return {
      politicalTension: 0.45,
      cryptoBullishness: 0.55,
      marketActivity: 0.5,
      totalMarketsAnalyzed: 0,
      topSignal: "Error fetching Bayse data",
      sentimentScore: 0.5,
      signal: "neutral",
    };
  }
};
