export default function Ticker({ fxRates, signals, score }) {
  const items = [
    fxRates ? `₦/USD  ${parseFloat(fxRates.USD).toLocaleString()}` : null,
    fxRates ? `₦/GBP  ${parseFloat(fxRates.GBP).toLocaleString()}` : null,
    signals
      ? `Bayse political risk  ${signals.political.value}% instability`
      : null,
    signals ? `BTC up odds  ${signals.crypto.value}%` : null,
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
