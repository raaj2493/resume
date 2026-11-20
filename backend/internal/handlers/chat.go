package handlers

import (
	"bufio"
	"io"
	"net/http"

	"github.com/raaj2493/portfolio-ai-backend/internal/models"
	"github.com/raaj2493/portfolio-ai-backend/internal/services"
)

// ChatHandler handles chat, SSE streaming chat, and conversation reset endpoints.
type ChatHandler struct {
	svc      *services.ChatService
	maxBytes int64
}

// NewChatHandler creates a ChatHandler.
func NewChatHandler(svc *services.ChatService, maxBytes int64) *ChatHandler {
	return &ChatHandler{svc: svc, maxBytes: maxBytes}
}

// HandleChat handles POST /api/v1/chat.
func (h *ChatHandler) HandleChat(w http.ResponseWriter, r *http.Request) {
	var req models.ChatRequest
	if err := decodeJSON(w, r, h.maxBytes, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	resp, err := h.svc.Chat(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// HandleStream handles POST /api/v1/chat/stream using Server-Sent Events without buffering.
func (h *ChatHandler) HandleStream(w http.ResponseWriter, r *http.Request) {
	var req models.ChatRequest
	if err := decodeJSON(w, r, h.maxBytes, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	convID, upstream, err := h.svc.ChatStream(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	defer upstream.Body.Close()

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("X-Conversation-Id", convID)

	reader := bufio.NewReader(upstream.Body)
	for {
		line, err := reader.ReadBytes('\n')
		if len(line) > 0 {
			if _, werr := w.Write(line); werr != nil {
				return
			}
			flusher.Flush()
		}
		if err != nil {
			if err != io.EOF {
				_, _ = w.Write([]byte("event: error\ndata: {\"error\":\"stream interrupted\"}\n\n"))
				flusher.Flush()
			}
			return
		}
	}
}

// HandleReset handles POST /api/v1/conversations/reset.
func (h *ChatHandler) HandleReset(w http.ResponseWriter, r *http.Request) {
	var req models.ResetRequest
	if err := decodeJSON(w, r, h.maxBytes, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	resp, err := h.svc.Reset(r.Context(), req.ConversationID)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
