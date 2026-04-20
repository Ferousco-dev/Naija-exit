import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not configured");
}

export const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_ANON_KEY || ""
);

// Fetch latest FX rates from Supabase database
export const fetchLatestFXRatesFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from("fx_rates")
      .select("usd, gbp, cad, eur, aud, timestamp")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn("Supabase fetch error:", error);
      return null;
    }

    if (data) {
      return {
        USD: parseFloat(data.usd).toFixed(2),
        GBP: parseFloat(data.gbp).toFixed(2),
        CAD: parseFloat(data.cad).toFixed(2),
        EUR: parseFloat(data.eur).toFixed(2),
        AUD: parseFloat(data.aud).toFixed(2),
        timestamp: data.timestamp,
      };
    }

    return null;
  } catch (err) {
    console.error("Error fetching rates from Supabase:", err);
    return null;
  }
};

// Get FX rate history (for charts/trends)
export const fetchFXRateHistory = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("fx_rates")
      .select("usd, gbp, cad, eur, aud, timestamp")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      console.warn("Supabase history fetch error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching FX rate history:", err);
    return [];
  }
};

// Manually trigger Edge Function to fetch rates (admin only)
export const triggerFXRateFetch = async () => {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-fx-rates", {
      method: "POST",
    });

    if (error) {
      console.error("Edge function error:", error);
      return null;
    }

    console.log("FX rates refreshed from Edge Function:", data);
    return data;
  } catch (err) {
    console.error("Error triggering Edge Function:", err);
    return null;
  }
};
