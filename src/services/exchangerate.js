export const fetchFXRates = async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN");
    const data = await res.json();

    if (data.result !== "success") throw new Error("API failed");

    const r = data.rates;

    return {
      USD: (1 / r.USD).toFixed(2),
      GBP: (1 / r.GBP).toFixed(2),
      CAD: (1 / r.CAD).toFixed(2),
      EUR: (1 / r.EUR).toFixed(2),
      AUD: (1 / r.AUD).toFixed(2),
      lastUpdated: data.time_last_update_utc,
    };
  } catch (err) {
    console.error("FX fetch failed, using fallback:", err);
    return {
      USD: "1621.40",
      GBP: "2104.60",
      CAD: "1184.20",
      EUR: "1751.30",
      AUD: "1054.90",
      lastUpdated: "offline",
    };
  }
};
