import React, { useState, useRef, useEffect } from "react";

export default function FloatingChatBot({ user, score, signals, status }) {
  const [isExpanded, isSetExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const userContext = `
User: ${user?.name}, Target: ${user?.country}
Savings: ₦${user?.savings?.toLocaleString()}, Monthly: ₦${user?.monthlySavings?.toLocaleString()}
Japa Score: ${score}/100 (${status?.label})
Savings Velocity: ₦${signals?.velocity?.monthlyRate?.toLocaleString()}/month (${
    signals?.velocity?.trend
  })
FX Trend: ₦${signals?.fx?.currentRate}/USD, 7-day change: ${
    signals?.fx?.sevenDayChange
  }%
Bayse Sentiment Score: ${Math.round(
    (signals?.bayse?.sentimentScore || 0) * 100
  )}% (${signals?.bayse?.signal})
Political Tension: ${Math.round((signals?.bayse?.politicalTension || 0) * 100)}%
Crypto Bullishness: ${Math.round(
    (signals?.bayse?.cryptoBullishness || 0) * 100
  )}%`;

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
    <>
      <style>{`
        @keyframes expandButton {
          from {
            width: 60px;
          }
          to {
            width: 140px;
          }
        }
        .floating-chat-button {
          animation: expandButton 0.3s ease-out forwards;
        }
      `}</style>

      {/* Floating Chat Button */}
      <div
        onMouseEnter={() => {
          setIsHovering(true);
          isSetExpanded(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          if (!showChat) isSetExpanded(false);
        }}
        style={{
          position: "fixed",
          bottom: showChat ? "410px" : "100px",
          right: "16px",
          zIndex: 999,
          transition: "bottom 0.3s ease",
          display: showChat ? "none" : "block",
        }}
      >
        <button
          onClick={() => setShowChat(!showChat)}
          className={isExpanded ? "floating-chat-button" : ""}
          style={{
            width: isExpanded ? "140px" : "60px",
            height: "60px",
            borderRadius: "30px",
            border: "none",
            background: "#3B6D11",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isExpanded ? "10px" : "0",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(59, 109, 17, 0.3)",
            fontSize: "13px",
            fontWeight: "500",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 6px 16px rgba(59, 109, 17, 0.4)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "0 4px 12px rgba(59, 109, 17, 0.3)";
            e.target.style.transform = "scale(1)";
          }}
        >
          {isExpanded ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Chat
            </>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
              <path d="M9 9h6"></path>
              <path d="M9 13h6"></path>
              <circle cx="7" cy="9" r="0.5" fill="currentColor"></circle>
              <circle cx="17" cy="9" r="0.5" fill="currentColor"></circle>
              <path d="M8 20v2"></path>
              <path d="M16 20v2"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "16px",
            width: "320px",
            maxHeight: "500px",
            background: "var(--color-background-secondary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            zIndex: 998,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--color-text-primary)",
              }}
            >
              Naija AI
            </div>
            <button
              onClick={() => setShowChat(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                fontSize: "16px",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                  fontStyle: "italic",
                  textAlign: "center",
                  margin: "auto",
                }}
              >
                Ask me anything about your Japa journey...
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
                      maxWidth: "85%",
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
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
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

          {/* Input */}
          <div
            style={{
              borderTop: "0.5px solid var(--color-border-tertiary)",
              padding: "10px",
              display: "flex",
              gap: "6px",
            }}
          >
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
                  color: chatLoading || !chatInput.trim() ? "#d0d0d0" : "#fff",
                  cursor:
                    chatLoading || !chatInput.trim() ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: chatInput.trim() ? 1 : 0,
                  width: chatInput.trim() ? "24px" : "0px",
                  height: "24px",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
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
          </div>
        </div>
      )}
    </>
  );
}
