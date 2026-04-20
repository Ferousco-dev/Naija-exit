const Badge = ({ label, type }) => {
  const styles = {
    good: { background: "#EAF3DE", color: "#27500A" },
    warn: { background: "#FAEEDA", color: "#633806" },
    bad: { background: "#FCEBEB", color: "#501313" },
  };
  return (
    <div
      style={{
        fontSize: "10px",
        padding: "2px 8px",
        borderRadius: "var(--border-radius-md)",
        ...styles[type],
      }}
    >
      {label}
    </div>
  );
};

const getBadgeForSignal = (signal) => {
  if (signal === "strong" || signal === "good" || signal === "bullish") {
    return { label: "Strong", type: "good" };
  }
  if (signal === "caution" || signal === "neutral") {
    return { label: "Caution", type: "warn" };
  }
  return { label: "Weak", type: "bad" };
};

export default function SignalCards({ signals }) {
  if (!signals) return null;

  // Card 1: Savings Readiness
  const savingsCard = {
    name: "Savings Readiness",
    value: `${signals.savings.value}%`,
    sub: `₦${(
      (signals.savings.value / 100) *
      signals.savings.target
    ).toLocaleString()} of ₦${signals.savings.target.toLocaleString()} goal`,
    badge: getBadgeForSignal(
      signals.savings.value >= 65
        ? "strong"
        : signals.savings.value >= 40
        ? "caution"
        : "weak"
    ),
  };

  // Card 2: Savings Velocity
  let velocityArrow = "→";
  if (signals.velocity?.trend === "up") velocityArrow = "↑";
  else if (signals.velocity?.trend === "down") velocityArrow = "↓";

  const velocityCard = {
    name: "Savings Velocity",
    value: `₦${signals.velocity?.monthlyRate?.toLocaleString() || 0}/month`,
    sub: `${velocityArrow} ${Math.abs(
      signals.velocity?.trendPercent || 0
    )}% · Projected: ${signals.velocity?.projectedReadyDate}`,
    badge: getBadgeForSignal(signals.velocity?.signal || "weak"),
  };

  // Card 3: FX Trend
  let fxArrow = "→";
  let fxTrendLabel = "Stable";
  if (signals.fx?.direction === "strengthening") {
    fxArrow = "↓";
    fxTrendLabel = "Strengthening (good)";
  } else if (signals.fx?.direction === "weakening") {
    fxArrow = "↑";
    fxTrendLabel = "Weakening (risky)";
  }

  const fxCard = {
    name: "FX Trend",
    value: `₦${parseFloat(signals.fx?.currentRate || 0).toLocaleString()}`,
    sub: `${fxArrow} ${Math.abs(
      signals.fx?.sevenDayChange || 0
    )}% · ${fxTrendLabel} · ${
      signals.fx?.bestTimeToConvert ? "Good time to convert" : "Hold your Naira"
    }`,
    badge: getBadgeForSignal(signals.fx?.signal || "caution"),
  };

  // Card 4: Political Risk (from Bayse data)
  const politicalPercent = Math.round(
    (signals.bayse?.politicalTension || 0) * 100
  );
  const politicalCard = {
    name: "Political Risk",
    value: `${politicalPercent}%`,
    sub: "Tension odds · Bayse",
    badge: getBadgeForSignal(
      politicalPercent <= 35
        ? "strong"
        : politicalPercent <= 60
        ? "caution"
        : "weak"
    ),
  };

  // Card 5: Crypto Market (from Bayse data)
  const cryptoPercent = Math.round(
    (signals.bayse?.cryptoBullishness || 0) * 100
  );
  const cryptoCard = {
    name: "Crypto Market",
    value: `${cryptoPercent}%`,
    sub: "Bullishness odds · Bayse",
    badge: getBadgeForSignal(
      cryptoPercent >= 65 ? "strong" : cryptoPercent >= 40 ? "caution" : "weak"
    ),
  };

  const cards = [savingsCard, velocityCard, fxCard, politicalCard, cryptoCard];

  return (
    <div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "500",
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "12px",
        }}
      >
        Signal breakdown
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={card.name}
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "12px",
              ...(idx === 4 && { gridColumn: "1 / -1", maxWidth: "50%" }),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {card.name}
              </div>
              <Badge {...card.badge} />
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "var(--color-text-primary)",
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-text-secondary)",
                marginTop: "2px",
              }}
            >
              {card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
