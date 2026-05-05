// Frontend client — talks ONLY to our backend /api routes.
// No Supabase client or service-role key in the browser bundle.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const json = async (res) => {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`);
  }
  return res.json();
};

export const fetchLatestFXRatesFromDB = async () => {
  try {
    return await json(await fetch(`${API_BASE}/fx-rates/latest`));
  } catch (err) {
    console.warn("fetchLatestFXRatesFromDB:", err);
    return null;
  }
};

export const fetchFXRateHistory = async (days = 30) => {
  try {
    return await json(await fetch(`${API_BASE}/fx-rates/history?days=${days}`));
  } catch (err) {
    console.warn("fetchFXRateHistory:", err);
    return [];
  }
};

export const triggerFXRateFetch = async () => {
  try {
    return await json(
      await fetch(`${API_BASE}/fx-rates/trigger-fetch`, { method: "POST" })
    );
  } catch (err) {
    console.error("triggerFXRateFetch:", err);
    return null;
  }
};

export const storeAlertHistoryToSupabase = async (alert, userId = null) => {
  try {
    return await json(
      await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert, userId }),
      })
    );
  } catch (err) {
    console.warn("storeAlertHistoryToSupabase:", err);
    return null;
  }
};

export const fetchAlertHistoryFromSupabase = async (userId = null, days = 30) => {
  try {
    const qs = new URLSearchParams({ days: String(days) });
    if (userId) qs.set("userId", userId);
    return await json(await fetch(`${API_BASE}/alerts?${qs.toString()}`));
  } catch (err) {
    console.warn("fetchAlertHistoryFromSupabase:", err);
    return [];
  }
};
