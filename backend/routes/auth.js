import { Router } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase.js";

const router = Router();

const requireConfig = (res) => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Supabase not configured on server" });
    return false;
  }
  return true;
};

router.post("/register", async (req, res) => {
  if (!requireConfig(res)) return;
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ user: { id: data.user.id, email: data.user.email } });
  } catch (err) {
    console.error("[/api/register] error:", err);
    return res.status(500).json({ error: "registration failed" });
  }
});

router.post("/login", async (req, res) => {
  if (!requireConfig(res)) return;
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({
      user: { id: data.user.id, email: data.user.email },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error("[/api/login] error:", err);
    return res.status(500).json({ error: "login failed" });
  }
});

export default router;
