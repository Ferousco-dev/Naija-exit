import React, { useState, useEffect, useRef } from "react";

export default function AIInsight({ score, signals, user, status }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const hasFetched = useRef(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const userContext = `
User: ${user?.name}, Target: ${user?.country}
Savings: ₦${user?.savings?.toLocaleString()}, Monthly: ₦${user?.monthlySavings?.toLocaleString()}
Japa Score: ${score}/100 (${status?.label})
FX Rate: ₦${signals?.fx?.value}/USD
Political Risk: ${signals?.political?.value}%
Crypto Signal: ${signals?.crypto?.value}%`;

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
            }. The current ₦${signals.fx.value}/USD rate ${
              parseFloat(signals.fx.value) > 1600
                ? "suggests waiting before converting large sums"
                : "is relatively favorable for conversion"
            }. Bayse signals show ${
              signals.political.value
            }% political instability odds — ${
              signals.political.value > 50
                ? "another reason to accelerate your plans"
                : "moderate conditions for planning"
            }.`
          );
          setLoading(false);
          return;
        }
        const prompt = `
You are a Nigerian emigration finance advisor. Be concise, direct and culturally aware. Answer ONLY in English.

User profile:
- Name: ${user?.name}
- Target country: ${user?.country}
- Current savings: ₦${user?.savings?.toLocaleString()}
- Monthly savings rate: ₦${user?.monthlySavings?.toLocaleString()}
- Japa Score: ${score}/100 (${status?.label})

Live signals:
- Savings progress: ${signals.savings.value}% of relocation goal
- USD/NGN rate: ₦${signals.fx.value}
- Political instability odds (Bayse): ${signals.political.value}%
- BTC upward odds (Bayse): ${signals.crypto.value}%

Give a 2-3 sentence personalized insight about their Japa readiness. 
Mention the Bayse signals and FX rate specifically.
Tell them if now is a good or bad time to convert their Naira.
Be direct and practical. No fluff. Use ONLY English.
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
            }. The current ₦${signals.fx.value}/USD rate ${
              parseFloat(signals.fx.value) > 1600
                ? "suggests waiting before converting large sums"
                : "is relatively favorable for conversion"
            }. Bayse signals show ${
              signals.political.value
            }% political instability odds — ${
              signals.political.value > 50
                ? "another reason to accelerate your plans"
                : "moderate conditions for planning"
            }.`
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

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      const conversationHistory = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      conversationHistory.push({ role: "user", content: userMessage });

      const systemPrompt = `You are a Nigerian emigration finance advisor answering follow-up questions about a user's relocation readiness.

${userContext}

IMPORTANT: Answer ONLY in English. Do not use any other languages or code-switching.
Answer their questions directly, practically, and with cultural awareness. Reference their specific numbers and signals when relevant. Keep answers concise (1-2 sentences).`;

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
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory,
            ],
            max_tokens: 200,
            temperature: 0.7,
          }),
        }
      );

      if (!res.ok) {
        console.warn(`Chat API returned ${res.status}`);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process that. Try again?",
          },
        ]);
        setChatLoading(false);
        return;
      }

      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Try again?" },
      ]);
    }
    setChatLoading(false);
  };

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
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            max-height: 500px;
          }
          to {
            opacity: 0;
            max-height: 0;
          }
        }
        .chat-container {
          animation: slideDown 0.3s ease-out forwards;
          overflow: hidden;
        }
        .chat-closing {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>

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

      {/* Initial Insight */}
      {loading ? (
        <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
          Analyzing your signals...
        </div>
      ) : (
        <div
          style={{
            fontSize: "13px",
            color: "var(--color-text-primary)",
            lineHeight: 1.7,
            marginBottom: "14px",
          }}
        >
          {insight}
        </div>
      )}

      {/* Chat Button or Expanded Chat */}
      {!loading && (
        <>
          {!chatExpanded ? (
            <button
              onClick={() => setChatExpanded(true)}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#3B6D11";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "#3B6D11";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "var(--color-background-primary)";
                e.target.style.color = "var(--color-text-primary)";
                e.target.style.borderColor = "var(--color-border-tertiary)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Chat with AI
            </button>
          ) : (
            <div
              className="chat-container"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {/* Chat Messages Area */}
              <div
                style={{
                  overflowY: "auto",
                  maxHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingRight: "4px",
                }}
              >
                {chatMessages.length === 0 ? (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                      fontStyle: "italic",
                      textAlign: "center",
                      margin: "auto",
                    }}
                  >
                    Ask me anything...
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "7px 11px",
                          borderRadius: "8px",
                          background:
                            msg.role === "user"
                              ? "#3B6D11"
                              : "var(--color-background-tertiary)",
                          color:
                            msg.role === "user"
                              ? "#fff"
                              : "var(--color-text-primary)",
                          fontSize: "11px",
                          lineHeight: 1.4,
                          wordWrap: "break-word",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div
                    style={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <div
                      style={{
                        padding: "7px 11px",
                        borderRadius: "8px",
                        background: "var(--color-background-tertiary)",
                        color: "var(--color-text-secondary)",
                        fontSize: "11px",
                      }}
                    >
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ display: "flex", gap: "6px" }}>
                {/* Integrated Input with Send Button */}
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "20px",
                    border: "0.5px solid var(--color-border-tertiary)",
                    background: "var(--color-background-primary)",
                    paddingRight: chatInput.trim() ? "42px" : "10px",
                    transition: "paddingRight 0.2s ease",
                  }}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="Ask..."
                    autoFocus
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: "20px",
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-primary)",
                      fontSize: "11px",
                      outline: "none",
                    }}
                    disabled={chatLoading}
                  />
                  {/* Send Button - Inside Input */}
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      position: "absolute",
                      right: "6px",
                      padding: "5px",
                      borderRadius: "50%",
                      border: "none",
                      background:
                        chatLoading || !chatInput.trim()
                          ? "transparent"
                          : "#3B6D11",
                      color:
                        chatLoading || !chatInput.trim() ? "#d0d0d0" : "#fff",
                      cursor:
                        chatLoading || !chatInput.trim()
                          ? "default"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: chatInput.trim() ? 1 : 0,
                      width: chatInput.trim() ? "24px" : "0px",
                      height: "24px",
                      transition: "all 0.3s ease",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!chatLoading && chatInput.trim()) {
                        e.target.style.background = "#2d5609";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background =
                        !chatLoading && chatInput.trim()
                          ? "#3B6D11"
                          : "transparent";
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setChatExpanded(false)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "0.5px solid var(--color-border-tertiary)",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-secondary)",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Close chat"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
