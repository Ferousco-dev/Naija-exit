import React, { useState, useEffect, useRef } from "react";

export default function AIInsight({ score, signals, user, status }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!score || !signals || hasFetched.current) return;
    hasFetched.current = true;

    const fetchInsight = async () => {
      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey || apiKey === "your_groq_api_key_here") {
          setInsight(
            `With a Japa Score of ${score}/100, you're ${
              status?.label === "Ready to Japa"
                ? "in a strong position"
                : "building momentum"
            }. Your savings velocity shows ₦${signals?.velocity?.monthlyRate?.toLocaleString()}/month — ${
              signals?.velocity?.trend === "up"
                ? "accelerating nicely"
                : "keep pushing"
            }. Bayse sentiment (${Math.round(
              (signals?.bayse?.sentimentScore || 0) * 100
            )}%) suggests now is a ${
              signals?.bayse?.signal === "bullish" ? "favorable" : "cautious"
            } time for conversion.`
          );
          setLoading(false);
          return;
        }
        const prompt = `
You are a Nigerian emigration finance advisor called "Naija AI".
You are direct, culturally aware, and give specific actionable advice.
Never be vague. Always use real numbers from the data provided.

User profile:
- Name: ${user?.name}
- Target country: ${user?.country}
- Current savings: ₦${user?.savings?.toLocaleString()}
- Monthly savings rate: ₦${user?.monthlySavings?.toLocaleString()}
- Japa Score: ${score}/100 (${status?.label})

Live signal data:
- Savings progress: ${
          signals?.savings?.value
        }% of ₦${signals?.savings?.target?.toLocaleString()} goal
- Savings velocity: ₦${signals?.velocity?.monthlyRate?.toLocaleString()}/month 
  (${signals?.velocity?.trend} ${signals?.velocity?.trendPercent}%)
- Projected ready date: ${signals?.velocity?.projectedReadyDate}
- Current ₦/USD rate: ${signals?.fx?.currentRate}
- FX 7-day change: ${signals?.fx?.sevenDayChange}%
- FX direction: ${signals?.fx?.direction}
- FX volatility: ${signals?.fx?.volatility}
- Bayse political tension: ${Math.round(
          (signals?.bayse?.politicalTension || 0) * 100
        )}%
- Bayse crypto bullishness: ${Math.round(
          (signals?.bayse?.cryptoBullishness || 0) * 100
        )}%
- Bayse top signal: ${signals?.bayse?.topSignal}
- Bayse sentiment: ${signals?.bayse?.signal}

Generate a Japa Action Plan with EXACTLY 4 to 5 numbered steps.

Each step must:
- Start with a bold action word (e.g. "Convert now.", "Wait.", 
  "Increase savings.", "Prioritize visa.", "Watch Bayse.")
- Give a specific reason using the actual numbers above
- Be 1-2 sentences maximum
- Be direct and practical — no fluff

After the numbered steps add one final line:
"Next check-in: [suggest a specific date or condition to return, 
e.g. 'Return when ₦/USD drops below ₦1,580' or 'Check again in 2 weeks']"

Format your response as clean plain text.
Use this exact format:

1. [Bold action]. [Specific reason with numbers].
2. [Bold action]. [Specific reason with numbers].
3. [Bold action]. [Specific reason with numbers].
4. [Bold action]. [Specific reason with numbers].
5. [Bold action]. [Specific reason with numbers].

Next check-in: [condition or date]
        `;
        const res = await fetch(
          `https://api.groq.com/openai/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 256,
              temperature: 0.7,
            }),
          }
        );
        if (!res.ok) {
          console.warn(`Groq API returned ${res.status}, using fallback`);
          setInsight(
            `With a Japa Score of ${score}/100, you're ${
              status?.label === "Ready to Japa"
                ? "in a strong position"
                : "building momentum"
            }. Your savings velocity shows ₦${signals?.velocity?.monthlyRate?.toLocaleString()}/month — ${
              signals?.velocity?.trend === "up"
                ? "accelerating nicely"
                : "keep pushing"
            }. Bayse sentiment (${Math.round(
              (signals?.bayse?.sentimentScore || 0) * 100
            )}%) suggests now is a ${
              signals?.bayse?.signal === "bullish" ? "favorable" : "cautious"
            } time for conversion.`
          );
          setLoading(false);
          return;
        }
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        setInsight(text);
      } catch (err) {
        console.error("Groq fetch error:", err);
        setInsight(
          "Your score reflects strong savings but mixed market signals. Monitor the ₦ rate before converting."
        );
      }
      setLoading(false);
    };

    fetchInsight();
  }, [score, signals]);

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#639922",
          }}
        />
        <div
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "var(--color-text-secondary)",
          }}
        >
          AI insight · powered by Groq
        </div>
      </div>

      {/* Initial Insight - Action Plan */}
      {loading ? (
        <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
          Generating your action plan...
        </div>
      ) : (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-primary)",
            marginBottom: "14px",
          }}
        >
          {/* Parse and render action plan */}
          {(() => {
            const lines = insight.split("\n").filter((l) => l.trim());
            const steps = [];
            let checkInLine = null;

            for (const line of lines) {
              if (line.trim().startsWith("Next check-in:")) {
                checkInLine = line.trim().replace("Next check-in:", "").trim();
              } else if (/^\d+\./.test(line.trim())) {
                steps.push(line.trim());
              }
            }

            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* Action Plan Steps */}
                {steps.map((step, idx) => {
                  const match = step.match(/^(\d+)\.\s*(.+)/);
                  if (!match) return null;
                  const [, num, content] = match;
                  const parts = content.split(". ");
                  const action = (parts[0] || "").replace(/\*\*/g, "");
                  const reason = parts.slice(1).join(". ") || "";

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#3B6D11",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "600",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        {num}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            color: "var(--color-text-primary)",
                            fontSize: "12px",
                          }}
                        >
                          {action}
                        </div>
                        {reason && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-secondary)",
                              lineHeight: 1.5,
                            }}
                          >
                            {reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Next Check-In Box */}
                {checkInLine && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "var(--color-background-tertiary)",
                      border: "0.5px solid var(--color-border-tertiary)",
                      fontSize: "11px",
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                      📅 {checkInLine}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
