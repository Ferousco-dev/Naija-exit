export default function Ticker({ fxRates, signals, score }) {
  const items = [
    fxRates?.USD ? `₦/USD  ${parseFloat(fxRates.USD).toLocaleString()}` : null,
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
    score ? `Japa Score  ${score}/100` : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "32px",
        padding: "10px 24px",
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
            fontSize: "12px",
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
