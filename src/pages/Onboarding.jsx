import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUser } from "../utils/storage";

const COUNTRIES = ["Canada", "UK", "USA", "Germany", "Australia"];

const STEPS = ["Personal", "Financial", "Ready"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    country: "",
    savings: "",
    monthlySavings: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFinish = () => {
    saveUser({
      ...form,
      savings: parseFloat(form.savings),
      monthlySavings: parseFloat(form.monthlySavings),
      createdAt: new Date().toISOString(),
    });
    navigate("/dashboard");
  };

  const cardStyle = {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "2rem",
    width: "100%",
    maxWidth: "480px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "15px",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    boxSizing: "border-box",
    marginTop: "6px",
  };

  const labelStyle = {
    fontSize: "13px",
    color: "var(--color-text-secondary)",
    display: "block",
    marginBottom: "2px",
  };

  const btnStyle = {
    background: "#3B6D11",
    color: "#fff",
    border: "none",
    borderRadius: "var(--border-radius-md)",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "1.5rem",
    width: "100%",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-background-tertiary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#3B6D11",
          }}
        />
        <span
          style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "var(--color-text-primary)",
          }}
        >
          Naija Exit
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "2rem" }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background:
                  i <= step ? "#3B6D11" : "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "500",
                color: i <= step ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {i + 1}
            </div>
            <span
              style={{
                fontSize: "12px",
                color:
                  i === step
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
              }}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: "24px",
                  height: "1px",
                  background: "var(--color-border-tertiary)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        {step === 0 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "1.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              Let's get started
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Your name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Adaeze"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Target country</label>
              <select
                style={inputStyle}
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              style={btnStyle}
              onClick={() => form.name && form.country && setStep(1)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "1.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              Your finances
            </h2>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Current savings (₦)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="e.g. 3800000"
                value={form.savings}
                onChange={(e) => update("savings", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Monthly savings rate (₦)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="e.g. 150000"
                value={form.monthlySavings}
                onChange={(e) => update("monthlySavings", e.target.value)}
              />
            </div>
            <button
              style={btnStyle}
              onClick={() => form.savings && form.monthlySavings && setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#EAF3DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
                fontSize: "24px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              You're all set, {form.name}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                lineHeight: "1.7",
                marginBottom: "0.5rem",
              }}
            >
              Target country: <strong>{form.country}</strong>
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                lineHeight: "1.7",
              }}
            >
              Current savings:{" "}
              <strong>₦{parseFloat(form.savings).toLocaleString()}</strong>
            </p>
            <button style={btnStyle} onClick={handleFinish}>
              Calculate my Japa Score
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
