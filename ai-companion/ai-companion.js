/**
 * AI Portfolio Companion — Ashutosh Giri
 * Vanilla JS modular widget integrating with the Go + Python AI backend.
 */
(function () {
  const INITIAL_GREETING =
    "Hey! I'm Ashutosh's AI companion.\n\nCurious about his engineering journey, projects or technical skills? Ask me anything. I can also help you explore how his experience aligns with a role you're hiring for.";

  const state = {
    isOpen: false,
    mode: "chat", // "chat" | "jd"
    conversationId: "",
    activeCategory: 0,
    isStreaming: false,
    abortController: null,
    lastUserMessage: ""
  };

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMarkdown(raw) {
    let text = escapeHtml(raw || "");

    // Fenced code blocks
    text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    // Inline code
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Headings
    text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    const lines = text.split("\n");
    const out = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push(`<li>${bulletMatch[1]}</li>`);
      } else {
        if (inList) {
          out.push("</ul>");
          inList = false;
        }
        if (trimmed === "") {
          continue;
        } else if (
          trimmed.startsWith("<h") ||
          trimmed.startsWith("<pre>") ||
          trimmed.startsWith("</pre>")
        ) {
          out.push(trimmed);
        } else {
          out.push(`<p>${trimmed}</p>`);
        }
      }
    }
    if (inList) out.push("</ul>");
    return out.join("");
  }

  function buildUI() {
    // 2. Floating Chat Panel
    const panel = createEl("aside", "ai-panel");
    panel.setAttribute("aria-label", "AI Companion Chat");

    // Header
    const header = createEl("div", "ai-header");
    const headerId = createEl("div", "ai-header-id");
    const headerOrb = window.AIOrb.createMini(22);
    const headerMeta = createEl("div");
    headerMeta.append(
      createEl("div", "ai-header-title", "Ashutosh's AI"),
      createEl("div", "ai-header-sub", "Recruiter Companion · Groq")
    );
    headerId.append(headerOrb, headerMeta);

    const headerActions = createEl("div", "ai-header-actions");
    const jdToggleBtn = createEl("button", "ai-icon-btn", "Analyze JD");
    jdToggleBtn.type = "button";
    jdToggleBtn.title = "Analyze a Job Description";

    const resetBtn = createEl("button", "ai-icon-btn", "Reset");
    resetBtn.type = "button";
    resetBtn.title = "Reset conversation";

    const closeBtn = createEl("button", "ai-icon-btn", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Minimize chat");
    closeBtn.style.fontSize = "0.95rem";

    headerActions.append(jdToggleBtn, resetBtn, closeBtn);
    header.append(headerId, headerActions);

    // Quick Questions
    const quickWrap = createEl("div", "ai-quick-wrap");
    const quickTabs = createEl("div", "ai-quick-tabs");
    const quickChips = createEl("div", "ai-quick-chips");
    quickWrap.append(quickTabs, quickChips);

    // Messages
    const msgList = createEl("div", "ai-messages");

    // Chat Input
    const inputWrap = createEl("form", "ai-input-wrap");
    const textarea = createEl("textarea", "ai-textarea");
    textarea.placeholder = "Ask about skills, KrishiSetu, Go, or role fit...";
    textarea.rows = 1;
    const sendBtn = createEl("button", "ai-send-btn", "Send");
    sendBtn.type = "submit";
    inputWrap.append(textarea, sendBtn);

    // JD Analysis View
    const jdView = createEl("div", "ai-jd-view");
    const jdIntro = createEl(
      "p",
      null,
      "Paste a job description below to evaluate alignment against Ashutosh's profile using the AI matching engine."
    );
    jdIntro.style.fontSize = "0.76rem";
    jdIntro.style.color = "var(--t2)";

    const jdTextarea = createEl("textarea", "ai-jd-textarea");
    jdTextarea.placeholder = "Paste full job description here (minimum 20 characters)...";

    const jdActions = createEl("div");
    jdActions.style.display = "flex";
    jdActions.style.gap = "8px";
    const jdAnalyzeBtn = createEl("button", "ai-send-btn", "Analyze Fit");
    jdAnalyzeBtn.type = "button";
    const jdBackBtn = createEl("button", "ai-icon-btn", "Back to Chat");
    jdBackBtn.type = "button";
    jdBackBtn.style.height = "38px";
    jdActions.append(jdAnalyzeBtn, jdBackBtn);

    const jdResult = createEl("div");
    jdResult.style.display = "flex";
    jdResult.style.flexDirection = "column";
    jdResult.style.gap = "0.65rem";

    jdView.append(jdIntro, jdTextarea, jdActions, jdResult);

    panel.append(header, quickWrap, msgList, inputWrap, jdView);
    document.body.append(panel);

    return {
      panel,
      jdToggleBtn,
      resetBtn,
      closeBtn,
      quickWrap,
      quickTabs,
      quickChips,
      msgList,
      inputWrap,
      textarea,
      sendBtn,
      jdView,
      jdTextarea,
      jdAnalyzeBtn,
      jdBackBtn,
      jdResult
    };
  }

  function init() {
    const ui = buildUI();
    const categories = window.AI_QUICK_QUESTIONS || [];
    let orb = null;

    function scrollToBottom() {
      ui.msgList.scrollTop = ui.msgList.scrollHeight;
    }

    function appendMessage(role, content, { streaming = false } = {}) {
      const wrapper = createEl("div", `ai-msg ${role}`);
      const bubble = createEl("div", "ai-bubble");

      if (streaming && !content) {
        const typing = createEl("div", "ai-typing");
        typing.append(createEl("span"), createEl("span"), createEl("span"));
        bubble.append(typing);
      } else if (role === "assistant") {
        bubble.innerHTML = renderMarkdown(content);
      } else {
        bubble.textContent = content;
      }

      wrapper.append(bubble);

      let copyBtn = null;
      if (role === "assistant") {
        const actions = createEl("div", "ai-msg-actions");
        copyBtn = createEl("button", "ai-action-link", "Copy");
        copyBtn.type = "button";
        copyBtn.addEventListener("click", async () => {
          const textToCopy = bubble.dataset.raw || bubble.textContent || "";
          try {
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.textContent = "Copied";
            setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
          } catch {
            copyBtn.textContent = "Failed";
          }
        });
        actions.append(copyBtn);
        wrapper.append(actions);
      }

      bubble.dataset.raw = content || "";
      ui.msgList.append(wrapper);
      scrollToBottom();
      return { wrapper, bubble };
    }

    function appendError(errMsg, retryFn) {
      const box = createEl("div", "ai-error-box");
      const msg = createEl("span", null, errMsg);
      const retry = createEl("button", "ai-icon-btn", "Retry");
      retry.type = "button";
      retry.addEventListener("click", () => {
        box.remove();
        retryFn();
      });
      box.append(msg, retry);
      ui.msgList.append(box);
      scrollToBottom();
    }

    function renderQuickQuestions() {
      ui.quickTabs.innerHTML = "";
      ui.quickChips.innerHTML = "";
      if (!categories.length) return;

      categories.forEach((cat, idx) => {
        const tab = createEl(
          "button",
          `ai-qtab${idx === state.activeCategory ? " active" : ""}`,
          cat.category
        );
        tab.type = "button";
        tab.addEventListener("click", () => {
          state.activeCategory = idx;
          renderQuickQuestions();
        });
        ui.quickTabs.append(tab);
      });

      const current = categories[state.activeCategory];
      if (!current) return;
      current.questions.forEach((q) => {
        const chip = createEl("button", "ai-qchip", q);
        chip.type = "button";
        chip.addEventListener("click", () => {
          if (state.mode !== "chat") setMode("chat");
          sendUserMessage(q);
        });
        ui.quickChips.append(chip);
      });
    }

    function setOpen(open) {
      state.isOpen = open;
      ui.panel.classList.toggle("open", open);
      orb.setHidden(open);
      if (!open) orb.focus();
      if (open && state.mode === "chat") {
        setTimeout(() => ui.textarea.focus(), 200);
      }
    }

    function setMode(mode) {
      state.mode = mode;
      const isJD = mode === "jd";
      ui.jdView.classList.toggle("active", isJD);
      ui.jdToggleBtn.classList.toggle("active", isJD);
      ui.quickWrap.style.display = isJD ? "none" : "block";
      ui.msgList.style.display = isJD ? "none" : "flex";
      ui.inputWrap.style.display = isJD ? "none" : "flex";
    }

    async function sendUserMessage(rawText, { skipUserBubble = false } = {}) {
      const text = (rawText || "").trim();
      if (!text || state.isStreaming) return;

      state.lastUserMessage = text;
      if (!skipUserBubble) {
        appendMessage("user", text);
      }

      state.isStreaming = true;
      ui.sendBtn.disabled = true;
      const { bubble } = appendMessage("assistant", "", { streaming: true });

      let accumulated = "";
      state.abortController = new AbortController();

      try {
        await window.AICompanionAPI.streamChat(state.conversationId, text, {
          signal: state.abortController.signal,
          onDelta: (delta, convId) => {
            if (convId) state.conversationId = convId;
            accumulated += delta;
            bubble.dataset.raw = accumulated;
            bubble.innerHTML = renderMarkdown(accumulated);
            scrollToBottom();
          },
          onDone: (convId) => {
            if (convId) state.conversationId = convId;
            if (!accumulated.trim()) {
              bubble.textContent = "No response was generated.";
            }
          },
          onError: (err) => {
            throw err;
          }
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          bubble.parentElement.remove();
          appendError(err.message || "Unable to reach AI companion.", () =>
            sendUserMessage(text, { skipUserBubble: true })
          );
        }
      } finally {
        state.isStreaming = false;
        state.abortController = null;
        ui.sendBtn.disabled = false;
        ui.textarea.focus();
      }
    }

    function renderJobReport(data) {
      ui.jdResult.innerHTML = "";
      const jd = data.parsed_job_description || {};
      const match = data.match_report || {};

      const addSection = (title, contentEl) => {
        const card = createEl("div", "ai-jd-card");
        card.append(createEl("div", "ai-jd-label", title), contentEl);
        ui.jdResult.append(card);
      };

      const addTagList = (title, items, variant) => {
        const wrap = createEl("div", "ai-jd-tags");
        if (!items || !items.length) {
          wrap.append(createEl("span", "ai-jd-tag", "None listed"));
        } else {
          items.forEach((item) => {
            wrap.append(createEl("span", `ai-jd-tag ${variant || ""}`, item));
          });
        }
        addSection(title, wrap);
      };

      const addBullets = (title, items) => {
        const ul = createEl("ul", "ai-jd-list");
        if (!items || !items.length) {
          ul.append(createEl("li", null, "None identified."));
        } else {
          items.forEach((item) => ul.append(createEl("li", null, item)));
        }
        addSection(title, ul);
      };

      addSection(
        "Job Title",
        createEl("div", null, jd.job_title || "Not specified")
      );
      addTagList("Required Skills", jd.required_skills);
      addTagList("Preferred Skills", jd.preferred_skills);
      addTagList("Matching Skills", match.matching_skills, "match");
      addTagList("Missing / Unverified Required Skills", match.missing_required_skills, "miss");
      addTagList("Matching Preferred Skills", match.matching_preferred_skills, "match");

      const projUl = createEl("ul", "ai-jd-list");
      if (!match.relevant_projects || !match.relevant_projects.length) {
        projUl.append(createEl("li", null, "No directly relevant projects identified."));
      } else {
        match.relevant_projects.forEach((p) => {
          const li = createEl("li");
          const strong = createEl("strong", null, `${p.project_name}: `);
          li.append(strong, document.createTextNode(p.reason));
          projUl.append(li);
        });
      }
      addSection("Relevant Projects", projUl);

      addBullets("Strengths", match.strengths);
      addBullets("Gaps", match.gaps);

      const assessP = createEl("p", null, match.overall_assessment || "");
      assessP.style.fontSize = "0.78rem";
      assessP.style.lineHeight = "1.6";
      assessP.style.color = "var(--t1)";
      addSection("Overall Assessment", assessP);
    }

    // Event Bindings
    orb = window.AIOrb.create({
      size: 62,
      label: "Ask my AI",
      labelMode: "subtle",
      ariaLabel: "Open Ashutosh's AI companion",
      onClick: () => setOpen(true)
    });
    ui.closeBtn.addEventListener("click", () => setOpen(false));
    ui.jdToggleBtn.addEventListener("click", () =>
      setMode(state.mode === "jd" ? "chat" : "jd")
    );
    ui.jdBackBtn.addEventListener("click", () => setMode("chat"));

    ui.resetBtn.addEventListener("click", async () => {
      if (state.abortController) state.abortController.abort();
      const prevId = state.conversationId;
      state.conversationId = "";
      ui.msgList.innerHTML = "";
      appendMessage("assistant", INITIAL_GREETING);
      if (prevId) {
        try {
          await window.AICompanionAPI.resetConversation(prevId);
        } catch {
          // Non-fatal: new conversation ID will be created on next turn
        }
      }
    });

    ui.inputWrap.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = ui.textarea.value;
      ui.textarea.value = "";
      ui.textarea.style.height = "auto";
      sendUserMessage(val);
    });

    ui.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        ui.inputWrap.requestSubmit();
      }
    });

    ui.textarea.addEventListener("input", () => {
      ui.textarea.style.height = "auto";
      ui.textarea.style.height = Math.min(ui.textarea.scrollHeight, 110) + "px";
    });

    ui.jdAnalyzeBtn.addEventListener("click", async () => {
      const jdText = ui.jdTextarea.value.trim();
      if (jdText.length < 20) {
        ui.jdResult.innerHTML = "";
        const err = createEl("div", "ai-error-box", "Please paste a full job description (at least 20 characters).");
        ui.jdResult.append(err);
        return;
      }
      ui.jdAnalyzeBtn.disabled = true;
      ui.jdAnalyzeBtn.textContent = "Analyzing...";
      ui.jdResult.innerHTML = "";
      const loading = createEl("div", "ai-jd-card", "Parsing job description and evaluating candidate fit...");
      loading.style.fontSize = "0.76rem";
      loading.style.color = "var(--t2)";
      ui.jdResult.append(loading);

      try {
        const report = await window.AICompanionAPI.analyzeJobDescription(jdText);
        renderJobReport(report);
      } catch (err) {
        ui.jdResult.innerHTML = "";
        const box = createEl("div", "ai-error-box", err.message || "Analysis failed.");
        ui.jdResult.append(box);
      } finally {
        ui.jdAnalyzeBtn.disabled = false;
        ui.jdAnalyzeBtn.textContent = "Analyze Fit";
      }
    });

    // Initial state
    renderQuickQuestions();
    appendMessage("assistant", INITIAL_GREETING);

    // Non-blocking health check for status dot
    window.AICompanionAPI.checkHealth()
      .then(() => orb.setStatus("online"))
      .catch(() => orb.setStatus("offline"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
