// Estimate real relocation costs using Groq AI
const CACHE_KEY = "relocation_costs_cache";
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const getCachedCost = (country) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const entry = cache[country];
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.cost;
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
};

const setCachedCost = (country, cost) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[country] = { cost, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Cache write error:", e);
  }
};

export const estimateRelocationCost = async (country) => {
  // Check cache first
  const cached = getCachedCost(country);
  if (cached) return cached;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Estimate costs in USD for someone relocating from Nigeria to ${country}. Break down:
- Visa fee: typical application cost
- Flight: one-way economy ticket Lagos to main city
- Monthly living costs: rent + food + utilities for 1 month (mid-range apartment)

Then calculate: (visa + flight + monthly_cost * 3) = total

Return ONLY valid JSON with no extra text:
{"visa": 300, "flight": 250, "monthly_living": 800, "total": 4150}`,
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error("Groq API error:", response.status);
      return null;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      console.error("No response from AI");
      return null;
    }

    // Try to parse JSON response
    let costData;
    try {
      costData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return null;
    }

    let totalUSD = costData.total || 0;

    // Sanity checks - if estimates seem unreasonable, use defaults
    if (totalUSD < 2000 || totalUSD > 15000) {
      console.warn(
        `Cost estimate (${totalUSD}) outside reasonable range, using fallback`
      );
      return null;
    }

    // Convert to Naira using approximate rate (~1600 NGN per USD)
    const costNGN = Math.round(totalUSD * 1600);
    setCachedCost(country, costNGN);

    return costNGN;
  } catch (error) {
    console.error("Cost estimation error:", error);
    return null;
  }
};
