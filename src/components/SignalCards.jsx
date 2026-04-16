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

const getBadge = (value, invert = false) => {
  const v = invert ? 100 - value : value;
  if (v >= 65) return { label: "Strong", type: "good" };
  if (v >= 40) return { label: "Caution", type: "warn" };
  return { label: "Weak", type: "bad" };
};

export default function SignalCards({ signals }) {
  if (!signals) return null;

  const cards = [
    {
      name: "Savings",
      value: `${signals.savings.value}%`,
      sub: `₦${((signals.savings.value / 100) * signals.savings.target).toLocaleString()} of ₦${signals.savings.target.toLocaleString()} goal`,
      badge: getBadge(signals.savings.value),
    },
    {
      name: "FX Rate",
      value: `₦${parseFloat(signals.fx.value).toLocaleString()}`,
      sub: "Per USD · live rate",
      badge: getBadge(signals.fx.signal * 100),
    },
    {
      name: "Political risk",
      value: `${signals.political.value}%`,
      sub: "Instability odds · Bayse",
      badge: getBadge(signals.political.value, true),
    },
    {
      name: "Crypto market",
      value: `${signals.crypto.value}%`,
      sub: "BTC up odds · Bayse",
      badge: getBadge(signals.crypto.value),
    },
  ];

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
        {cards.map((card) => (
          <div
            key={card.name}
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "12px",
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
