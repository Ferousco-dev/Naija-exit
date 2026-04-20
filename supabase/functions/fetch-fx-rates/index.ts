import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXCHANGE_API_KEY =
  Deno.env.get("EXCHANGE_API_KEY") || "a7771eb65756fafbe3173936";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const SUPABASE_URL = "https://whkpuhdoqsousummmuaw.supabase.co";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || "");

serve(async (req) => {
  try {
    console.log("🔄 Fetching FX rates from Exchange API...");

    // Fetch from exchangerate-api.com (your existing API)
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/NGN`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.conversion_rates) {
      throw new Error("No conversion_rates in response");
    }

    // Calculate rates (inverse: ₦ per 1 unit of currency)
    const rates = {
      USD: (1 / data.conversion_rates.USD).toFixed(2),
      GBP: (1 / data.conversion_rates.GBP).toFixed(2),
      CAD: (1 / data.conversion_rates.CAD).toFixed(2),
      EUR: (1 / data.conversion_rates.EUR).toFixed(2),
      AUD: (1 / data.conversion_rates.AUD).toFixed(2),
    };

    console.log("✅ Rates calculated:", rates);

    // Insert into database
    const { error, data: insertedData } = await supabase
      .from("fx_rates")
      .insert({
        usd: parseFloat(rates.USD),
        gbp: parseFloat(rates.GBP),
        cad: parseFloat(rates.CAD),
        eur: parseFloat(rates.EUR),
        aud: parseFloat(rates.AUD),
        source: "exchangerate-api.com",
        timestamp: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("✅ Inserted into database:", insertedData);

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        message: "FX rates updated successfully",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch rates",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
