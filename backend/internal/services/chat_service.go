package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"github.com/raaj2493/portfolio-ai-backend/internal/clients"
	"github.com/raaj2493/portfolio-ai-backend/internal/models"
)

const maxChatMessageChars = 4000

// ChatService coordinates chat requests and conversation IDs.
type ChatService struct {
	py *clients.PythonEngineClient
}

// NewChatService creates a new ChatService.
func NewChatService(py *clients.PythonEngineClient) *ChatService {
	return &ChatService{py: py}
}

// PrepareRequest validates and normalizes a ChatRequest, assigning a conversation ID if omitted.
func (s *ChatService) PrepareRequest(req models.ChatRequest) (models.ChatRequest, error) {
	msg := strings.TrimSpace(req.Message)
	if msg == "" {
		return req, errors.New("message is required")
	}
	if len(msg) > maxChatMessageChars {
		return req, errors.New("message exceeds maximum allowed length")
	}
	convID := strings.TrimSpace(req.ConversationID)
	if convID == "" {
		convID = newConversationID()
	}
	return models.ChatRequest{
		ConversationID: convID,
		Message:        msg,
	}, nil
}

// Chat executes a non-streaming chat turn via the Python AI engine.
func (s *ChatService) Chat(ctx context.Context, req models.ChatRequest) (*models.ChatResponse, error) {
	prepared, err := s.PrepareRequest(req)
	if err != nil {
		return nil, err
	}
	return s.py.Chat(ctx, prepared)
}

// ChatStream opens an SSE stream from the Python AI engine.
func (s *ChatService) ChatStream(ctx context.Context, req models.ChatRequest) (string, *http.Response, error) {
	prepared, err := s.PrepareRequest(req)
	if err != nil {
		return "", nil, err
	}
	resp, err := s.py.ChatStream(ctx, prepared)
	if err != nil {
		return "", nil, err
	}
	return prepared.ConversationID, resp, nil
}

// Reset clears the conversation history for a given conversation ID.
func (s *ChatService) Reset(ctx context.Context, convID string) (*models.ResetResponse, error) {
	id := strings.TrimSpace(convID)
	if id == "" {
		return nil, errors.New("conversation_id is required")
	}
	return s.py.ResetConversation(ctx, models.ResetRequest{ConversationID: id})
}

func newConversationID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "conv-default"
	}
	return "conv-" + hex.EncodeToString(b)
}
