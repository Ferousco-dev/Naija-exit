export default function ScoreGauge({ score, status }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference * 0.75;
  const gap = circumference - filled;

  return (
    <div
      style={{
        position: "relative",
        width: "160px",
        height: "160px",
        flexShrink: 0,
      }}
    >
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#EAF3DE"
          strokeWidth="14"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={status?.color || "#3B6D11"}
          strokeWidth="14"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round"
          transform="rotate(-225 80 80)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text
          x="80"
          y="76"
          textAnchor="middle"
          fontSize="32"
          fontWeight="500"
          fill={status?.color || "#3B6D11"}
        >
          {score}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="11" fill="#888780">
          /100
        </text>
      </svg>
    </div>
  );
}
