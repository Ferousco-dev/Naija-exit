import React, { useState, useEffect } from "react";

const messages = [
  "Connecting to Bayse markets...",
  "Reading Nigerian political signals...",
  "Fetching live ₦ exchange rates...",
  "Analysing crypto sentiment...",
  "Scanning your savings data...",
  "Calculating FX trend (7 days)...",
  "Measuring savings velocity...",
  "Running Japa Score algorithm...",
  "Generating AI insight...",
  "Almost ready...",
];

export default function AILoader() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Cycle through messages every 1.5 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, []);

  // Blink cursor every 0.5 seconds
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        gap: "32px",
      }}
    >
      <style>{`
        @keyframes rotateSlowCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateMedCCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes rotateFastCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseCore {
          0%, 100% { transform: scale(0.85); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 95%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ai-loader-outer-ring {
          animation: rotateSlowCW 8s linear infinite;
        }
        .ai-loader-middle-ring {
          animation: rotateMedCCW 5s linear infinite;
        }
        .ai-loader-inner-ring {
          animation: rotateFastCW 3s linear infinite;
        }
        .ai-loader-core {
          animation: pulseCore 2s ease-in-out infinite;
        }
        .ai-loader-cursor {
          animation: blinkCursor 1s step-end infinite;
          display: ${showCursor ? "inline" : "none"};
        }
        .ai-loader-progress-fill {
          animation: fillProgress 12s ease-out forwards;
        }
      `}</style>

      {/* LAYER 1 — TOP: Branding */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#97BC62",
            }}
          />
          <h1
            style={{
              margin: 0,
              color: "#97BC62",
              fontSize: "20px",
              fontWeight: "600",
              letterSpacing: "0.05em",
            }}
          >
            Naija Exit
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            color: "#97BC62",
            fontSize: "12px",
            fontWeight: "500",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          AI-Powered Japa Intelligence
        </p>
      </div>

      {/* LAYER 2 — CENTER: The AI Brain Visual */}
      <div
        style={{
          position: "relative",
          width: "180px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer Ring */}
        <svg
          className="ai-loader-outer-ring"
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
          }}
          viewBox="0 0 180 180"
        >
          <circle
            cx="90"
            cy="90"
            r="80"
            fill="none"
            stroke="#2C5F2D"
            strokeWidth="2"
            strokeDasharray="8 4"
            opacity="0.4"
          />
        </svg>

        {/* Middle Ring */}
        <svg
          className="ai-loader-middle-ring"
          style={{
            position: "absolute",
            width: "140px",
            height: "140px",
          }}
          viewBox="0 0 140 140"
        >
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="#3B6D11"
            strokeWidth="2"
            opacity="0.6"
          />
        </svg>

        {/* Inner Ring */}
        <svg
          className="ai-loader-inner-ring"
          style={{
            position: "absolute",
            width: "100px",
            height: "100px",
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#97BC62"
            strokeWidth="2"
            strokeDasharray="6 3"
            opacity="1"
          />
        </svg>

        {/* Core Pulse */}
        <div
          className="ai-loader-core"
          style={{
            position: "absolute",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#97BC62",
            zIndex: 10,
          }}
        />
      </div>

      {/* LAYER 3 — BOTTOM: Live Scanning Text & Progress */}
      <div style={{ textAlign: "center", maxWidth: "320px" }}>
        {/* Cycling Status Message */}
        <p
          style={{
            margin: "0 0 24px 0",
            color: "#97BC62",
            fontSize: "15px",
            fontWeight: "500",
            minHeight: "24px",
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          {messages[currentMessageIndex]}
          <span className="ai-loader-cursor">|</span>
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: "280px",
            maxWidth: "100%",
            height: "4px",
            background: "#2C5F2D",
            borderRadius: "2px",
            overflow: "hidden",
            margin: "0 auto 16px",
          }}
        >
          <div
            className="ai-loader-progress-fill"
            style={{
              height: "100%",
              background: "#97BC62",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Attribution */}
        <p
          style={{
            margin: 0,
            color: "#6B7280",
            fontSize: "11px",
            fontWeight: "400",
            letterSpacing: "0.05em",
            opacity: 0.7,
          }}
        >
          Powered by Bayse API · ExchangeRate API · OpenAI
        </p>
      </div>
    </div>
  );
}
