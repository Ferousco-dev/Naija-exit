import { useEffect, useMemo, useState } from "react";
import { calculateJapaScore, getScoreStatus } from "../utils/scoreEngine";
import { getBayseHistory } from "../utils/storage";

const clamp = (value) => Math.min(1, Math.max(0, value));

const getSignalTone = (signal) => {
  if (signal === "bullish") {
    return {
      color: "#3B6D11",
      bg: "rgba(59, 109, 17, 0.15)",
      border: "rgba(59, 109, 17, 0.35)",
      label: "Bullish",
    };
  }
  if (signal === "bearish") {
    return {
      color: "#A32D2D",
      bg: "rgba(163, 45, 45, 0.16)",
      border: "rgba(163, 45, 45, 0.35)",
      label: "Bearish",
    };
  }
  return {
    color: "#BA7517",
    bg: "rgba(186, 117, 23, 0.14)",
    border: "rgba(186, 117, 23, 0.32)",
    label: "Neutral",
  };
};

const getConfidenceTone = (label) => {
  if (label === "high") return { color: "#3B6D11", bg: "#EAF3DE" };
  if (label === "medium") return { color: "#BA7517", bg: "#FAEEDA" };
  return { color: "#A32D2D", bg: "#FCEBEB" };
};

const getSentimentBand = (value) => {
  if (value >= 68) return "Bullish";
  if (value <= 38) return "Bearish";
  return "Balanced";
};

const MetricCard = ({ title, value, sub, accent }) => (
  <div
    style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "12px",
      padding: "14px",
      minHeight: "92px",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        color: "var(--color-text-secondary)",
        marginBottom: "6px",
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: "24px",
        fontWeight: "600",
        color: accent || "var(--color-text-primary)",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "11px",
        color: "var(--color-text-secondary)",
        marginTop: "8px",
      }}
    >
      {sub}
    </div>
  </div>
);

export default function BayseIntelligenceStudio({
  signals,
  currentScore,
  compact = false,
}) {
  const bayse = signals?.bayse;
  const [simulatedSentiment, setSimulatedSentiment] = useState(
    Math.round((signals?.bayse?.sentimentScore || 0.5) * 100),
  );
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!bayse) return;
    setSimulatedSentiment(Math.round((bayse.sentimentScore || 0.5) * 100));
  }, [bayse?.sentimentScore]);

  useEffect(() => {
    if (!bayse) return;
    setHistory(getBayseHistory());
  }, [bayse?.sentimentScore, bayse?.lastUpdated]);

  const recentHistory = useMemo(() => history.slice(-7), [history]);
  const sentimentTrend = useMemo(() => {
    if (recentHistory.length < 2) return 0;
    const oldest = recentHistory[0]?.sentimentScore || 0;
    const latest = recentHistory[recentHistory.length - 1]?.sentimentScore || 0;
    return Math.round((latest - oldest) * 100);
  }, [recentHistory]);

  const simulatedScore = useMemo(() => {
    return calculateJapaScore({
      savingsProgress: (signals.savings?.value || 0) / 100,
      fxTrendScore: signals.fx?.score || 0.5,
      velocityScore: signals.velocity?.score || 0.1,
      bayseScore: clamp(simulatedSentiment / 100),
    });
  }, [signals, simulatedSentiment]);

  const projectedStatus = getScoreStatus(simulatedScore);
  const scoreDelta = simulatedScore - (currentScore || simulatedScore);
  const sentimentBand = getSentimentBand(simulatedSentiment);

  if (!bayse) return null;

  const baysePoints = Math.round((bayse.sentimentScore || 0.5) * 300) / 10;
  const confidencePercent = Math.round(
    (bayse.confidenceScore ?? bayse.marketActivity ?? 0.5) * 100,
  );
  const tone = getSignalTone(bayse.signal);
  const confidenceTone = getConfidenceTone(bayse.confidenceLabel);

  return (
    <div
      style={{
        background:
          "linear-gradient(160deg, rgba(59, 109, 17, 0.11), rgba(59, 109, 17, 0.04) 35%, rgba(10, 10, 10, 0.02) 100%)",
        border: "0.5px solid rgba(59, 109, 17, 0.3)",
        borderRadius: "var(--border-radius-lg)",
        padding: compact ? "16px" : "18px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
          >
            Bayse Intelligence Studio
          </div>
          <div
            style={{
              fontSize: compact ? "18px" : "20px",
              fontWeight: "600",
              color: "var(--color-text-primary)",
            }}
          >
            Your score impact from live Bayse markets
          </div>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "600",
            color: confidenceTone.color,
            background: confidenceTone.bg,
          }}
        >
          Confidence {confidencePercent}% ({bayse.confidenceLabel || "low"})
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <MetricCard
          title="Bayse Contribution"
          value={`${baysePoints}/30`}
          sub="points currently added to your Japa score"
          accent={tone.color}
        />
        <MetricCard
          title="Markets Analyzed"
          value={bayse.totalMarketsAnalyzed || 0}
          sub={`${Math.round((bayse.marketActivity || 0) * 100)}% market activity`}
        />
        <MetricCard
          title="Sentiment Trend"
          value={`${sentimentTrend >= 0 ? "+" : ""}${sentimentTrend}`}
          sub={
            recentHistory.length > 1
              ? "change across your last 7 snapshots"
              : "trend builds as you keep using the app"
          }
          accent={sentimentTrend >= 0 ? "#3B6D11" : "#A32D2D"}
        />
      </div>

      <div
        style={{
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          borderRadius: "12px",
          padding: "10px 12px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: tone.color,
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          Live Signal: {tone.label}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--color-text-primary)",
            lineHeight: 1.5,
          }}
        >
          {bayse.topSignal || "Waiting for Bayse signal"}
        </div>
      </div>

      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "12px",
          padding: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--color-text-secondary)",
            marginBottom: "8px",
          }}
        >
          What-if Bayse simulator
        </div>
        <div
          style={{
            display: "flex",
            alignItems: compact ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: compact ? "column" : "row",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
            Sentiment score:{" "}
            <span style={{ fontWeight: "600", color: "#3B6D11" }}>
              {simulatedSentiment}%
            </span>{" "}
            ({sentimentBand})
          </div>
          <div
            style={{
              fontSize: "12px",
              color: scoreDelta >= 0 ? "#3B6D11" : "#A32D2D",
              fontWeight: "600",
            }}
          >
            Projected delta {scoreDelta >= 0 ? "+" : ""}
            {scoreDelta}
          </div>
        </div>
        <input
          type="range"
          min="10"
          max="90"
          step="1"
          value={simulatedSentiment}
          onChange={(event) =>
            setSimulatedSentiment(Number(event.target.value))
          }
          style={{ width: "100%", accentColor: "#3B6D11", cursor: "pointer" }}
        />
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            Bayse sentiment directly adjusts 30% of your total score weight.
          </div>
          <div
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: projectedStatus.color,
              whiteSpace: "nowrap",
            }}
          >
            {simulatedScore}/100
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {Array.isArray(bayse.categoryBreakdown) &&
          bayse.categoryBreakdown.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {bayse.categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-tertiary)",
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {item.category}: {Math.round((item.marketShare || 0) * 100)}%
                </div>
              ))}
            </div>
          )}
        {Array.isArray(bayse.sampleEvents) && bayse.sampleEvents.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: compact
                ? "minmax(0, 1fr)"
                : "repeat(2, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            {bayse.sampleEvents.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                style={{
                  background: "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: "10px",
                  padding: "10px",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
