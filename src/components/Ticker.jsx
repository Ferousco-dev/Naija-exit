export default function Ticker({ fxRates, signals, score, compact = false }) {
  // Helper function to format last updated time
  const getLastUpdatedLabel = () => {
    if (!fxRates?.lastUpdated) return null;

    if (fxRates.lastUpdated === "offline") {
      return "  ·  Offline mode";
    }

    try {
      const lastUpdate = new Date(fxRates.lastUpdated);
      const now = new Date();
      const hoursAgo = Math.floor((now - lastUpdate) / 1000 / 60 / 60);

      let label;
      if (hoursAgo === 0) {
        label = "just now";
      } else if (hoursAgo === 1) {
        label = "1 hour ago";
      } else {
        label = hoursAgo + " hours ago";
      }

      return "  ·  Updated " + label;
    } catch (err) {
      return null;
    }
  };

  const items = [
    fxRates?.USD
      ? `₦/USD  ${parseFloat(
          fxRates.USD
        ).toLocaleString()}${getLastUpdatedLabel()}`
      : null,
    fxRates?.GBP ? `₦/GBP  ${parseFloat(fxRates.GBP).toLocaleString()}` : null,
    signals?.bayse?.politicalTension !== undefined
      ? `Political risk  ${Math.round(
          (signals.bayse.politicalTension || 0) * 100
        )}% tension`
      : null,
    signals?.bayse?.cryptoBullishness !== undefined
      ? `Crypto bullishness  ${Math.round(
          (signals.bayse.cryptoBullishness || 0) * 100
        )}%`
      : null,
    signals?.bayse?.totalMarketsAnalyzed !== undefined
      ? `Bayse markets  ${signals.bayse.totalMarketsAnalyzed || 0}`
      : null,
    score ? `Japa Score  ${score}/100` : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "18px" : "32px",
        padding: compact ? "10px 14px" : "10px 24px",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-secondary)",
        overflowX: "auto",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            whiteSpace: "nowrap",
            fontSize: compact ? "11px" : "12px",
            color: "var(--color-text-secondary)",
            flexShrink: 0,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
