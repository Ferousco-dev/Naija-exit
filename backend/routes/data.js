import { Router } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase.js";

const router = Router();

const guard = (res) => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Supabase not configured on server" });
    return false;
  }
  return true;
};

router.get("/data", (_req, res) => {
  res.json({ ok: true, service: "naija-exit api", time: new Date().toISOString() });
});

router.get("/fx-rates/latest", async (_req, res) => {
  if (!guard(res)) return;
  const { data, error } = await supabaseAdmin
    .from("fx_rates")
    .select("usd, gbp, cad, eur, aud, timestamp")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.warn("[fx-rates/latest]", error);
    return res.status(502).json({ error: error.message });
  }
  if (!data) return res.json(null);

  return res.json({
    USD: parseFloat(data.usd).toFixed(2),
    GBP: parseFloat(data.gbp).toFixed(2),
    CAD: parseFloat(data.cad).toFixed(2),
    EUR: parseFloat(data.eur).toFixed(2),
    AUD: parseFloat(data.aud).toFixed(2),
    timestamp: data.timestamp,
  });
});

router.get("/fx-rates/history", async (req, res) => {
  if (!guard(res)) return;
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from("fx_rates")
    .select("usd, gbp, cad, eur, aud, timestamp")
    .gte("timestamp", startDate.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    console.warn("[fx-rates/history]", error);
    return res.status(502).json({ error: error.message });
  }
  return res.json(data ?? []);
});

router.post("/fx-rates/trigger-fetch", async (_req, res) => {
  if (!guard(res)) return;
  const { data, error } = await supabaseAdmin.functions.invoke("fetch-fx-rates", {
    method: "POST",
  });
  if (error) {
    console.error("[fx-rates/trigger-fetch]", error);
    return res.status(502).json({ error: error.message });
  }
  return res.json(data ?? null);
});

router.get("/alerts", async (req, res) => {
  if (!guard(res)) return;
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
  const userId = req.query.userId || null;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let q = supabaseAdmin
    .from("fx_alert_history")
    .select("*")
    .gte("triggered_at", startDate.toISOString())
    .order("triggered_at", { ascending: false })
    .limit(200);
  if (userId) q = q.eq("user_id", userId);

  const { data, error } = await q;
  if (error) {
    console.warn("[alerts:get]", error);
    return res.status(502).json({ error: error.message });
  }
  return res.json(data ?? []);
});

router.post("/alerts", async (req, res) => {
  if (!guard(res)) return;
  const { alert, userId = null } = req.body ?? {};
  if (!alert?.currency || alert?.targetRate == null) {
    return res.status(400).json({ error: "alert.currency and alert.targetRate required" });
  }
  const payload = {
    user_id: userId,
    currency: alert.currency,
    target_rate: alert.targetRate,
    current_rate: alert.currentRate,
    direction: alert.direction,
    triggered_at: alert.triggeredAt || new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("fx_alert_history")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    console.warn("[alerts:post]", error);
    return res.status(502).json({ error: error.message });
  }
  return res.status(201).json(data);
});

export default router;
