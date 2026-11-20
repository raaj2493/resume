/**
 * API client for the Go AI Companion backend.
 * Configure production API URL via:
 *   <meta name="ai-api-base" content="https://your-go-backend.example.com">
 * or window.AI_COMPANION_CONFIG = { apiBaseUrl: "https://..." }
 */
(function (global) {
  function resolveApiBaseUrl() {
    if (global.AI_COMPANION_CONFIG && global.AI_COMPANION_CONFIG.apiBaseUrl) {
      return global.AI_COMPANION_CONFIG.apiBaseUrl.replace(/\/+$/, "");
    }
    const meta = document.querySelector('meta[name="ai-api-base"]');
    if (meta && meta.content && meta.content.trim()) {
      return meta.content.trim().replace(/\/+$/, "");
    }
    const host = global.location && global.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "") {
      return "http://localhost:8081";
    }
    return "";
  }

  const BASE_URL = resolveApiBaseUrl();

  function apiUrl(path) {
    if (!BASE_URL) {
      throw new Error("AI backend URL is not configured for this environment.");
    }
    return BASE_URL + path;
  }

  async function checkHealth() {
    const res = await fetch(apiUrl("/api/v1/health"), { method: "GET" });
    if (!res.ok) throw new Error("Backend unavailable");
    return res.json();
  }

  async function resetConversation(conversationId) {
    const res = await fetch(apiUrl("/api/v1/conversations/reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId })
    });
    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(err.error || "Failed to reset conversation");
    }
    return res.json();
  }

  async function analyzeJobDescription(jobDescription) {
    const res = await fetch(apiUrl("/api/v1/jobs/analyze"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jobDescription })
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Job description analysis failed");
    }
    return data;
  }

  async function streamChat(conversationId, message, { onDelta, onDone, onError, signal }) {
    const res = await fetch(apiUrl("/api/v1/chat/stream"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        conversation_id: conversationId || "",
        message
      }),
      signal
    });

    if (!res.ok || !res.body) {
      const data = await safeJson(res);
      throw new Error(data.error || "Failed to connect to AI stream");
    }

    const headerConvId = res.headers.get("X-Conversation-Id");
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let currentEvent = "message";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "");
        if (line === "") {
          currentEvent = "message";
          continue;
        }
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          const rawData = line.slice(5).trim();
          if (!rawData) continue;
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            continue;
          }
          if (currentEvent === "error") {
            onError && onError(new Error(parsed.error || "Streaming error"));
            return;
          }
          if (currentEvent === "done") {
            onDone && onDone(parsed.conversation_id || headerConvId || conversationId);
            return;
          }
          if (parsed.delta) {
            onDelta && onDelta(parsed.delta, parsed.conversation_id || headerConvId);
          }
        }
      }
    }

    onDone && onDone(headerConvId || conversationId);
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  global.AICompanionAPI = {
    getBaseUrl: () => BASE_URL,
    checkHealth,
    resetConversation,
    analyzeJobDescription,
    streamChat
  };
})(window);
