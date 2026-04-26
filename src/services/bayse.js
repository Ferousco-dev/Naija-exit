const BASE_URL = "/api-bayse";
const API_KEY = import.meta.env.VITE_BAYSE_PUBLIC_KEY;

const clamp = (value) => Math.min(1, Math.max(0, value));
const asArray = (value) => (Array.isArray(value) ? value : []);

const buildFallbackSentiment = (topSignal) => ({
  politicalTension: 0.45,
  cryptoBullishness: 0.55,
  marketActivity: 0.5,
  totalMarketsAnalyzed: 0,
  topSignal,
  sentimentScore: 0.5,
  signal: "neutral",
  confidenceScore: 0.25,
  confidenceLabel: "low",
  categoryBreakdown: [],
  sampleEvents: [],
  lastUpdated: new Date().toISOString(),
});

const getConfidenceLabel = (confidence) => {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
};

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
      return buildFallbackSentiment("Data unavailable — set Bayse API key");
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
      return buildFallbackSentiment("API error — using fallback signals");
    }

    const data = await res.json();
    const events = asArray(data.events);

    let politicalWeightedSum = 0;
    let politicalWeightSum = 0;
    let cryptoWeightedSum = 0;
    let cryptoWeightSum = 0;
    let totalOrders = 0;
    let marketsAnalyzed = 0;
    const categoryBuckets = {};
    const sampleEvents = [];

    events.forEach((event) => {
      const category = String(event.category || "General");
      const categoryKey = category.trim() || "General";

      if (!categoryBuckets[categoryKey]) {
        categoryBuckets[categoryKey] = {
          category: categoryKey,
          markets: 0,
          orders: 0,
        };
      }

      const eventTitle =
        String(event.title || event.name || event.question || "").trim() ||
        null;
      if (eventTitle && sampleEvents.length < 4) {
        sampleEvents.push(eventTitle);
      }

      asArray(event.markets).forEach((market) => {
        const rawOrders = Number(market.totalOrders);
        const weight = rawOrders > 0 ? rawOrders : 1;
        totalOrders += weight;
        marketsAnalyzed++;
        categoryBuckets[categoryKey].markets += 1;
        categoryBuckets[categoryKey].orders += rawOrders > 0 ? rawOrders : 0;

        // Politics markets
        if (categoryKey.toLowerCase().includes("politics")) {
          const tension = market.outcome1Price || 0;
          politicalWeightedSum += tension * weight;
          politicalWeightSum += weight;
        }

        // Crypto markets
        if (categoryKey.toLowerCase().includes("crypto")) {
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
    // Assume 1200+ weighted orders = high activity (1.0), 0 = low activity (0)
    const marketActivity = Math.min(1, totalOrders / 1200);

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

    const categoryBreakdown = Object.values(categoryBuckets)
      .sort((a, b) => b.markets - a.markets)
      .slice(0, 3)
      .map((bucket) => ({
        category: bucket.category,
        markets: bucket.markets,
        marketShare:
          marketsAnalyzed > 0 ? clamp(bucket.markets / marketsAnalyzed) : 0,
        orders: bucket.orders,
      }));

    const coverageScore = Math.min(1, marketsAnalyzed / 45);
    const confidenceScore = clamp(coverageScore * 0.65 + marketActivity * 0.35);
    const confidenceLabel = getConfidenceLabel(confidenceScore);

    return {
      politicalTension: clamp(politicalTension),
      cryptoBullishness: clamp(cryptoBullishness),
      marketActivity: clamp(marketActivity),
      totalMarketsAnalyzed: marketsAnalyzed,
      topSignal,
      sentimentScore: clamp(sentimentScore),
      signal,
      confidenceScore,
      confidenceLabel,
      categoryBreakdown,
      sampleEvents,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Bayse sentiment fetch error:", err);
    return buildFallbackSentiment("Error fetching Bayse data");
  }
};
